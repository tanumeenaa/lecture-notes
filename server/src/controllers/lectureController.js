import { z } from 'zod';
import { Lecture } from '../models/Lecture.js';
import { Subject } from '../models/Subject.js';
import { readFile, saveFile, removeFile, removeTemporaryFile } from '../storage/index.js';
import { enqueueLecture } from '../jobs/processLecture.js';

const detailsSchema = z.object({
  subject: z.string().length(24),
  title: z.string().trim().min(1).max(120),
  date: z.coerce.date()
});

const notesSchema = z.object({ notes: z.string().max(100000) });

export async function createLecture(req, res) {
  const input = detailsSchema.parse(req.body);
  const audio = req.files?.audio ?? [];
  const photos = req.files?.photos ?? [];
  if (!audio.length && !photos.length) return res.status(400).json({ message: 'Add an audio recording, board photo, or both.' });
  if (!(await Subject.exists({ _id: input.subject, user: req.userId }))) {
    await Promise.all([...audio, ...photos].map(removeTemporaryFile));
    return res.status(404).json({ message: 'Subject not found.' });
  }
  let photoOffsets = [];
  try {
    photoOffsets = req.body.photoOffsets ? JSON.parse(req.body.photoOffsets) : [];
  } catch {
    await Promise.all([...audio, ...photos].map(removeTemporaryFile));
    return res.status(400).json({ message: 'Photo offsets must be valid JSON.' });
  }
  if (!Array.isArray(photoOffsets) || photoOffsets.some((value) => !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 1440)) {
    await Promise.all([...audio, ...photos].map(removeTemporaryFile));
    return res.status(400).json({ message: 'Photo offsets must be whole minutes between 0 and 1440.' });
  }
  const store = async (file, offsetMinutes = 0) => ({
    name: file.originalname,
    mimeType: file.mimetype.split(';', 1)[0].trim().toLowerCase(),
    size: file.size,
    ...await saveFile(file, req.userId),
    offsetMinutes
  });
  try {
    const [audioFiles, storedPhotos] = await Promise.all([
      Promise.all(audio.map((file) => store(file))),
      Promise.all(photos.map((file, index) => store(file, Number(photoOffsets[index] ?? 0))))
    ]);
    const lecture = await Lecture.create({ ...input, user: req.userId, audioFiles, photos: storedPhotos });
    enqueueLecture(lecture.id);
    res.status(201).json({ lecture });
  } catch (error) {
    await Promise.all([...audio, ...photos].map(removeTemporaryFile));
    throw error;
  }
}

export async function getLecture(req, res) {
  const lecture = await Lecture.findOne({ _id: req.params.id, user: req.userId }).populate('subject', 'name color');
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  res.json({ lecture });
}

export async function getLectureStatus(req, res) {
  const lecture = await Lecture.findOne({ _id: req.params.id, user: req.userId }).select('status error updatedAt');
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  res.json({ status: lecture.status, error: lecture.error, updatedAt: lecture.updatedAt });
}

export async function retryLecture(req, res) {
  const lecture = await Lecture.findOne({ _id: req.params.id, user: req.userId });
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  if (!['failed', 'uploaded'].includes(lecture.status)) return res.status(409).json({ message: 'This lecture is already being processed or is complete.' });
  lecture.status = 'uploaded';
  lecture.error = '';
  await lecture.save();
  enqueueLecture(lecture.id);
  res.json({ lecture });
}

export async function getLectureMedia(req, res) {
  const lecture = await Lecture.findOne({ _id: req.params.id, user: req.userId });
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  const file = [...lecture.audioFiles, ...lecture.photos].find((item) => String(item.id) === req.params.fileId);
  if (!file) return res.status(404).json({ message: 'File not found.' });
  const content = await readFile(file.storageType, file.storageKey, file.mimeType);
  res.type(file.mimeType).send(content);
}

export async function updateLectureNotes(req, res) {
  const { notes } = notesSchema.parse(req.body);
  const lecture = await Lecture.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { notes },
    { new: true }
  ).select('notes status updatedAt');
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  res.json({ lecture });
}

export async function exportLecture(req, res) {
  const lecture = await Lecture.findOne({ _id: req.params.id, user: req.userId }).populate('subject', 'name');
  if (!lecture) return res.status(404).json({ message: 'Lecture not found.' });
  const format = req.query.format ?? 'md';
  const filename = `${lecture.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'lecture'}-notes`;
  if (format === 'md') {
    res.type('text/markdown').attachment(`${filename}.md`).send(lecture.notes);
    return;
  }
  if (format !== 'pdf') return res.status(400).json({ message: 'Choose md or pdf export.' });
  const { default: PDFDocument } = await import('pdfkit');
  res.type('application/pdf').attachment(`${filename}.pdf`);
  const document = new PDFDocument({ margin: 54 });
  document.pipe(res);
  document.fontSize(18).text(lecture.title, { continued: false });
  document.fontSize(10).fillColor('#666666').text(`${lecture.subject.name} · ${lecture.date.toISOString().slice(0, 10)}`);
  document.moveDown().fillColor('#111111').fontSize(11).text(lecture.notes || 'No notes yet.', { width: 490, lineGap: 3 });
  document.end();
}