import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  storageKey: { type: String, required: true },
  storageType: { type: String, enum: ['local', 'cloudinary'], required: true },
  offsetMinutes: { type: Number, default: 0 }
}, { _id: true });

const segmentSchema = new mongoose.Schema({
  startSeconds: { type: Number, required: true },
  endSeconds: { type: Number, required: true },
  text: { type: String, required: true }
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['uploaded', 'transcribing', 'reading_board', 'writing_notes', 'done', 'failed'], default: 'uploaded', index: true },
  error: { type: String, default: '' },
  audioFiles: { type: [fileSchema], default: [] },
  photos: { type: [fileSchema], default: [] },
  transcript: { type: [segmentSchema], default: [] },
  boardText: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

lectureSchema.index({ user: 1, subject: 1, date: -1 });
lectureSchema.index({ notes: 'text', 'transcript.text': 'text' });

export const Lecture = mongoose.model('Lecture', lectureSchema);