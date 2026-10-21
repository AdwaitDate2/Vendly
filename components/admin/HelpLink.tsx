'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { guideForPath } from '@/lib/help-guides';

/** Top-bar shortcut to the guide for the page you are on. */
export default function HelpLink() {
  const pathname = usePathname();
  const slug = pathname.startsWith('/admin/help') ? null : guideForPath(pathname);
  return <Link href={slug ? `/admin/help/${slug}` : '/admin/help'} className="admin-topbar__help">{slug ? 'Guide for this page' : 'Help'}</Link>;
}
