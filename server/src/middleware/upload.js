import multer from 'multer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tempDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/tmp');
const audioTypes = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg']);
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isAllowedUpload(file) {
  const mimeType = file.mimetype.split(';', 1)[0].trim().toLowerCase();
  return file.fieldname === 'audio' ? audioTypes.has(mimeType)
    : file.fieldname === 'photos' ? imageTypes.has(mimeType)
      : false;
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, callback) => {
      await mkdir(tempDirectory, { recursive: true });
      callback(null, tempDirectory);
    },
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 200 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, callback) => callback(isAllowedUpload(file) ? null : new Error('Upload audio files or JPEG, PNG, and WebP images only.'), isAllowedUpload(file))
}).fields([{ name: 'audio', maxCount: 4 }, { name: 'photos', maxCount: 8 }]);