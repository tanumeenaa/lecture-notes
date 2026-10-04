import test from 'node:test';
import assert from 'node:assert/strict';
import { runProcessingPipeline } from '../src/jobs/processLecture.js';

function makeLecture() {
  const statuses = [];
  return {
    statuses,
    audioFiles: [{ storageType: 'local', storageKey: 'audio', mimeType: 'audio/webm' }],
    photos: [{ storageType: 'local', storageKey: 'board', mimeType: 'image/png', offsetMinutes: 4 }],
    subject: { name: 'Physics' },
    title: 'Forces',
    date: new Date('2026-10-05T00:00:00.000Z'),
    save: async function save() { this.statuses.push(this.status); }
  };
}

test('pipeline saves every status transition and merges fake provider output', async () => {
  const lecture = makeLecture();
  const fakeAI = {
    transcribeAudio: async () => [{ startSeconds: 61, endSeconds: 80, text: 'Net force changes momentum.' }],
    extractBoardText: async () => 'F = ma',
    generateNotes: async ({ transcript, boardText, subjectName }) => `# ${subjectName}\n${transcript}\n${boardText}`
  };
  await runProcessingPipeline(lecture, fakeAI, async (_type, key) => Buffer.from(key), async () => 'Prior material');
  assert.deepEqual(lecture.statuses, ['transcribing', 'reading_board', 'writing_notes', 'done']);
  assert.match(lecture.notes, /\[1:01\] Net force/);
  assert.match(lecture.boardText, /\[\+4 min\] F = ma/);
});

test('pipeline stores a failure state and useful error text', async () => {
  const lecture = makeLecture();
  const fakeAI = { transcribeAudio: async () => { throw new Error('provider unavailable'); } };
  await runProcessingPipeline(lecture, fakeAI, async () => Buffer.from('audio'), async () => '');
  assert.equal(lecture.status, 'failed');
  assert.equal(lecture.error, 'provider unavailable');
  assert.deepEqual(lecture.statuses, ['transcribing', 'failed']);
});