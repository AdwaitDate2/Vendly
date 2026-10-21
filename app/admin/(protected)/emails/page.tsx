import Link from 'next/link';
import EmailDesignForm from '@/components/admin/EmailDesignForm';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { emailProviderName } from '@/lib/email';
import { listEmailTemplates } from '@/lib/email-template-store';
import { getStoreSettings } from '@/lib/settings';

const SETTING_LABELS = { customerOrderEmails: 'customer order emails', customerRequestEmails: 'request confirmations', newOrder: 'new order alerts', newRequest: 'new request alerts' };

function Group({ title, help, rows, settings }) {
  return (
    <section className="admin-card admin-table-card admin-content-group">
      <div className="admin-card__heading"><div><h2>{title}</h2><p className="admin-field-help">{help}</p></div></div>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th scope="col">Email</th><th scope="col">Subject</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const groupOff = row.setting && !settings.notifications[row.setting];
              const on = row.enabled && !groupOff;
              return (
                <tr key={row.key}>
                  <td><Link href={`/admin/emails/${row.key}`} className="admin-table-link"><strong>{row.label}</strong></Link><small className="admin-table-sub">{row.when}</small></td>
                  <td className="admin-email-subject">{row.subject}</td>
                  <td>
                    <span className={`admin-status admin-status--${on ? 'published' : 'archived'}`}>{on ? 'On' : 'Off'}</span>
                    {row.customized ? <small className="admin-table-sub">{row.mode === 'code' ? 'Custom HTML' : 'Customized'}</small> : null}
                    {row.enabled && groupOff ? <small className="admin-table-sub">All {SETTING_LABELS[row.setting]} are off in Settings</small> : null}
                  </td>
                  <td className="admin-table-actions"><Link href={`/admin/emails/${row.key}`} className="admin-row-action">Edit</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function EmailTemplatesPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Email templates</h1><p>Only owners can change the website’s emails.</p></div></div></div>;
  }
  const [templates, settings] = await Promise.all([listEmailTemplates(), getStoreSettings()]);
  const provider = emailProviderName();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Email templates</h1><p>The emails the website sends to clients and to you. Edit the wording, preview it, and send yourself a test.</p></div></div>
      {!provider ? <div className="admin-form-message" role="status"><span>Klaviyo is not connected, so emails are saved under <Link href="/admin/settings" className="admin-text-link">Settings → Notifications → Recent emails</Link> instead of being sent.</span></div> : null}
      <EmailDesignForm initial={JSON.parse(JSON.stringify(settings.emailDesign))} settings={JSON.parse(JSON.stringify({ storeName: settings.storeName, contactEmail: settings.contactEmail, theme: settings.theme, notifications: { recipients: settings.notifications.recipients } }))} />
      <Group title="Customer emails" help="Sent to clients about their orders and requests." rows={templates.filter((row) => row.audience === 'customer')} settings={settings} />
      <Group title="Team alerts" help={`Sent to ${settings.notifications.recipients.join(', ') || 'you'}. Change who receives them under Settings → Notifications.`} rows={templates.filter((row) => row.audience === 'team')} settings={settings} />
    </div>
  );
}
