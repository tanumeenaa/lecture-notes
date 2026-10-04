export const transcriptionPrompt = `Transcribe the spoken audio faithfully. Return only a JSON array of objects with startSeconds, endSeconds, and text. Use approximate timestamps in seconds. Do not summarize or add facts.`;

export const boardPrompt = `Read all legible handwritten and printed text in this image. Include formulas and concise descriptions of diagrams. Preserve the writing as faithfully as possible. Mark uncertain content as [unclear] instead of guessing. Do not add context that is not visible.`;

export function notesPrompt({ subjectName, title, date, transcript, boardText, previousSummary = '' }) {
  return `Create structured Markdown notes for this lecture using only the supplied material. Never invent content. Preserve uncertainty as [unclear]. Organize related board content beside the transcript passage closest to its timestamp or photo offset. Include headings, key points, definitions, formulas, examples, and a short list of revision questions. Omit any section that has no supporting material.

Subject: ${subjectName}
Lecture: ${title}
Date: ${date}
Prior subject context, for continuity only:
${previousSummary || 'None supplied.'}

Timestamped transcript:
${transcript || 'No audio transcript supplied.'}

Board photos and extracted text (offsets in minutes from lecture start):
${boardText || 'No board photos supplied.'}`;
}