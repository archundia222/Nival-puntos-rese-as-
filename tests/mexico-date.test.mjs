import test from 'node:test';
import assert from 'node:assert/strict';
import { dateInMexico, monthInMexico, offsetDateInMexico } from '../lib/mexico-date.ts';

test('dashboard date and month use Mexico City calendar near UTC midnight', () => {
  const justBeforeMexicoMidnight = new Date('2026-01-01T05:59:59.000Z');
  assert.equal(dateInMexico(justBeforeMexicoMidnight), '2025-12-31');
  assert.equal(monthInMexico(justBeforeMexicoMidnight), '2025-12');
  assert.equal(dateInMexico(new Date('2026-01-01T06:00:00.000Z')), '2026-01-01');
  assert.equal(offsetDateInMexico(1, justBeforeMexicoMidnight), '2026-01-01');
  assert.equal(offsetDateInMexico(-6, justBeforeMexicoMidnight), '2025-12-25');
});
