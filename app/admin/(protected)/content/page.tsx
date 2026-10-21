// @ts-nocheck
import Link from 'next/link';
import DeleteButton from '@/components/admin/DeleteButton';
import { listCustomPages } from '@/lib/custom-pages';
import { listContentEntries } from '@/lib/content';

const LABELS = {
  navigation: ['Navigation', 'Header menu, footer columns, social links'],
  global: ['Site-wide text', 'Announcement bar, newsletter, footer text'],
  contact: ['Enquiry forms', 'Thank-you message and contact email'],
  home: ['Homepage', '/'],
  shop: ['Shop', '/shop'],
  bridal: ['Bridal', '/bridal'],
  about: ['Our Story', '/our-story'],
  bespoke: ['Custom jewelry', '/custom'],
  materialsSourcing: ['Craftsmanship', '/craftsmanship'],
  appointments: ['Book an appointment', '/book-appointment'],
  faq: ['FAQ', '/faq'],
  clientCare: ['Client care', '/client-care'],
  sizeGuide: ['Size guide', '/size-guide'],
};
// These moved to Admin → Policies and are edited there with the rich-text editor.
const POLICY_KEYS = ['shipping', 'returns', 'care', 'repairsWarranty', 'privacy', 'terms', 'accessibility', 'cookies', 'privacyChoices'];
const SETTINGS = ['navigation', 'global', 'contact'];
const STATUS_LABEL = { published: 'Published', draft: 'Draft', archived: 'Archived' };

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
}

function Table({ rows, canDelete = false }) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead><tr><th scope="col">Page</th><th scope="col">Address</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.href}>
              <td><Link href={row.href} className="admin-product-cell"><span><strong>{row.title}</strong>{row.note ? <small>{row.note}</small> : null}</span></Link></td>
              <td>{row.route}</td>
              <td><span className={`admin-status admin-status--${row.status}`}>{STATUS_LABEL[row.status] || row.status}</span></td>
              <td>{formatDate(row.updatedAt)}</td>
              <td className="admin-table-actions"><Link className="admin-row-action" href={row.href}>Edit</Link>{canDelete && row.deleteId ? <DeleteButton kind="page" id={row.deleteId} name={row.title} variant="link" confirmText={`Delete the page “${row.title}”? Its address will stop working.`} /> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ContentPage({ searchParams }) {
  const params = await searchParams;
  const [entries, customPages] = await Promise.all([listContentEntries(), listCustomPages().catch(() => [])]);
  const toRow = (entry) => ({ href: `/admin/content/${entry.key}`, title: LABELS[entry.key]?.[0] || entry.key, note: SETTINGS.includes(entry.key) ? LABELS[entry.key][1] : '', route: SETTINGS.includes(entry.key) ? 'Every page' : LABELS[entry.key]?.[1] || '—', status: entry.status, updatedAt: entry.updatedAt });

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><h1>Pages &amp; content</h1><p>Edit the website&rsquo;s pages, menus, and site-wide text. Changes preview live before you publish.</p></div>
        <Link href="/admin/content/pages/new" className="admin-button">Add page</Link>
      </div>
      {params?.deleted ? <div className="admin-alert" role="status">Page deleted.</div> : null}

      <section className="admin-card admin-table-card admin-content-group">
        <div className="admin-card__heading"><div><h2>Your pages</h2><p className="admin-field-help">Pages you&rsquo;ve created. They live at /pages/…</p></div></div>
        {customPages.length ? <Table canDelete rows={customPages.map((page) => ({ href: `/admin/content/pages/${page.id}`, deleteId: page.id, title: page.title, route: page.route, status: page.status, updatedAt: page.updatedAt }))} /> : <p className="admin-field-help admin-content-group__empty">No pages yet. Use &ldquo;Add page&rdquo; to create one.</p>}
      </section>

      <section className="admin-card admin-table-card admin-content-group">
        <div className="admin-card__heading"><div><h2>Website pages</h2></div></div>
        <Table rows={entries.filter((entry) => !SETTINGS.includes(entry.key) && !POLICY_KEYS.includes(entry.key)).map(toRow)} />
      </section>

      <section className="admin-card admin-content-group">
        <div className="admin-card__heading"><div><h2>Policies</h2><p className="admin-field-help">Privacy Policy, Terms &amp; Conditions, Shipping &amp; Returns, Repairs &amp; Care, Cookies, Privacy Choices, and Accessibility are edited like documents.</p></div><Link href="/admin/policies" className="admin-button admin-button--ghost">Edit policies</Link></div>
      </section>

      <section className="admin-card admin-table-card admin-content-group">
        <div className="admin-card__heading"><div><h2>Menus &amp; site-wide text</h2></div></div>
        <Table rows={SETTINGS.map((key) => entries.find((entry) => entry.key === key)).filter(Boolean).map(toRow)} />
      </section>
    </div>
  );
}
