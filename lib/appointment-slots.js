import { z } from 'zod';

// Pure scheduling logic (no database), shared by settings, the public booking page, and tests.
// Slot times are stored as 24-hour "HH:MM" in the store's timezone and shown as "10:30 AM".

export const DEFAULT_SLOT_TIMES = ['10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeValue = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use times like 10:30.');
const dateValue = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.');
const slotList = z.array(timeValue).max(24).transform((slots) => [...new Set(slots)].sort());

export const weekdaySchema = z.object({
  open: z.boolean().default(true),
  slots: slotList.default(DEFAULT_SLOT_TIMES),
});

export const dateOverrideSchema = z.object({
  date: dateValue,
  // Empty means closed all day; otherwise these times replace the weekly ones for that date.
  slots: slotList.default([]),
  note: z.string().trim().max(120).default(''),
});

export const DEFAULT_WEEKLY = WEEKDAYS.map((_, day) => ({ open: day !== 0, slots: DEFAULT_SLOT_TIMES }));

export const appointmentSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  timezone: z.string().trim().min(1).max(60).default('America/New_York'),
  // Shortest notice a client must give, and how far ahead they can book.
  leadHours: z.coerce.number().int().min(0).max(720).default(24),
  maxDaysAhead: z.coerce.number().int().min(1).max(365).default(90),
  // How many requests may hold the same slot.
  capacity: z.coerce.number().int().min(1).max(10).default(1),
  weekly: z.array(weekdaySchema).length(7, 'Set hours for all seven days.').default(DEFAULT_WEEKLY),
  overrides: z.array(dateOverrideSchema).max(300).default([]),
});

export const DEFAULT_APPOINTMENT_SETTINGS = appointmentSettingsSchema.parse({});

export function slotLabel(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Parses "4:30 PM" back to "16:30". Returns '' when it is not a slot label. */
export function slotTimeFromLabel(label) {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(String(label || '').trim());
  if (!match) return '';
  let hours = Number(match[1]) % 12;
  if (match[3] === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** The current date and time as wall-clock numbers in a timezone. */
export function wallClock(now, timezone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute) };
}

export function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Date → { 'YYYY-MM-DD': ['10:30 AM', …] }. Only dates with at least one open slot are listed. */
export function computeAvailability(settings, booked = [], now = new Date()) {
  if (!settings.enabled) return {};
  let timezone = settings.timezone;
  let clock;
  try {
    clock = wallClock(now, timezone);
  } catch {
    timezone = DEFAULT_APPOINTMENT_SETTINGS.timezone;
    clock = wallClock(now, timezone);
  }
  // Wall-clock times are compared as if they were UTC, which avoids daylight-saving arithmetic.
  const earliest = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute) + settings.leadHours * 3600000;
  const taken = new Map();
  for (const entry of booked) {
    const key = `${entry.preferredDate}|${slotTimeFromLabel(entry.preferredTime)}`;
    taken.set(key, (taken.get(key) || 0) + 1);
  }
  const overrides = new Map(settings.overrides.map((entry) => [entry.date, entry]));
  const days = {};
  for (let offset = 0; offset <= settings.maxDaysAhead; offset += 1) {
    const day = new Date(Date.UTC(clock.year, clock.month - 1, clock.day + offset));
    const key = dateKey(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
    const override = overrides.get(key);
    const configured = override ? override.slots : (settings.weekly[day.getUTCDay()].open ? settings.weekly[day.getUTCDay()].slots : []);
    const open = configured.filter((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      if (Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes) < earliest) return false;
      return (taken.get(`${key}|${time}`) || 0) < settings.capacity;
    });
    if (open.length) days[key] = open.map(slotLabel);
  }
  return days;
}
