import { env } from '../config/env.js';
import * as local from './local.js';
import * as cloudinary from './cloudinary.js';

const active = env.CLOUDINARY_URL ? cloudinary : local;

export function saveFile(file, userId) {
  return active.saveCloudinaryFile ? active.saveCloudinaryFile(file, userId) : active.saveLocalFile(file, userId);
}

export function readFile(storageType, storageKey, mimeType) {
  return storageType === 'cloudinary' ? cloudinary.readCloudinaryFile(storageKey, mimeType) : local.readLocalFile(storageKey);
}

export function removeFile(storageType, storageKey, mimeType) {
  return storageType === 'cloudinary' ? cloudinary.removeCloudinaryFile(storageKey, mimeType) : local.removeLocalFile(storageKey);
}

export function removeTemporaryFile(file) {
  return active.removeTemporaryFile(file);
}