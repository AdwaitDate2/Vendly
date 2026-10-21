import { computeAvailability, dateKey, slotTimeFromLabel, wallClock } from './appointment-slots';
import { getDb } from './mongodb';
import { getStoreSettings } from './settings';

const INQUIRY_COLLECTION = 'bespokeInquiries';

// A request holds its slot until it is closed or marked as spam.
const HOLDING = { requestType: 'appointment', status: { $nin: ['closed', 'spam'] } };

async function bookedSlots(fromDate) {
  const db = await getDb();
  return db.collection(INQUIRY_COLLECTION)
    .find({ ...HOLDING, preferredDate: { $gte: fromDate } }, { projection: { preferredDate: 1, preferredTime: 1 } })
    .toArray();
}

/** What the booking page shows: open dates and times, with held slots removed. */
export async function getAppointmentAvailability(now = new Date()) {
  const { appointments } = await getStoreSettings();
  if (!appointments.enabled) return { enabled: false, days: {}, timezone: appointments.timezone };
  const clock = wallClock(now, appointments.timezone);
  const booked = await bookedSlots(dateKey(clock.year, clock.month, clock.day));
  return { enabled: true, days: computeAvailability(appointments, booked, now), timezone: appointments.timezone };
}

/** True when the date and time (e.g. "2026-10-02", "4:30 PM") can still be booked. */
export async function isSlotAvailable(date, timeLabel) {
  if (!slotTimeFromLabel(timeLabel)) return false;
  const { enabled, days } = await getAppointmentAvailability();
  return enabled && Boolean(days[date]?.includes(timeLabel));
}

/** Upcoming appointment requests for the admin schedule, soonest first. */
export async function listUpcomingAppointments(limit = 50) {
  const { appointments } = await getStoreSettings();
  const clock = wallClock(new Date(), appointments.timezone);
  const db = await getDb();
  const items = await db.collection(INQUIRY_COLLECTION)
    .find({ ...HOLDING, preferredDate: { $gte: dateKey(clock.year, clock.month, clock.day) } })
    .sort({ preferredDate: 1, createdAt: 1 })
    .limit(limit)
    .toArray();
  return items
    .map((item) => ({
      id: item._id.toString(),
      name: item.name,
      email: item.email,
      topic: item.topic || '',
      status: item.status || 'new',
      appointmentStatus: item.appointmentStatus || 'pending',
      preferredDate: item.preferredDate,
      preferredTime: item.preferredTime,
      sortTime: slotTimeFromLabel(item.preferredTime),
    }))
    .sort((a, b) => (a.preferredDate + a.sortTime).localeCompare(b.preferredDate + b.sortTime));
}
