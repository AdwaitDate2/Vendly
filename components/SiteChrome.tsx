'use client';

import { CartProvider } from './CartProvider';
import CartDrawer from './CartDrawer';
import Header from './Header';
import FloatingAppointmentCTA from './FloatingAppointmentCTA';
import BlockRenderer from './blocks/BlockRenderer';

const LEGACY_HEADER_ANNOUNCEMENT = 'global.announcement';
const LEGACY_HEADER_SETTINGS = 'navigation.header-settings';

function hasThemeSectionGroups(themeSectionGroups) {
  return themeSectionGroups?.schemaVersion === 1 && Array.isArray(themeSectionGroups.header);
}

function HeaderGroup({ sections, announcement, links, headerSettings, logoSettings, menuSettings, headerEnabled, logoEnabled, menuEnabled, countryOptions, initialCountry, focalPointBySource, preview }) {
  const enabledSections = sections.filter((section) => section.enabled !== false);
  const renderedSections = enabledSections.map((section) => {
    if (section.type === 'legacyReference') {
      if (section.source === LEGACY_HEADER_ANNOUNCEMENT) {
        return <div className="announcement" key={section.id} data-block-anchor={preview ? section.id : undefined}>{announcement}</div>;
      }
      if (section.source === LEGACY_HEADER_SETTINGS) {
        return <Header key={section.id} announcement={announcement} showAnnouncement={false} previewSectionId={preview ? section.id : null} links={links} headerSettings={headerSettings} logoSettings={logoSettings} menuSettings={menuSettings} headerEnabled={headerEnabled} logoEnabled={logoEnabled} menuEnabled={menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} />;
      }
      return null;
    }
    return <div key={section.id} data-editor-theme-section={section.id} style={{ display: 'contents' }}><BlockRenderer blocks={[section]} focalPointBySource={focalPointBySource} preview={preview} /></div>;
  });
  return enabledSections.every((section) => section.type === 'legacyReference')
    ? <div className="site-header-group--original">{renderedSections}</div>
    : renderedSections;
}

export default function SiteChrome({ children, announcement, links, headerSettings, logoSettings, menuSettings, headerEnabled, logoEnabled, menuEnabled, countryOptions = [], initialCountry = '', themeSectionGroups = null, focalPointBySource = {}, blankCanvas = false, preview = false }) {
  const hasSharedGroups = hasThemeSectionGroups(themeSectionGroups);
  const siteContent = (
    <>
      {hasSharedGroups
        ? <HeaderGroup sections={themeSectionGroups.header} announcement={announcement} links={links} headerSettings={headerSettings} logoSettings={logoSettings} menuSettings={menuSettings} headerEnabled={headerEnabled} logoEnabled={logoEnabled} menuEnabled={menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} focalPointBySource={focalPointBySource} preview={preview} />
        : <div className="site-header-group--original"><Header announcement={announcement} links={links} headerSettings={headerSettings} logoSettings={logoSettings} menuSettings={menuSettings} headerEnabled={headerEnabled} logoEnabled={logoEnabled} menuEnabled={menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} /></div>}
      <CartDrawer />
      {children}
      {blankCanvas ? null : <FloatingAppointmentCTA />}
    </>
  );
  return (
    <CartProvider>
      {blankCanvas ? <div className="site-chrome--blank-canvas">{siteContent}</div> : siteContent}
    </CartProvider>
  );
}
