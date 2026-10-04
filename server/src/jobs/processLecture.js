import * as provider from '../ai/provider.js';
import { Lecture } from '../models/Lecture.js';
import { readFile } from '../storage/index.js';
import { chunkItems } from '../utils/chunking.js';
import { env } from '../config/env.js';

const activeJobs = new Set();

export async function runProcessingPipeline(lecture, ai = provider, readStoredFile = readFile, loadPreviousSummary = findPreviousSummary) {
  const saveStatus = async (status) => {
    lecture.status = status;
    lecture.error = '';
    await lecture.save();
  };
  try {
    await saveStatus('transcribing');
    const transcriptChunks = [];
    for (const audioBatch of chunkItems(lecture.audioFiles, 2)) {
      for (const audio of audioBatch) {
        const buffer = await readStoredFile(audio.storageType, audio.storageKey);
        const segments = await ai.transcribeAudio(buffer, audio.mimeType);
        transcriptChunks.push(...segments);
      }
    }
    lecture.transcript = transcriptChunks;
    await saveStatus('reading_board');
    const boardEntries = await Promise.all(lecture.photos.map(async (photo) => {
      const buffer = await readStoredFile(photo.storageType, photo.storageKey);
      const text = await ai.extractBoardText(buffer, photo.mimeType);
      return `[+${photo.offsetMinutes} min] ${text}`;
    }));
    lecture.boardText = boardEntries.join('\n\n');
    await saveStatus('writing_notes');
    const transcriptText = transcriptChunks.map((segment) => {
      const minutes = Math.floor(segment.startSeconds / 60);
      const seconds = Math.floor(segment.startSeconds % 60).toString().padStart(2, '0');
      return `[${minutes}:${seconds}] ${segment.text}`;
    }).join('\n');
    const previousSummary = await loadPreviousSummary(lecture);
    lecture.notes = await ai.generateNotes({
      subjectName: lecture.subject?.name ?? 'Subject',
      title: lecture.title,
      date: lecture.date.toISOString().slice(0, 10),
      transcript: transcriptText,
      boardText: lecture.boardText,
      previousSummary
    });
    await saveStatus('done');
    return lecture;
  } catch (error) {
    lecture.status = 'failed';
    const message = error.message || 'Lecture processing failed.';
    lecture.error = env.GEMINI_API_KEY ? message.replaceAll(env.GEMINI_API_KEY, '[redacted]') : message;
    await lecture.save();
    return lecture;
  }
}

async function findPreviousSummary(lecture) {
  const subjectId = lecture.subject?._id ?? lecture.subject;
  const previous = await Lecture.findOne({
    user: lecture.user,
    subject: subjectId,
    _id: { $ne: lecture._id },
    date: { $lte: lecture.date },
    status: 'done',
    notes: { $ne: '' }
  }).sort({ date: -1, createdAt: -1 }).select('title notes');
  return previous ? `${previous.title}: ${previous.notes.slice(0, 1200)}` : '';
}

export function enqueueLecture(lectureId) {
  const key = String(lectureId);
  if (activeJobs.has(key)) return;
  activeJobs.add(key);
  setImmediate(async () => {
    try {
      const lecture = await Lecture.findById(lectureId).populate('subject', 'name');
      if (lecture && lecture.status !== 'done') await runProcessingPipeline(lecture);
    } finally {
      activeJobs.delete(key);
    }
  });
}