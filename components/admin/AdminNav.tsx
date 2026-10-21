'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ICONS = {
  home: 'M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-3.5v-5h-5v5H4a1 1 0 0 1-1-1z',
  tag: 'M3 4v5.6a1 1 0 0 0 .3.7l6.4 6.4a1 1 0 0 0 1.4 0l5.6-5.6a1 1 0 0 0 0-1.4L10.3 3.3A1 1 0 0 0 9.6 3H4a1 1 0 0 0-1 1zM7 7h.01',
  collection: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  box: 'M3.5 6.5 10 3l6.5 3.5v7L10 17l-6.5-3.5zM3.5 6.5 10 10l6.5-3.5M10 10v7',
  page: 'M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 3v4h4M7 11h6M7 14h6',
  image: 'M4 4h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM3 13l4-4 4 4 2-2 4 4M13 7.5h.01',
  inbox: 'M3 11h4l1 2h4l1-2h4M4.5 5h11L17 11v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z',
  mail: 'M3 5h14v10H3zM3 5l7 6 7-6',
  palette: 'M10 3a7 7 0 1 0 0 14c1 0 1.5-.8 1.2-1.6-.4-1 .3-1.9 1.3-1.9H14a3 3 0 0 0 3-3C17 6.1 13.9 3 10 3zM6.5 10h.01M8 6.8h.01M12 6.8h.01',
  shield: 'M10 2.5 16 5v4.5c0 3.6-2.5 6.6-6 8-3.5-1.4-6-4.4-6-8V5zM7.5 10l1.8 1.8L12.8 8.3',
  instagram: 'M6.5 3h7A3.5 3.5 0 0 1 17 6.5v7a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 3 13.5v-7A3.5 3.5 0 0 1 6.5 3zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM14 6h.01',
  team: 'M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2.5 16c.4-2.8 2.4-4.5 5-4.5s4.6 1.7 5 4.5M13 4.2a2.5 2.5 0 0 1 0 4.6M14.5 11.8c1.7.5 2.8 1.9 3 4.2',
  clock: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 6v4l2.5 2',
  trash: 'M4 6h12M8 6V4h4v2M6 6l.8 10.2a1 1 0 0 0 1 .8h4.4a1 1 0 0 0 1-.8L14 6M8.5 9v5M11.5 9v5',
  orders: 'M3 4h2l1.6 8.2a1 1 0 0 0 1 .8h7.1a1 1 0 0 0 1-.8L17 7H6M8.5 16.5h.01M14.5 16.5h.01',
  person: 'M10 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 17c.5-3.2 2.9-5 6-5s5.5 1.8 6 5',
  percent: 'M15 5 5 15M6.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM13.5 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  help: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8 8a2 2 0 1 1 3 1.7c-.7.4-1 .8-1 1.6M10 14h.01',
  settings: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM16.2 11.6l1.3 1-1.5 2.6-1.6-.5a6 6 0 0 1-1.6.9L12.5 17h-3l-.3-1.4a6 6 0 0 1-1.6-.9l-1.6.5-1.5-2.6 1.3-1a6 6 0 0 1 0-1.8L4.5 8.8 6 6.2l1.6.5a6 6 0 0 1 1.6-.9L9.5 3h3l.3 1.4a6 6 0 0 1 1.6.9l1.6-.5 1.5 2.6-1.3 1a6 6 0 0 1 0 1.8z',
};

export const ADMIN_NAV = [
  { href: '/admin', label: 'Home', icon: 'home', exact: true },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/inquiries', label: 'Customer requests', icon: 'inbox', also: ['/admin/appointments'] },
  { href: '/admin/products', label: 'Products', icon: 'tag' },
  { href: '/admin/customers', label: 'Customers', icon: 'person' },
  { href: '/admin/discounts', label: 'Discounts', icon: 'percent' },
  { href: '/admin/collections', label: 'Collections', icon: 'collection' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'box' },
  { href: '/admin/blogs', label: 'Blog posts', icon: 'page' },
  { href: '/admin/content', label: 'Pages & content', icon: 'page' },
  { href: '/admin/policies', label: 'Policies', icon: 'shield' },
  { href: '/admin/theme', label: 'Theme', icon: 'palette' },
  { href: '/admin/coming-soon', label: 'Coming soon page', icon: 'clock' },
  { href: '/admin/emails', label: 'Email templates', icon: 'mail' },
  { href: '/admin/media', label: 'Files', icon: 'image' },
  { href: '/admin/testimonials', label: 'Client testimonials', icon: 'inbox' },
  { href: '/admin/proposals', label: 'Proposal stories', icon: 'image' },
  { href: '/admin/instagram', label: 'Instagram', icon: 'instagram' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: 'mail' },
];

export const ADMIN_SETTINGS_NAV = [
  { href: '/admin/help', label: 'Help & guides', icon: 'help' },
  { href: '/admin/audit-log', label: 'Activity log', icon: 'clock' },
  { href: '/admin/deleted', label: 'Recently deleted', icon: 'trash' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export function AdminIcon({ name }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** On phones the nav is a horizontal strip; centre the current page's link so it's never hidden off the edge. */
function useRevealActiveLink(pathname) {
  useEffect(() => {
    const strip = document.querySelector('.admin-sidebar');
    const link = strip?.querySelector('.admin-nav-link.is-active');
    if (!link || strip.scrollWidth <= strip.clientWidth) return;
    const stripBox = strip.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    strip.scrollLeft += linkBox.left - stripBox.left - (stripBox.width - linkBox.width) / 2;
  }, [pathname]);
}

export default function AdminNav({ items }) {
  const pathname = usePathname();
  useRevealActiveLink(pathname);
  return items.map((item) => {
    const active = item.exact ? pathname === item.href : [item.href, ...(item.also || [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
    return (
      <Link key={item.href} href={item.href} className={`admin-nav-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
        <AdminIcon name={item.icon} />
        {item.label}
      </Link>
    );
  });
}
