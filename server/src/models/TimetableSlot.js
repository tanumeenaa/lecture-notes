import mongoose from 'mongoose';

const timetableSlotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  weekday: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }
}, { timestamps: true });

export const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);