export const HEADER_SECTION_ID = 'header-settings';
export const HEADER_LOGO_BLOCK_ID = 'header-logo';
export const HEADER_MENU_BLOCK_ID = 'header-menu';

const LEGACY_COLOR_SCHEME_NUMBERS = {
  default: 1,
  inverse: 5,
  ivory: 1,
  paper: 2,
  olive: 5,
  mulberry: 4,
};

/**
 * Resolve the stored section scheme to one of the eight Shopify scheme slots.
 * Legacy labels remain stored as-is until the user explicitly picks a new slot.
 */
export function resolveColorSchemeSelection(value, fallback = 'scheme1') {
  if (value === 'inherit') return { value, number: null, legacyValue: null };

  const validFallback = /^scheme[1-8]$/.test(fallback) ? fallback : 'scheme1';
  const savedMatch = /^scheme([1-8])$/.exec(String(value || ''));
  if (savedMatch) return { value: `scheme${savedMatch[1]}`, number: Number(savedMatch[1]), legacyValue: null };

  const legacyNumber = LEGACY_COLOR_SCHEME_NUMBERS[value];
  if (legacyNumber) return { value: `scheme${legacyNumber}`, number: legacyNumber, legacyValue: value };

  const fallbackMatch = /^scheme([1-8])$/.exec(validFallback);
  return { value: validFallback, number: Number(fallbackMatch[1]), legacyValue: null };
}

export function isColorSchemeSelection(value) {
  return /^scheme[1-8]$/.test(String(value || '')) || Object.hasOwn(LEGACY_COLOR_SCHEME_NUMBERS, value);
}

export const DEFAULT_HEADER_SECTION = {
  id: HEADER_SECTION_ID,
  type: 'header',
  label: 'Header',
  enabled: true,
  settings: {
    logoPosition: 'center',
    menuPosition: 'left',
    menuRow: 'top',
    showSearch: true,
    searchPosition: 'right',
    searchRow: 'top',
    showAccount: false,
    showCountrySelector: false,
    showCountryFlag: true,
    countryPosition: 'left',
    countryRow: 'top',
    showLanguageSelector: false,
    languagePosition: 'left',
    languageRow: 'top',
    languageFont: 'body',
    languageSize: 12,
    width: 'page',
    height: 'standard',
    stickyMode: 'on-scroll-up',
    colorScheme: 'default',
    borderThickness: 0,
    transparentHome: false,
    transparentProduct: false,
    transparentCollection: false,
    homeScheme: 'inverse',
  },
  blocks: [
    {
      id: HEADER_LOGO_BLOCK_ID,
      type: 'logo',
      label: 'Logo',
      enabled: true,
      settings: {
        hideOnHome: false,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
    {
      id: HEADER_MENU_BLOCK_ID,
      type: 'menu',
      label: 'Menu',
      enabled: true,
      settings: {
        menuId: 'main',
        colorScheme: 'default',
        font: 'body',
        topLevelSize: 10,
        submenuSize: 'medium',
        submenuFont: 'body',
        case: 'uppercase',
        submenuFeatureMedia: 'none',
        submenuImageRatio: 'auto',
        submenuImageCornerRadius: 0,
        mobileNavigationBar: false,
        mobileAccordion: false,
        mobileDividers: false,
      },
    },
  ],
};

export function normalizeHeaderSection(section) {
  const source = section || {};
  const sourceBlocks = Array.isArray(source.blocks) ? source.blocks : [];
  const defaultBlocks = DEFAULT_HEADER_SECTION.blocks.map((defaultBlock) => {
    const matchingBlock = sourceBlocks.find((block) => block.id === defaultBlock.id || block.type === defaultBlock.type);
    return {
      ...defaultBlock,
      ...matchingBlock,
      id: matchingBlock?.id || defaultBlock.id,
      settings: { ...defaultBlock.settings, ...(matchingBlock?.settings || {}) },
    };
  });
  const extraBlocks = sourceBlocks.filter((block) => !defaultBlocks.some((defaultBlock) => defaultBlock.id === block.id));

  return {
    ...DEFAULT_HEADER_SECTION,
    ...source,
    id: HEADER_SECTION_ID,
    type: 'header',
    settings: { ...DEFAULT_HEADER_SECTION.settings, ...(source.settings || {}) },
    blocks: [...defaultBlocks, ...extraBlocks],
  };
}

export function getHeaderSection(sections = []) {
  return normalizeHeaderSection(sections.find((section) => section.id === HEADER_SECTION_ID || section.type === 'header'));
}

export function getHeaderBlock(headerSection, blockId) {
  return headerSection.blocks.find((block) => block.id === blockId)
    || DEFAULT_HEADER_SECTION.blocks.find((block) => block.id === blockId);
}

export function navigationPresentationFromSections(sections = []) {
  const menus = sections.filter((section) => section.type === 'menu');
  const headerSection = getHeaderSection(sections);
  const menuBlock = getHeaderBlock(headerSection, HEADER_MENU_BLOCK_ID);
  const selectedMenu = menus.find((menu) => menu.id === menuBlock.settings.menuId)
    || menus.find((menu) => menu.layout === 'main');
  const links = (menu) => (menu?.cards || [])
    .filter((link) => link.heading && link.linkHref)
    .map((link) => ({ label: link.heading, href: link.linkHref }));

  return {
    main: links(selectedMenu),
    footer: menus.filter((menu) => menu.layout === 'footer').map((menu) => ({ id: menu.id, title: menu.heading, links: links(menu) })),
    social: links(menus.find((menu) => menu.layout === 'social')),
    headerSettings: headerSection.settings,
    logoSettings: getHeaderBlock(headerSection, HEADER_LOGO_BLOCK_ID).settings,
    menuSettings: menuBlock.settings,
    logoEnabled: getHeaderBlock(headerSection, HEADER_LOGO_BLOCK_ID).enabled !== false,
    menuEnabled: menuBlock.enabled !== false,
    headerEnabled: headerSection.enabled !== false,
  };
}
