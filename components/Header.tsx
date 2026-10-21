// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import LotusMark from './LotusMark';
import { DEFAULT_HEADER_SECTION } from '@/lib/header-settings';
import { resolveColorSchemeSelection } from '@/lib/header-settings';
import { DEFAULT_THEME, getThemeColorScheme } from '@/lib/theme';
import { countryFlagEmoji, persistCountryPreference } from '@/lib/regions';
import headerStyles from './Header.module.css';


function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11l1 12h-13l1-12Z"/><path d="M9 9V6.5a3 3 0 0 1 6 0V9"/></svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></svg>
  );
}
function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="7" r="3.5"/><path d="M5 20c0-3.5 2.7-6 7-6s7 2.5 7 6" /></svg>
  );
}
function ChevronDownIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg>;
}

function clampSetting(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function schemeRoleColor(selection, groupKey, roleKey) {
  const scheme = getThemeColorScheme(DEFAULT_THEME, selection.number);
  const cssGroup = groupKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const cssRole = roleKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const legacyColors = {
    default: { base: { background: 'var(--paper)', headings: 'var(--ink)', text: 'var(--ink)', links: 'var(--ink)', hoverLinks: 'var(--mulberry)', borders: 'var(--line)', shadow: 'var(--ink)' }, primaryButton: { background: 'var(--mulberry)', text: 'var(--ivory)', borders: 'var(--mulberry)', hoverBackground: 'var(--mulberry-dark)', hoverText: 'var(--ivory)', hoverBorders: 'var(--mulberry-dark)' } },
    inverse: { base: { background: 'var(--ink-dark)', headings: 'var(--ivory)', text: 'var(--ivory)', links: 'var(--ivory)', hoverLinks: 'var(--paper)', borders: 'rgba(255,255,255,.28)', shadow: 'var(--ink-dark)' }, primaryButton: { background: 'var(--ivory)', text: 'var(--ink-dark)', borders: 'var(--ivory)', hoverBackground: 'var(--paper)', hoverText: 'var(--ink-dark)', hoverBorders: 'var(--paper)' } },
    ivory: { base: { background: 'var(--ivory)', headings: 'var(--ink)', text: 'var(--ink)', links: 'var(--mulberry)', hoverLinks: 'var(--ink)', borders: 'var(--line)', shadow: 'var(--ink)' } },
    paper: { base: { background: 'var(--paper)', headings: 'var(--ink)', text: 'var(--ink)', links: 'var(--mulberry)', hoverLinks: 'var(--ink)', borders: 'var(--line)', shadow: 'var(--ink)' } },
    olive: { base: { background: 'var(--ink)', headings: 'var(--ivory)', text: 'var(--ivory)', links: 'var(--ivory)', hoverLinks: 'var(--paper)', borders: 'rgba(255,255,255,.28)', shadow: 'var(--ink-dark)' } },
    mulberry: { base: { background: 'var(--mulberry-dark)', headings: 'var(--ivory)', text: 'var(--ivory)', links: 'var(--ivory)', hoverLinks: 'var(--paper)', borders: 'rgba(255,255,255,.28)', shadow: 'var(--mulberry-dark)' } },
  };
  const legacyValue = legacyColors[selection.legacyValue]?.[groupKey]?.[roleKey];
  if (legacyValue) return legacyValue;
  return `var(--color-scheme-${selection.number}-${cssGroup}-${cssRole}, ${scheme[groupKey][roleKey]})`;
}

function selectedHeaderColorProperties(selection, prefix = 'header') {
  const propertyRoles = {
    'base-background': ['base', 'background'],
    'base-headings': ['base', 'headings'],
    'base-text': ['base', 'text'],
    'base-links': ['base', 'links'],
    'base-hover-links': ['base', 'hoverLinks'],
    'base-borders': ['base', 'borders'],
    'base-shadow': ['base', 'shadow'],
    'primary-button-background': ['primaryButton', 'background'],
    'primary-button-text': ['primaryButton', 'text'],
    'primary-button-borders': ['primaryButton', 'borders'],
    'primary-button-hover-background': ['primaryButton', 'hoverBackground'],
    'primary-button-hover-text': ['primaryButton', 'hoverText'],
    'primary-button-hover-borders': ['primaryButton', 'hoverBorders'],
    'inputs-background': ['inputs', 'background'],
    'inputs-text': ['inputs', 'text'],
    'inputs-borders': ['inputs', 'borders'],
    'inputs-hover-background': ['inputs', 'hoverBackground'],
    'variants-background': ['variants', 'background'],
    'variants-text': ['variants', 'text'],
    'variants-borders': ['variants', 'borders'],
  };
  return Object.fromEntries(Object.entries(propertyRoles).map(([property, [groupKey, roleKey]]) => [`--${prefix}-${property}`, schemeRoleColor(selection, groupKey, roleKey)]));
}

export default function Header({ announcement, showAnnouncement = true, previewSectionId = null, links = [], headerSettings = {}, logoSettings = {}, menuSettings = {}, headerEnabled = true, logoEnabled = true, menuEnabled = true, countryOptions = [], initialCountry = '' }) {
  const { count, setOpen } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [stickyHeaderVisibility, setStickyHeaderVisibility] = useState('visible');
  const settings = { ...DEFAULT_HEADER_SECTION.settings, ...headerSettings };
  const logo = { ...DEFAULT_HEADER_SECTION.blocks[0].settings, ...logoSettings };
  const menu = { ...DEFAULT_HEADER_SECTION.blocks[1].settings, ...menuSettings };
  const isHome = pathname === '/' || pathname === '/preview/home';
  const isProduct = /^\/products\/[^/]+\/?$/.test(pathname) || pathname.startsWith('/preview/templates/product/');
  const isCollection = /^\/collections\/[^/]+\/?$/.test(pathname) || pathname.startsWith('/preview/templates/collection/');
  const isTransparent = (isHome && settings.transparentHome)
    || (isProduct && settings.transparentProduct)
    || (isCollection && settings.transparentCollection);
  const solidHeaderScheme = resolveColorSchemeSelection(settings.colorScheme, 'scheme1');
  const transparentHomeScheme = resolveColorSchemeSelection(settings.homeScheme, 'scheme5');
  const headerScheme = isTransparent && isHome ? transparentHomeScheme : solidHeaderScheme;
  const menuScheme = resolveColorSchemeSelection(menu.colorScheme, 'scheme1');
  const menuLinkColor = isTransparent && isHome
    ? 'var(--header-base-links, var(--header-base-text))'
    : 'var(--header-menu-base-links, var(--header-menu-base-text, var(--header-base-links, var(--header-base-text))))';
  const darkHeader = headerScheme.legacyValue
    ? !['inverse', 'olive', 'mulberry'].includes(headerScheme.legacyValue)
    : [1, 2, 3, 7, 8].includes(headerScheme.number);
  const isSticky = headerEnabled && (settings.stickyMode === 'always' || (settings.stickyMode === 'on-scroll-up' && stickyHeaderVisibility === 'pinned'));
  const headerClasses = [
    'site-header',
    darkHeader ? 'site-header--dark' : '',
    `site-header--scheme-${headerScheme.value}`,
    isTransparent ? 'site-header--transparent' : '',
    isSticky ? 'site-header--sticky' : '',
    headerEnabled && settings.stickyMode === 'on-scroll-up' && stickyHeaderVisibility === 'hidden' ? 'site-header--sticky-hidden' : '',
    `site-header--logo-${settings.logoPosition}`,
    `site-header--menu-${settings.menuPosition}`,
    `site-header--menu-row-${settings.menuRow}`,
    settings.showAccount ? `site-header--account-${settings.accountPosition || 'right'}` : '',
    settings.showSearch ? `site-header--search-${settings.searchPosition}` : '',
    settings.showSearch ? `site-header--search-row-${settings.searchRow}` : '',
    settings.showCountrySelector ? `site-header--country-position-${settings.countryPosition}` : '',
    settings.showCountrySelector ? `site-header--country-row-${settings.countryRow}` : '',
    settings.showLanguageSelector ? `site-header--language-position-${settings.languagePosition}` : '',
    settings.showLanguageSelector ? `site-header--language-row-${settings.languageRow}` : '',
    `site-header--width-${settings.width}`,
    `site-header--height-${settings.height}`,
    menu.mobileNavigationBar ? 'site-header--mobile-bar' : '',
    menu.mobileAccordion ? 'site-header--mobile-accordion' : '',
  ].filter(Boolean).join(' ');
  const submenuSizePx = menu.submenuSize === 'small' ? 12 : menu.submenuSize === 'large' ? 16 : 14;
  const submenuFont = menu.submenuFont || menu.font || 'body';
  const headerStyle = {
    ...selectedHeaderColorProperties(headerScheme),
    ...selectedHeaderColorProperties(menuScheme, 'header-menu'),
    '--header-logo-color-value': headerScheme.legacyValue === 'default' ? 'var(--mulberry)' : 'var(--header-base-text)',
    '--header-border-thickness': `${clampSetting(settings.borderThickness, 0, 8, 1)}px`,
    '--header-logo-padding-top': `${clampSetting(logo.paddingTop, 0, 80)}px`,
    '--header-logo-padding-bottom': `${clampSetting(logo.paddingBottom, 0, 80)}px`,
    '--header-logo-padding-left': `${clampSetting(logo.paddingLeft, 0, 80)}px`,
    '--header-logo-padding-right': `${clampSetting(logo.paddingRight, 0, 80)}px`,
    '--header-menu-font-size': `${clampSetting(menu.topLevelSize, 10, 18, 10)}px`,
    '--header-menu-font-family': menu.font === 'heading' ? 'var(--serif)' : 'var(--sans)',
    '--header-menu-text-transform': menu.case === 'uppercase' ? 'uppercase' : menu.case === 'lowercase' ? 'lowercase' : 'none',
    '--header-submenu-font-size': `${submenuSizePx}px`,
    '--header-submenu-font-family': submenuFont === 'heading' ? 'var(--serif)' : submenuFont === 'subheading' ? 'var(--sans)' : submenuFont === 'accent' ? 'var(--mono, var(--sans))' : 'var(--sans)',
    '--header-submenu-image-radius': `${clampSetting(menu.submenuImageCornerRadius, 0, 24, 0)}px`,
    '--header-language-font-size': `${clampSetting(settings.languageSize, 10, 18, 12)}px`,
    '--header-language-font-family': settings.languageFont === 'heading' ? 'var(--serif)' : settings.languageFont === 'subheading' ? 'var(--sans)' : settings.languageFont === 'accent' ? 'var(--mono, var(--sans))' : 'var(--sans)',
  };

  useEffect(() => {
    if (settings.stickyMode !== 'on-scroll-up') {
      setStickyHeaderVisibility('visible');
      return undefined;
    }
    let previousScrollY = window.scrollY;
    const updateStickyVisibility = () => {
      const currentScrollY = window.scrollY;
      const nextVisibility = currentScrollY <= 120
        ? 'visible'
        : currentScrollY < previousScrollY ? 'pinned' : 'hidden';
      setStickyHeaderVisibility(nextVisibility);
      previousScrollY = currentScrollY;
    };
    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
    updateStickyVisibility();
    return () => window.removeEventListener('scroll', updateStickyVisibility);
  }, [settings.stickyMode]);

  useEffect(() => {
    setMenuOpen(false);
  }, [headerEnabled, pathname]);

  useEffect(() => {
    setSelectedCountry(initialCountry);
  }, [initialCountry]);

  const updateCountry = (event) => {
    const countryCode = event.target.value;
    setSelectedCountry(countryCode);
    persistCountryPreference(countryCode);
  };

  const hasSubmenu = Array.isArray(menu.menuLinks) && menu.menuLinks.some((item) => Array.isArray(item.children) && item.children.length);
  return (
      <header className={`${headerStyles.header} ${headerClasses}${menu.colorScheme === 'inverse' ? ' site-header--menu-scheme-inverse' : ''}`} style={headerStyle} data-menu-dividers={menu.mobileDividers} data-menu-feature-media={menu.submenuFeatureMedia || 'none'} data-menu-image-ratio={menu.submenuImageRatio || 'auto'} data-menu-accordion={menu.mobileAccordion ? 'true' : 'false'} data-block-anchor={previewSectionId || undefined}>
      {showAnnouncement ? <div className="announcement">{announcement}</div> : null}
      {headerEnabled ? <div className="nav-shell" data-editor-header-section="true">
        {menuEnabled ? <nav className="nav nav--left" aria-label="Primary navigation" data-editor-header-menu="true" style={{ color: menuLinkColor }}>
          {links.map(({ href, label, children: submenuChildren }) => submenuChildren?.length ? <span key={`${href}-${label}`} className="nav-link-wrap" data-has-submenu={submenuChildren.length ? 'true' : 'false'}>
            <Link href={href} className="nav-link nav-link--with-submenu" aria-haspopup="true" aria-expanded="false">{label} <ChevronDownIcon /></Link>
            <span className="nav-submenu" role="group" aria-label={`${label} submenu`} data-feature-media={menu.submenuFeatureMedia || 'none'} data-image-ratio={menu.submenuImageRatio || 'auto'}>
              {submenuChildren.map(({ href: childHref, label: childLabel }) => <Link key={`${childHref}-${childLabel}`} href={childHref} className="nav-submenu__link">{childLabel}</Link>)}
              {menu.submenuFeatureMedia !== 'none' ? <span className="nav-submenu__media" aria-hidden="true" data-media-type={menu.submenuFeatureMedia} /> : null}
            </span>
          </span> : <Link key={`${href}-${label}`} href={href} className="nav-link">{label}</Link>)}
          <button type="button" className="menu-button" onClick={() => setMenuOpen(true)} aria-haspopup="true" aria-expanded={menuOpen} aria-label="Open menu" aria-hidden={menu.mobileNavigationBar} tabIndex={menu.mobileNavigationBar ? -1 : undefined}>
            Menu
          </button>
        </nav> : null}
        {settings.showAccount ? <Link href="/account" aria-label="Account" className={headerStyles.accountLink}><AccountIcon /></Link> : null}
        {settings.showSearch ? <Link className={headerStyles.search} href="/search" aria-label="Search"><SearchIcon /></Link> : null}
        {settings.showCountrySelector && countryOptions.length > 1 ? <label className={headerStyles.countrySelector}>
          <span className={headerStyles.countrySelectorLabel}>Country/region</span>
          {settings.showCountryFlag ? <span className={headerStyles.countryFlag} aria-hidden="true">{countryFlagEmoji(selectedCountry)}</span> : null}
          {!settings.showCountryFlag ? <span className={headerStyles.countryCode} aria-hidden="true">{selectedCountry}</span> : null}
          <select aria-label="Country/region" value={selectedCountry} onChange={updateCountry}>
            {countryOptions.map(([countryCode, name]) => <option key={countryCode} value={countryCode}>{name}</option>)}
          </select>
          <span className={headerStyles.countryChevron} aria-hidden="true">⌄</span>
        </label> : null}
        {settings.showLanguageSelector ? <label className={headerStyles.languageSelector} style={{ fontFamily: 'var(--header-language-font-family)', fontSize: 'var(--header-language-font-size)' }}>
          <span className={headerStyles.languageSelectorLabel}>Language</span>
          <select aria-label="Language" defaultValue="en">
            <option value="en">English</option>
          </select>
          <span className={headerStyles.countryChevron} aria-hidden="true">⌄</span>
        </label> : null}
        {logoEnabled ? <Link href="/" className={`brand${isHome && logo.hideOnHome ? ' brand--hidden-home' : ''}`} aria-label="byShreen home">
          <LotusMark className="brand-logo" fill="var(--header-logo-color, #A64F60)" data-editor-header-logo="true" />
        </Link> : null}
        <nav className="nav nav--right" aria-label="Secondary navigation">
          <button className="bag-button" onClick={() => setOpen(true)} aria-label={`Open bag with ${count} items`}>
            <BagIcon /><span>{count}</span>
          </button>
        </nav>
      </div> : null}

      {headerEnabled && menuEnabled ? <button type="button" aria-label="Close menu overlay" className={`mobile-nav-overlay${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1} /> : null}
      {headerEnabled && menuEnabled ? <nav className={`mobile-nav-panel${menuOpen ? ' is-open' : ''}${menu.mobileDividers ? ' mobile-nav-panel--dividers' : ''}${menu.mobileAccordion ? ' mobile-nav-panel--accordion' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen} style={{ backgroundColor: 'var(--header-menu-base-background, var(--paper))', color: 'var(--header-menu-base-text, var(--ink))' }} data-accordion={menu.mobileAccordion ? 'true' : 'false'}>
        <div className="mobile-nav-panel__head">
          <span className="eyebrow">Menu</span>
          <button type="button" className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>×</button>
        </div>
        {links.map(({ href, label }) => <Link key={`${href}-${label}`} href={href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{label}</Link>)}
        {hasSubmenu ? <span className="mobile-nav-panel__hint">Submenus appear on hover on desktop. Use the Navigation editor to add child links.</span> : null}
      </nav> : null}
    </header>
  );
}
