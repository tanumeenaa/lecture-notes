import { v2 as cloudinary } from 'cloudinary';
import { readFile, unlink } from 'node:fs/promises';

cloudinary.config({ secure: true });

export async function saveCloudinaryFile(file, userId) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `lecture-notes/${userId}`,
    resource_type: 'auto',
    type: 'authenticated'
  });
  await unlink(file.path).catch(() => {});
  return { storageKey: result.public_id, storageType: 'cloudinary' };
}

export async function readCloudinaryFile(storageKey, mimeType) {
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'video';
  const url = cloudinary.url(storageKey, { resource_type: resourceType, type: 'authenticated', secure: true, sign_url: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error('Stored file could not be retrieved.');
  return Buffer.from(await response.arrayBuffer());
}

export async function removeCloudinaryFile(storageKey, mimeType) {
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'video';
  await cloudinary.uploader.destroy(storageKey, { resource_type: resourceType, type: 'authenticated' });
}

export async function removeTemporaryFile(file) {
  if (file?.path) await unlink(file.path).catch(() => {});
}