import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, createToken, readToken } from '../src/utils/auth.js';

test('passwords are hashed and can be verified without storing the original', async () => {
  const hash = await hashPassword('correct-horse-battery');
  assert.notEqual(hash, 'correct-horse-battery');
  assert.equal(await verifyPassword('correct-horse-battery', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('JWTs identify their owner and reject tampering', () => {
  const token = createToken('user-123');
  assert.equal(readToken(token).sub, 'user-123');
  assert.throws(() => readToken(`${token}x`));
});