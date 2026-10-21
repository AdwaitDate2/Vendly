import Link from 'next/link';
import AvailabilityForm from '@/components/admin/AvailabilityForm';
import { requireAdminPermission } from '@/lib/admin-auth';
import { slotTimeFromLabel } from '@/lib/appointment-slots';
import { listUpcomingAppointments } from '@/lib/appointments';
import { getStoreSettings } from '@/lib/settings';

function formatDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default async function AppointmentsPage() {
  await requireAdminPermission('appointments:manage');
  const settings = await getStoreSettings();
  let upcoming = [];
  let error = '';
  try {
    upcoming = await listUpcomingAppointments();
  } catch (connectionError) {
    error = connectionError.message || 'MongoDB is unavailable.';
  }
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Bespoke operations</span><h1>Customer requests</h1><p>Every appointment booking, bespoke inquiry and message. Open one to confirm a time, reply, or close it.</p></div></div>
      <div className="admin-view-tabs" role="navigation" aria-label="Requests sections"><Link href="/admin/inquiries" className="">Customer inquiries</Link><Link href="/admin/appointments" className="is-active">Customer appointments</Link></div>
      <div className="admin-settings">
        <div className="admin-settings__column"><AvailabilityForm settings={settings.appointments} /></div>
        <div className="admin-settings__column">
          <section className="admin-card">
            <div className="admin-card__heading"><div><h2>Upcoming bookings</h2><p className="admin-field-help">Soonest first. A booked time leaves the website calendar until the request is declined, completed or closed.</p></div></div>
            {error ? <div className="admin-alert admin-alert--error"><span>{error}</span></div> : null}
            <div className="admin-table-scroll">
              <table className="admin-table admin-bookings">
                <thead><tr><th scope="col">When</th><th scope="col">Client</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
                <tbody>
                  {upcoming.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{formatDate(item.preferredDate)}</strong><small className="admin-table-sub">{slotTimeFromLabel(item.preferredTime) ? item.preferredTime : 'Time not set'}</small></td>
                      <td>{item.name}<small className="admin-table-sub">{item.topic || item.email}</small></td>
                      <td><span className={'admin-status admin-status--' + (item.appointmentStatus === 'confirmed' ? 'published' : 'draft')}>{item.appointmentStatus === 'confirmed' ? 'Confirmed' : 'Needs confirmation'}</span></td>
                      <td className="admin-table-actions"><Link href={'/admin/inquiries/' + item.id} className="admin-row-action">Open</Link></td>
                    </tr>
                  ))}
                  {!upcoming.length ? <tr><td colSpan={4}><p className="admin-field-help">No upcoming bookings.</p></td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
