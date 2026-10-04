import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('health endpoints are public and user data routes require a token', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const health = await fetch(`http://127.0.0.1:${address.port}/health`);
  const apiHealth = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  const privateRoute = await fetch(`http://127.0.0.1:${address.port}/api/subjects`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal(apiHealth.status, 200);
  assert.equal(privateRoute.status, 401);
});