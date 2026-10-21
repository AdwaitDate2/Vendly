// @ts-nocheck
import Link from 'next/link';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getSubscriberStats, listNewsletterCampaigns } from '@/lib/newsletter';
import { getStoreSettings } from '@/lib/settings';
import NewsletterComposer from '@/components/admin/NewsletterComposer';

export default async function AdminNewsletterPage({ searchParams }) {
  const session = await requireAdminPermission('subscriber:read');
  const params = await searchParams;
  const tab = params?.tab || 'compose';

  const [stats, settings, campaignsData] = await Promise.all([
    getSubscriberStats().catch(() => ({ subscribed: 0, unsubscribed: 0, total: 0 })),
    getStoreSettings().catch(() => ({})),
    listNewsletterCampaigns({ page: params?.page }).catch(() => ({ items: [], total: 0, page: 1, pages: 1 })),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-view-tabs" role="tablist" style={{ marginBottom: 20 }}>
        <Link
          href="/admin/subscribers/newsletter?tab=compose"
          className={tab === 'compose' ? 'is-active' : ''}
        >
          Compose Newsletter
        </Link>
        <Link
          href="/admin/subscribers/newsletter?tab=history"
          className={tab === 'history' ? 'is-active' : ''}
        >
          Campaign History {campaignsData.total ? <small>({campaignsData.total})</small> : null}
        </Link>
      </div>

      {tab === 'history' ? (
        <div className="admin-card admin-table-card">
          <div className="admin-card__heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Sent Newsletters & Drafts</h2>
              <p className="admin-field-help">Review previous broadcasts, recipient numbers, and delivery records.</p>
            </div>
            <Link href="/admin/subscribers/newsletter?tab=compose" className="admin-button">
              + New Newsletter
            </Link>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Campaign Subject</th>
                  <th scope="col">Status</th>
                  <th scope="col">Recipients</th>
                  <th scope="col">Sent / Updated</th>
                  <th scope="col">Author</th>
                </tr>
              </thead>
              <tbody>
                {campaignsData.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.subject}</strong>
                      {item.heading ? <small className="admin-table-sub">{item.heading}</small> : null}
                    </td>
                    <td>
                      <span className={`admin-status admin-status--${item.status === 'sent' ? 'published' : 'archived'}`}>
                        {item.status === 'sent' ? 'Broadcasted' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      {item.recipientsCount ? `${item.recipientsCount} subscribers` : '—'}
                      {item.deliverySummary ? (
                        <small className="admin-table-sub">
                          {item.deliverySummary.sent ? `${item.deliverySummary.sent} sent` : ''}
                          {item.deliverySummary.logged ? ` ${item.deliverySummary.logged} logged` : ''}
                          {item.deliverySummary.failed ? ` (${item.deliverySummary.failed} failed)` : ''}
                        </small>
                      ) : null}
                    </td>
                    <td>
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                    </td>
                    <td>{item.sentBy || item.updatedBy || 'Admin'}</td>
                  </tr>
                ))}
                {!campaignsData.items.length ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty">
                        <span>✉</span>
                        <h2>No sent newsletters yet</h2>
                        <p>When you broadcast emails to your subscriber list, they will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <NewsletterComposer
          subscriberStats={stats}
          settings={settings}
          userEmail={session.email || ''}
        />
      )}
    </div>
  );
}
