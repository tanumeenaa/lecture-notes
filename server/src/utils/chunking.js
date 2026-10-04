export function chunkItems(items, size) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('Chunk size must be a positive integer.');
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}