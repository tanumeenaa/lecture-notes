import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ }
}, { timestamps: true });

export const Subject = mongoose.model('Subject', subjectSchema);