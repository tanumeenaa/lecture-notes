import { mkdir, rename, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

export async function saveLocalFile(file, userId) {
  const directory = path.join(root, String(userId));
  await mkdir(directory, { recursive: true });
  const filename = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  const target = path.join(directory, filename);
  await rename(file.path, target);
  return { storageKey: `${userId}/${filename}`, storageType: 'local' };
}

export async function readLocalFile(storageKey) {
  const target = path.resolve(root, storageKey);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage key.');
  return readFile(target);
}

export async function removeLocalFile(storageKey) {
  const target = path.resolve(root, storageKey);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage key.');
  await unlink(target).catch(() => {});
}

export async function removeTemporaryFile(file) {
  if (file?.path) await unlink(file.path).catch(() => {});
}