import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedUpload } from '../src/middleware/upload.js';

test('uploads accept only supported audio and image MIME types in their matching fields', () => {
  assert.equal(isAllowedUpload({ fieldname: 'audio', mimetype: 'audio/webm' }), true);
  assert.equal(isAllowedUpload({ fieldname: 'audio', mimetype: 'audio/webm;codecs=opus' }), true);
  assert.equal(isAllowedUpload({ fieldname: 'photos', mimetype: 'image/jpeg' }), true);
  assert.equal(isAllowedUpload({ fieldname: 'photos', mimetype: 'application/pdf' }), false);
  assert.equal(isAllowedUpload({ fieldname: 'audio', mimetype: 'image/png' }), false);
  assert.equal(isAllowedUpload({ fieldname: 'unexpected', mimetype: 'audio/wav' }), false);
});