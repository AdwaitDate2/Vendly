import Link from 'next/link';
import AdminNav, { ADMIN_NAV, ADMIN_SETTINGS_NAV } from './AdminNav';
import AdminTour from './AdminTour';
import HelpLink from './HelpLink';
import { logoutAdmin } from '@/lib/admin-actions';

export default function AdminShell({ children, session }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/admin" className="admin-topbar__brand">Vendly</Link>
        <form action="/admin/search" className="admin-global-search" role="search">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3.5 3.5" /></svg>
          <input name="query" placeholder="Search products, pages, requests" aria-label="Search the admin" />
        </form>
        <div className="admin-topbar__account">
          <HelpLink />
          <Link href={session.siteSlug ? `/store/${session.siteSlug}` : '/'} target="_blank" className="admin-topbar__store">View website ↗</Link>
          <span className="admin-avatar" title={session.email}>{initials(session.name)}</span>
          <span className="admin-topbar__name">{session.name}</span>
          <form action={logoutAdmin}><button type="submit" className="admin-signout">Sign out</button></form>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar__nav" aria-label="Admin navigation">
            <AdminNav items={ADMIN_NAV} />
          </nav>
          <nav className="admin-sidebar__nav admin-sidebar__nav--bottom" aria-label="Settings">
            <AdminNav items={ADMIN_SETTINGS_NAV} />
          </nav>
        </aside>
        <main className="admin-content">{children}</main>
      </div>
      <AdminTour />
    </div>
  );
}

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}
