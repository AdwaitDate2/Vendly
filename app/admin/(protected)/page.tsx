// @ts-nocheck
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-auth';
import { getCatalogStats } from '@/lib/catalog';
import { getInquiryOverview } from '@/lib/leads';
import { FulfillmentBadge, PaymentBadge } from '@/components/admin/OrderBadges';
import { money } from '@/lib/order-emails';
import { getSalesSummary } from '@/lib/orders';

const TIME_ZONE = 'America/New_York';
const TYPE_LABELS = { appointment: 'Appointment', bespoke: 'Custom piece', contact: 'Message' };
const STATUS_LABELS = { new: 'New', active: 'In progress', closed: 'Closed', spam: 'Spam' };
const STATUS_CLASS = { new: 'draft', active: 'published', closed: 'archived', spam: 'archived' };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TIME_ZONE }).format(new Date()));
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function formatDate(value, options) {
  return value ? new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, ...options }).format(new Date(value)) : '—';
}

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function SalesCard({ sales }) {
  const byDate = new Map(sales.byDay.map((day) => [day.date, day]));
  const days = Array.from({ length: sales.days }, (_, index) => {
    const date = new Date(sales.asOf - (sales.days - 1 - index) * 24 * 60 * 60 * 1000);
    const key = dayKey(date);
    return { key, date, revenueCents: byDate.get(key)?.revenueCents || 0, orders: byDate.get(key)?.orders || 0 };
  });
  const max = Math.max(1, ...days.map((day) => day.revenueCents));
  return (
    <section className="admin-card admin-sales">
      <div className="admin-card__heading">
        <div><span className="admin-eyebrow">Last 30 days</span><h2>Sales</h2></div>
        <Link href="/admin/orders" className="admin-text-link">All orders →</Link>
      </div>
      <div className="admin-sales__stats">
        <div><strong>{money(sales.revenueCents)}</strong><span>Net sales</span></div>
        <div><strong>{sales.orders}</strong><span>{sales.orders === 1 ? 'Order' : 'Orders'}</span></div>
        <div><strong>{money(sales.averageCents)}</strong><span>Average order</span></div>
        <div><strong>{sales.abandoned}</strong><span><Link href="/admin/orders?tab=abandoned">Unfinished checkouts</Link></span></div>
      </div>
      <div className="admin-sales__chart" role="img" aria-label={`Daily sales for the last ${sales.days} days, highest ${money(max === 1 ? 0 : max)}`}>
        {days.map((day) => (
          <span key={day.key} style={{ '--h': `${Math.max(day.revenueCents ? 4 : 1, Math.round((day.revenueCents / max) * 100))}%` }} title={`${formatDate(day.date, { month: 'short', day: 'numeric' })}: ${money(day.revenueCents)} · ${day.orders} ${day.orders === 1 ? 'order' : 'orders'}`} className={day.revenueCents ? 'has-sales' : ''} />
        ))}
      </div>
      <div className="admin-sales__axis"><span>{formatDate(days[0].date, { month: 'short', day: 'numeric' })}</span><span>Today</span></div>
      {sales.recent.length ? (
        <ul className="admin-request-list admin-sales__recent">
          {sales.recent.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders/${order.id}`}>
                <div className="admin-request-list__main"><strong>{order.name} · {order.shippingAddress?.name || order.email}</strong><span>{money(order.totalCents)}{order.test ? ' · Test order' : ''}</span></div>
                <time dateTime={new Date(order.createdAt).toISOString()}>{formatDate(order.createdAt, { month: 'short', day: 'numeric' })}</time>
                <span className="admin-sales__badges"><PaymentBadge status={order.paymentStatus} /><FulfillmentBadge status={order.fulfillmentStatus} /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="admin-field-help">No orders yet. Orders from the website checkout will appear here.</p>}
    </section>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const [catalog, requests, sales] = await Promise.all([
    getCatalogStats().catch(() => null),
    getInquiryOverview().catch(() => null),
    getSalesSummary({ days: 30 }).catch(() => null),
  ]);
  const firstName = String(session.name || '').split(' ')[0];

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">{formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h1>{greeting()}{firstName && firstName !== 'Developer' ? `, ${firstName}` : ''}.</h1>
          <p>Here&rsquo;s what needs your attention today.</p>
        </div>
        <Link href={session.siteSlug ? `/store/${session.siteSlug}` : '/'} target="_blank" className="admin-button admin-button--ghost">View website ↗</Link>
      </div>

      {!catalog || !requests ? <div className="admin-alert admin-alert--error"><strong>Some numbers couldn&rsquo;t load.</strong><span>The database didn&rsquo;t respond. Refresh the page in a moment.</span></div> : null}

      <section className="admin-kpi-grid" aria-label="Summary">
        <div className="admin-kpi-card admin-kpi-card--olive"><span>New requests</span><strong>{requests?.status.new ?? '—'}</strong><Link href="/admin/inquiries?status=new">Reply to new requests →</Link></div>
        <div className="admin-kpi-card"><span>Orders to make &amp; ship</span><strong>{sales?.toFulfill ?? '—'}</strong><Link href="/admin/orders?tab=unfulfilled">View orders →</Link></div>
        <div className="admin-kpi-card"><span>Requests in progress</span><strong>{requests?.status.active ?? '—'}</strong><Link href="/admin/inquiries?status=active">View conversations →</Link></div>
        <div className="admin-kpi-card"><span>Products on the website</span><strong>{catalog?.published ?? '—'}</strong><Link href="/admin/products">Manage products →</Link></div>
      </section>

      {sales ? <SalesCard sales={sales} /> : null}

      <section className="admin-dashboard-grid">
        <div className="admin-card admin-card--large">
          <div className="admin-card__heading">
            <div><span className="admin-eyebrow">Appointments &amp; enquiries</span><h2>Latest requests</h2></div>
            <Link href="/admin/inquiries" className="admin-text-link">View all →</Link>
          </div>
          {requests ? (
            <>
              <div className="admin-request-summary" aria-label="Requests this month">
                <div><strong>{requests.thisMonth.appointment}</strong><span>Appointment requests this month</span></div>
                <div><strong>{requests.thisMonth.bespoke}</strong><span>Custom piece enquiries this month</span></div>
                <div><strong>{requests.thisMonth.contact}</strong><span>Messages this month</span></div>
              </div>
              {requests.recent.length ? (
                <ul className="admin-request-list">
                  {requests.recent.map((item) => (
                    <li key={item.id}>
                      <Link href={`/admin/inquiries/${item.id}`}>
                        <div className="admin-request-list__main">
                          <strong>{item.name}</strong>
                          <span>{TYPE_LABELS[item.requestType] || 'Request'}{item.topic ? ` · ${item.topic}` : ''}</span>
                        </div>
                        <time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>{formatDate(item.createdAt, { month: 'short', day: 'numeric' })}</time>
                        <span className={`admin-status admin-status--${STATUS_CLASS[item.status] || 'draft'}`}>{STATUS_LABELS[item.status] || item.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="admin-field-help">No requests yet. Appointment requests from the website will appear here.</p>}
            </>
          ) : null}
        </div>

        <div className="admin-card admin-card--large">
          <div className="admin-card__heading"><div><span className="admin-eyebrow">Quick links</span><h2>Update the website</h2></div></div>
          <ul className="admin-quick-links">
            <li><Link href="/admin/content/home"><strong>Edit the homepage</strong><span>Text, photos, and sections</span></Link></li>
            <li><Link href="/admin/products/new"><strong>Add a product</strong><span>Photos, price, and details</span></Link></li>
            <li><Link href="/admin/content/faq"><strong>Edit FAQs</strong><span>Questions and answers</span></Link></li>
            <li><Link href="/admin/content/appointments"><strong>Edit the booking page</strong><span>Book an appointment</span></Link></li>
            <li><Link href="/admin/content"><strong>All pages</strong><span>Every editable page</span></Link></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
