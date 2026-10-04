import { z } from 'zod';
import { Subject } from '../models/Subject.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { findCurrentSlot } from '../utils/timetable.js';

const slotSchema = z.object({
  subject: z.string().length(24),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
}).refine((slot) => slot.startTime < slot.endTime, { message: 'End time must be after start time.' });

export async function listSlots(req, res) {
  const slots = await TimetableSlot.find({ user: req.userId }).populate('subject', 'name color').sort({ weekday: 1, startTime: 1 });
  res.json({ slots });
}

export async function createSlot(req, res) {
  const input = slotSchema.parse(req.body);
  if (!(await Subject.exists({ _id: input.subject, user: req.userId }))) return res.status(404).json({ message: 'Subject not found.' });
  const slot = await TimetableSlot.create({ ...input, user: req.userId });
  await slot.populate('subject', 'name color');
  res.status(201).json({ slot });
}

export async function deleteSlot(req, res) {
  const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!slot) return res.status(404).json({ message: 'Timetable slot not found.' });
  res.status(204).end();
}

export async function currentLecture(req, res) {
  const slots = await TimetableSlot.find({ user: req.userId }).populate('subject', 'name color');
  const slot = findCurrentSlot(slots);
  res.json({ slot });
}