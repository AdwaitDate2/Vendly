import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentSettingsSchema, computeAvailability, slotLabel, slotTimeFromLabel } from '../lib/appointment-slots.js';

// Thu Oct 1 2026, 12:00 in New York (16:00 UTC).
const now = new Date('2026-10-01T16:00:00Z');
const settings = (patch = {}) => appointmentSettingsSchema.parse({ leadHours: 0, maxDaysAhead: 14, ...patch });

test('slot labels round-trip', () => {
  assert.equal(slotLabel('16:30'), '4:30 PM');
  assert.equal(slotLabel('00:00'), '12:00 AM');
  assert.equal(slotTimeFromLabel('12:00 PM'), '12:00');
  assert.equal(slotTimeFromLabel('nonsense'), '');
});

test('closed weekdays and past times are not offered', () => {
  const days = computeAvailability(settings(), [], now);
  assert.deepEqual(days['2026-10-01'], ['12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM']);
  assert.equal(days['2026-10-04'], undefined); // Sunday is closed by default
  assert.equal(days['2026-10-05'].length, 6);
});

test('minimum notice hides near-term slots', () => {
  const days = computeAvailability(settings({ leadHours: 24 }), [], now);
  assert.equal(days['2026-10-01'], undefined);
  assert.deepEqual(days['2026-10-02'], ['12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM']);
});

test('held slots disappear until capacity allows more', () => {
  const booked = [{ preferredDate: '2026-10-05', preferredTime: '10:30 AM' }];
  assert.equal(computeAvailability(settings(), booked, now)['2026-10-05'].includes('10:30 AM'), false);
  assert.equal(computeAvailability(settings({ capacity: 2 }), booked, now)['2026-10-05'].includes('10:30 AM'), true);
});

test('date overrides close a day or open special hours', () => {
  const days = computeAvailability(settings({ overrides: [
    { date: '2026-10-06', slots: [] },
    { date: '2026-10-04', slots: ['11:00'] },
  ] }), [], now);
  assert.equal(days['2026-10-06'], undefined);
  assert.deepEqual(days['2026-10-04'], ['11:00 AM']);
});

test('disabled bookings offer nothing', () => {
  assert.deepEqual(computeAvailability(settings({ enabled: false }), [], now), {});
});
