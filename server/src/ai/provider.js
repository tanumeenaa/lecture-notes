import { GoogleGenAI } from '@google/genai';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { env } from '../config/env.js';
import { boardPrompt, notesPrompt, transcriptionPrompt } from './prompts.js';

let client;

function getClient() {
  if (!env.GEMINI_API_KEY) throw new Error('Gemini is not configured. Add GEMINI_API_KEY to server/.env to process lectures.');
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

function responseText(response) {
  if (!response.text) throw new Error('The AI provider returned an empty response.');
  return response.text;
}

async function waitForUploadedFile(ai, uploadedFile) {
  let current = uploadedFile;
  const deadline = Date.now() + 60000;
  while (current.state === 'PROCESSING' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    current = await ai.files.get({ name: current.name });
  }
  if (current.state === 'FAILED') throw new Error(current.error?.message || 'Gemini could not process the uploaded audio.');
  if (current.state === 'PROCESSING') throw new Error('Gemini audio processing took too long. Try again with a shorter recording.');
  return current;
}

export function parseTranscript(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map((segment) => ({
      startSeconds: Math.max(0, Number(segment.startSeconds) || 0),
      endSeconds: Math.max(0, Number(segment.endSeconds) || 0),
      text: String(segment.text ?? '').trim()
    })).filter((segment) => segment.text);
  } catch {}
  return cleaned.split('\n').map((line) => {
    const match = line.match(/^\[?(\d{1,2}):(\d{2})\]?\s+(.+)$/);
    if (!match) return null;
    const startSeconds = Number(match[1]) * 60 + Number(match[2]);
    return { startSeconds, endSeconds: startSeconds + 30, text: match[3].trim() };
  }).filter(Boolean);
}

export async function transcribeAudio(buffer, mimeType) {
  const ai = getClient();
  let file;
  let temporaryDirectory;
  const parts = [{ text: transcriptionPrompt }];
  try {
    if (buffer.length <= 15 * 1024 * 1024) {
      parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
    } else {
      const extension = mimeType === 'audio/webm' ? '.webm' : mimeType === 'audio/wav' ? '.wav' : '.m4a';
      temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'lecture-audio-'));
      const filePath = path.join(temporaryDirectory, `recording${extension}`);
      await writeFile(filePath, buffer);
      file = await ai.files.upload({ file: filePath, config: { mimeType } });
      const readyFile = await waitForUploadedFile(ai, file);
      parts.push({ fileData: { fileUri: readyFile.uri, mimeType: readyFile.mimeType ?? mimeType } });
    }
    const response = await ai.models.generateContent({ model: env.GEMINI_MODEL, contents: [{ role: 'user', parts }] });
    return parseTranscript(responseText(response));
  } finally {
    if (file?.name) await ai.files.delete({ name: file.name }).catch(() => {});
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export async function extractBoardText(buffer, mimeType) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: boardPrompt }, { inlineData: { mimeType, data: buffer.toString('base64') } }] }]
  });
  return responseText(response);
}

export async function generateNotes(input) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: notesPrompt(input) }] }]
  });
  return responseText(response);
}