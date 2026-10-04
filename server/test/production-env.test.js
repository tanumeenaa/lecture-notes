import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionEnvironment } from '../src/config/productionEnv.js';

test('production startup rejects missing configuration', () => {
  assert.throws(() => validateProductionEnvironment({ NODE_ENV: 'production' }), /MONGODB_URI, JWT_SECRET, GEMINI_API_KEY/);
});

test('production startup rejects placeholder credentials and local MongoDB', () => {
  assert.throws(() => validateProductionEnvironment({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/lecture-notes',
    JWT_SECRET: ['development', 'secret', 'change', 'before', 'deploy'].join('-'),
    GEMINI_API_KEY: 'your-gemini-api-key'
  }), /MONGODB_URI, JWT_SECRET, GEMINI_API_KEY/);
});

test('production startup accepts configured service credentials', () => {
  assert.doesNotThrow(() => validateProductionEnvironment({
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://database.cluster.mongodb.net/lecture-notes',
    JWT_SECRET: 'production-secret'.repeat(2),
    GEMINI_API_KEY: 'configured-key'
  }));
});