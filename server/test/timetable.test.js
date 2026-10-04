import test from 'node:test';
import assert from 'node:assert/strict';
import { findCurrentSlot } from '../src/utils/timetable.js';
import { ownedFilter } from '../src/utils/ownership.js';

test('current slot matches weekday and includes its start but excludes its end', () => {
  const slots = [{ weekday: 1, startTime: '09:00', endTime: '10:00', subject: 'math' }];
  assert.equal(findCurrentSlot(slots, new Date(2026, 9, 5, 9, 0)), slots[0]);
  assert.equal(findCurrentSlot(slots, new Date(2026, 9, 5, 10, 0)), null);
  assert.equal(findCurrentSlot(slots, new Date(2026, 9, 6, 9, 30)), null);
});

test('resource filters always include the requesting owner', () => {
  assert.deepEqual(ownedFilter('user-a', 'subject-a'), { _id: 'subject-a', user: 'user-a' });
});