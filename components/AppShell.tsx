'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SiteChrome from './SiteChrome';
import Footer from './Footer';
import { navigationPresentationFromSections } from '@/lib/header-settings';

function sectionMap(sections = []) {
  return Object.fromEntries(sections.map((section) => [section.id, section]));
}

export default function AppShell({ children, site, navigation, focalPointBySource = {}, countryOptions = [], initialCountry = '' }) {
  const pathname = usePathname();
  const [previewSite, setPreviewSite] = useState(site);
  const [previewNavigation, setPreviewNavigation] = useState(navigation);

  useEffect(() => {
    setPreviewSite(site);
    setPreviewNavigation(navigation);
  }, [pathname, site, navigation]);

  useEffect(() => {
    if (!pathname.startsWith('/preview/')) return undefined;
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.source !== 'byshreen-editor' || event.data.type !== 'shared-content') return;
      setPreviewSite(sectionMap(event.data.payload?.globalSections || []));
      const nextNavigation = navigationPresentationFromSections(event.data.payload?.navigationSections || []);
      setPreviewNavigation((currentNavigation) => ({
        ...nextNavigation,
        themeSectionGroups: event.data.payload?.themeSectionGroups || currentNavigation?.themeSectionGroups,
      }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname]);

  // Global-text, navigation, and Password template previews draw their own storefront surface.
  if (pathname.startsWith('/admin') || pathname === '/coming-soon' || pathname === '/preview/global' || pathname === '/preview/navigation' || pathname.startsWith('/preview/templates/password/')) return children;

  return (
    <SiteChrome announcement={previewSite.announcement.body} links={previewNavigation.main} headerSettings={previewNavigation.headerSettings} logoSettings={previewNavigation.logoSettings} menuSettings={previewNavigation.menuSettings} headerEnabled={previewNavigation.headerEnabled} logoEnabled={previewNavigation.logoEnabled} menuEnabled={previewNavigation.menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} themeSectionGroups={previewNavigation.themeSectionGroups} focalPointBySource={focalPointBySource} preview={pathname.startsWith('/preview/')}>
      {children}
      <Footer newsletter={previewSite.newsletter} footer={previewSite.footer} navigation={previewNavigation} themeSectionGroups={previewNavigation.themeSectionGroups} focalPointBySource={focalPointBySource} preview={pathname.startsWith('/preview/')} />
    </SiteChrome>
  );
}

