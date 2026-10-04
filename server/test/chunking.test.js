import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkItems } from '../src/utils/chunking.js';

test('chunkItems preserves order and returns a final partial chunk', () => {
  assert.deepEqual(chunkItems([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunkItems([], 3), []);
  assert.throws(() => chunkItems([1], 0), RangeError);
});