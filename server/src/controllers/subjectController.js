import { z } from 'zod';
import { Subject } from '../models/Subject.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { Lecture } from '../models/Lecture.js';
import { removeFile } from '../storage/index.js';
import { ownedFilter } from '../utils/ownership.js';

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

export async function listSubjects(req, res) {
  const subjects = await Subject.find({ user: req.userId }).sort('name');
  res.json({ subjects });
}

export async function createSubject(req, res) {
  const input = subjectSchema.parse(req.body);
  const subject = await Subject.create({ ...input, user: req.userId });
  res.status(201).json({ subject });
}

export async function updateSubject(req, res) {
  const input = subjectSchema.partial().parse(req.body);
  if (!Object.keys(input).length) return res.status(400).json({ message: 'Provide a name or color to update.' });
  const subject = await Subject.findOneAndUpdate(ownedFilter(req.userId, req.params.id), input, { new: true, runValidators: true });
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ subject });
}

export async function deleteSubject(req, res) {
  const subject = await Subject.findOne(ownedFilter(req.userId, req.params.id));
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  const lectures = await Lecture.find({ user: req.userId, subject: subject.id }).select('audioFiles photos');
  const files = lectures.flatMap((lecture) => [...lecture.audioFiles, ...lecture.photos]);
  await Promise.all(files.map((file) => removeFile(file.storageType, file.storageKey, file.mimeType)));
  await Lecture.deleteMany({ user: req.userId, subject: subject.id });
  await TimetableSlot.deleteMany({ user: req.userId, subject: subject.id });
  await subject.deleteOne();
  res.status(204).end();
}

export async function getNotebook(req, res) {
  const subject = await Subject.findOne(ownedFilter(req.userId, req.params.id));
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  const lectures = await Lecture.find({ user: req.userId, subject: subject.id })
    .select('title date status error notes transcript photos')
    .sort({ date: 1, createdAt: 1 });
  const topics = new Map();
  for (const lecture of lectures) {
    for (const heading of lecture.notes.matchAll(/^#{1,3}\s+(.+)$/gm)) {
      const name = heading[1].trim();
      const key = name.toLowerCase();
      if (!topics.has(key)) topics.set(key, { name, lectures: [] });
      topics.get(key).lectures.push({ id: lecture.id, title: lecture.title, date: lecture.date });
    }
  }
  const latest = [...lectures].reverse().find((lecture) => lecture.status === 'done' && lecture.notes);
  res.json({ subject, lectures, topics: [...topics.values()], lastTimeCovered: latest ? {
    title: latest.title,
    date: latest.date,
    summary: latest.notes.replace(/^#{1,6}\s+/gm, '').slice(0, 420)
  } : null });
}

export async function getSubjectContinuity(req, res) {
  const subject = await Subject.findOne(ownedFilter(req.userId, req.params.id)).select('name');
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  const lecture = await Lecture.findOne({ user: req.userId, subject: subject.id, status: 'done', notes: { $ne: '' } }).sort({ date: -1, createdAt: -1 }).select('title date notes');
  res.json({ lastTimeCovered: lecture ? {
    title: lecture.title,
    date: lecture.date,
    summary: lecture.notes.replace(/^#{1,6}\s+/gm, '').slice(0, 420)
  } : null });
}

export async function searchNotes(req, res) {
  const query = z.string().trim().min(2).max(120).parse(req.query.q ?? '');
  const lectures = await Lecture.find({ user: req.userId, $text: { $search: query } })
    .select('title date status notes transcript subject')
    .populate('subject', 'name color')
    .sort({ score: { $meta: 'textScore' }, date: -1 })
    .limit(50);
  res.json({ results: lectures });
}