// The seven root-level brand colors are part of the original byShreen settings contract.
// Shopify color schemes are separate at `theme.colorSchemes.schemeN` and do not replace them.
export const THEME_COLORS = [
  { key: 'mulberry', cssVar: '--mulberry', label: 'Accent', help: 'Buttons, links, the announcement bar, and highlights.', default: '#a84d5f' },
  { key: 'mulberryDark', cssVar: '--mulberry-dark', label: 'Accent — dark', help: 'Footer, dark bands, and button hover.', default: '#7c3a47' },
  { key: 'ink', cssVar: '--ink', label: 'Text & headings', help: 'Body text, headings, and borders on light backgrounds.', default: '#6a6b44' },
  { key: 'inkDark', cssVar: '--ink-dark', label: 'Text — dark', help: 'Strong text and olive section backgrounds.', default: '#52532f' },
  { key: 'paper', cssVar: '--paper', label: 'Page background', help: 'The main background of every page.', default: '#fff6df' },
  { key: 'ivory', cssVar: '--ivory', label: 'Light text & cards', help: 'Text on dark sections, cards, and light buttons.', default: '#fff6df' },
  { key: 'sand', cssVar: '--sand', label: 'Soft background', help: 'Panels such as the checkout summary and cart.', default: '#f5eedb' },
];

export const COLOR_SCHEME_NUMBERS = Array.from({ length: 8 }, (_, index) => index + 1);

export const COLOR_SCHEME_GROUPS = [
  { key: 'base', label: 'Base', roles: [
    { key: 'background', label: 'Background' },
    { key: 'headings', label: 'Headings' },
    { key: 'text', label: 'Text' },
    { key: 'links', label: 'Links' },
    { key: 'hoverLinks', label: 'Hover links' },
    { key: 'borders', label: 'Borders' },
    { key: 'shadow', label: 'Shadow' },
  ] },
  { key: 'primaryButton', label: 'Primary button', roles: [
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
    { key: 'borders', label: 'Borders' },
    { key: 'hoverBackground', label: 'Hover background' },
    { key: 'hoverText', label: 'Hover text' },
    { key: 'hoverBorders', label: 'Hover borders' },
  ] },
  { key: 'secondaryButton', label: 'Secondary button', roles: [
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
    { key: 'borders', label: 'Borders' },
    { key: 'hoverBackground', label: 'Hover background' },
    { key: 'hoverText', label: 'Hover text' },
    { key: 'hoverBorders', label: 'Hover borders' },
  ] },
  { key: 'inputs', label: 'Inputs', roles: [
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
    { key: 'borders', label: 'Borders' },
    { key: 'hoverBackground', label: 'Hover background' },
  ] },
  { key: 'variants', label: 'Variants', roles: [
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
    { key: 'borders', label: 'Borders' },
    { key: 'hoverBackground', label: 'Hover background' },
    { key: 'hoverText', label: 'Hover text' },
    { key: 'hoverBorders', label: 'Hover borders' },
  ] },
  { key: 'selectedVariants', label: 'Selected variants', roles: [
    { key: 'background', label: 'Background' },
    { key: 'text', label: 'Text' },
    { key: 'borders', label: 'Borders' },
    { key: 'hoverBackground', label: 'Hover background' },
    { key: 'hoverText', label: 'Hover text' },
    { key: 'hoverBorders', label: 'Hover borders' },
  ] },
];

export const COLOR_SCHEME_ROLES = COLOR_SCHEME_GROUPS.flatMap((group) => group.roles.map((role) => ({ ...role, groupKey: group.key, groupLabel: group.label })));
export const COLOR_SCHEME_CONTROL_COUNT = COLOR_SCHEME_ROLES.length;

// Only fonts already bundled by the storefront or native platform stacks are selectable.
// Arbitrary URLs are never accepted from stored theme data.
export const THEME_FONT_FAMILIES = [
  { value: 'Barlow', label: 'Barlow', css: "'Barlow', Arial, sans-serif", styles: ['300', '400', '500', '600'] },
  { value: 'DM Sans', label: 'DM Sans', css: "'DM Sans', Arial, sans-serif", styles: ['300', '400', '500', '600', 'italic-300', 'italic-400', 'italic-500', 'italic-600'] },
  { value: 'Instrument Serif', label: 'Instrument Serif', css: "'Instrument Serif', Georgia, serif", styles: ['400', 'italic'] },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', css: "'IBM Plex Mono', 'Courier New', monospace", styles: ['400', '500'] },
  { value: 'Arial', label: 'Arial', css: 'Arial, sans-serif', styles: ['300', '400', '500', '600', 'italic-300', 'italic-400', 'italic-500', 'italic-600'] },
  { value: 'Georgia', label: 'Georgia', css: 'Georgia, serif', styles: ['300', '400', '500', '600', 'italic-300', 'italic-400', 'italic-500', 'italic-600'] },
  { value: 'system-ui', label: 'System', css: 'system-ui, sans-serif', styles: ['300', '400', '500', '600', 'italic-300', 'italic-400', 'italic-500', 'italic-600'] },
];

export const THEME_FONT_STYLES = [...new Set(THEME_FONT_FAMILIES.flatMap(({ styles }) => styles))];
export const THEME_TYPOGRAPHY_PRESETS = ['paragraph', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export const THEME_FONT_ROLES = ['body', 'subheading', 'heading', 'accent'];

// Values mirror the existing byShreen font families. Preset metrics are safe baseline values;
// component-specific CSS keeps its established sizing unless it uses these root variables.
export const DEFAULT_TYPOGRAPHY = {
  fonts: {
    body: { family: 'Barlow', style: '400' },
    subheading: { family: 'Barlow', style: '400' },
    heading: { family: 'Instrument Serif', style: '400' },
    accent: { family: 'IBM Plex Mono', style: '400' },
  },
  presets: {
    paragraph: { size: 16, lineHeight: 1.5 },
    h1: { font: 'heading', size: 56, lineHeight: 1.05, letterSpacing: '-0.03em', case: 'none' },
    h2: { font: 'heading', size: 40, lineHeight: 1.1, letterSpacing: '-0.03em', case: 'none' },
    h3: { font: 'heading', size: 28, lineHeight: 1.15, letterSpacing: '-0.02em', case: 'none' },
    h4: { font: 'heading', size: 24, lineHeight: 1.2, letterSpacing: '-0.01em', case: 'none' },
    h5: { font: 'subheading', size: 20, lineHeight: 1.25, letterSpacing: '0em', case: 'none' },
    h6: { font: 'subheading', size: 16, lineHeight: 1.3, letterSpacing: '0.02em', case: 'none' },
  },
};

const FONT_FAMILY_VALUES = new Set(THEME_FONT_FAMILIES.map(({ value }) => value));
const FONT_STYLES_BY_FAMILY = Object.fromEntries(THEME_FONT_FAMILIES.map(({ value, styles }) => [value, new Set(styles)]));
const FONT_ROLE_VALUES = new Set(THEME_FONT_ROLES);
const TYPOGRAPHY_CASE_VALUES = new Set(['none', 'uppercase', 'lowercase', 'capitalize']);
const DEFAULT_FONT_STACKS = Object.fromEntries(THEME_FONT_FAMILIES.map(({ value, css }) => [value, css]));

export function getThemeFontStyles(family) {
  return THEME_FONT_FAMILIES.find(({ value }) => value === family)?.styles || [];
}

function normalizeFontStyle(value, family, fallback) {
  return FONT_STYLES_BY_FAMILY[family]?.has(value) ? value : fallback;
}

function normalizeTypographyNumber(value, fallback, minimum, maximum, precision = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) return fallback;
  const factor = 10 ** precision;
  return Math.round(parsed * factor) / factor;
}

function normalizeLetterSpacing(value, fallback) {
  if (typeof value !== 'string' || !/^-?(?:\d+\.?\d*|\.\d+)(?:px|em|rem)$/.test(value.trim())) return fallback;
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || Math.abs(numericValue) > 1) return fallback;
  return value.trim();
}

/** Scales an edited desktop preset down to 75–100% between narrow screens and 1000px. */
export function responsiveTypographySize(desktopSize) {
  const minimumSize = Math.round(desktopSize * 0.75 * 100) / 100;
  const viewportScale = Math.round((desktopSize * 0.25 / 10) * 1000) / 1000;
  return `clamp(${minimumSize}px, calc(${minimumSize}px + ${viewportScale}vw), ${desktopSize}px)`;
}

export function normalizeTypography(typography = {}) {
  const fonts = Object.fromEntries(THEME_FONT_ROLES.map((role) => {
    const saved = typography?.fonts?.[role] || {};
    const fallback = DEFAULT_TYPOGRAPHY.fonts[role];
    const family = FONT_FAMILY_VALUES.has(saved.family) ? saved.family : fallback.family;
    const fallbackStyle = FONT_STYLES_BY_FAMILY[family]?.has(fallback.style) ? fallback.style : (THEME_FONT_FAMILIES.find(({ value }) => value === family)?.styles[0] || '400');
    return [role, {
      family,
      style: normalizeFontStyle(saved.style, family, fallbackStyle),
    }];
  }));
  const presets = Object.fromEntries(THEME_TYPOGRAPHY_PRESETS.map((preset) => {
    const saved = typography?.presets?.[preset] || {};
    const fallback = DEFAULT_TYPOGRAPHY.presets[preset];
    if (preset === 'paragraph') return [preset, {
      size: normalizeTypographyNumber(saved.size, fallback.size, 8, 96, 1),
      lineHeight: normalizeTypographyNumber(saved.lineHeight, fallback.lineHeight, 0.8, 3, 2),
    }];
    return [preset, {
      font: FONT_ROLE_VALUES.has(saved.font) ? saved.font : fallback.font,
      size: normalizeTypographyNumber(saved.size, fallback.size, 8, 160, 1),
      lineHeight: normalizeTypographyNumber(saved.lineHeight, fallback.lineHeight, 0.8, 3, 2),
      letterSpacing: normalizeLetterSpacing(saved.letterSpacing, fallback.letterSpacing),
      case: TYPOGRAPHY_CASE_VALUES.has(saved.case) ? saved.case : fallback.case,
    }];
  }));
  return { fonts, presets };
}

export function isTypographyValid(typography = {}) {
  if (!typography || typeof typography !== 'object' || !typography.fonts || !typography.presets) return false;
  for (const role of THEME_FONT_ROLES) {
    const font = typography.fonts[role];
    if (!font || !FONT_FAMILY_VALUES.has(font.family) || !FONT_STYLES_BY_FAMILY[font.family]?.has(font.style)) return false;
  }
  for (const preset of THEME_TYPOGRAPHY_PRESETS) {
    const value = typography.presets[preset];
    const normalized = normalizeTypography({ fonts: DEFAULT_TYPOGRAPHY.fonts, presets: { [preset]: value } }).presets[preset];
    if (!value || !Number.isFinite(Number(value.size)) || !Number.isFinite(Number(value.lineHeight))) return false;
    if (normalized.size !== Number(value.size) || normalized.lineHeight !== Number(value.lineHeight)) return false;
    if (preset !== 'paragraph' && (normalized.font !== value.font || normalized.letterSpacing !== value.letterSpacing || normalized.case !== value.case)) return false;
  }
  return true;
}

// All eight numbered records below match values captured from the Shopify browser reference.
// The literal `Transparent` roles are normalized to the persisted CSS token `transparent`.
const EXACT_SCHEME_1 = {
  base: { background: '#FCFBF9', headings: '#342A24', text: '#422F22', links: '#C5D7E8', hoverLinks: '#422F22', borders: '#F8F6F0', shadow: '#342A24' },
  primaryButton: { background: '#C5D7E8', text: '#342A24', borders: '#342A24', hoverBackground: '#342A24', hoverText: '#EBF4FD', hoverBorders: '#342A24' },
  secondaryButton: { background: '#342A24', text: '#F8F6F0', borders: '#342A24', hoverBackground: '#C5D7E8', hoverText: '#342A24', hoverBorders: '#342A24' },
  inputs: { background: '#FCFBF9', text: '#342A24', borders: '#342A24', hoverBackground: '#F8F6F0' },
  variants: { background: '#FCFBF9', text: '#342A24', borders: '#C5D7E8', hoverBackground: '#342A24', hoverText: '#EBF4FD', hoverBorders: '#422F22' },
  selectedVariants: { background: '#342A24', text: '#FCFBF9', borders: '#342A24', hoverBackground: '#422F22', hoverText: '#C5D7E8', hoverBorders: '#422F22' },
};

const EXACT_SCHEME_2 = {
  base: { background: '#F4F1EB', headings: '#342A24', text: '#342A24', links: '#C5D7E8', hoverLinks: '#342A24', borders: '#F8F6F0', shadow: '#342A24' },
  primaryButton: { background: '#C5D7E8', text: '#342A24', borders: '#422F22', hoverBackground: '#C5D7E8', hoverText: '#342A24', hoverBorders: '#C5D7E8' },
  secondaryButton: { background: '#FFFFFF', text: '#000000', borders: '#000000', hoverBackground: '#FFFFFF', hoverText: '#202020', hoverBorders: '#202020' },
  inputs: { background: '#FFFFFF', text: '#000000', borders: '#000000', hoverBackground: '#F5F5F5' },
  variants: { background: '#FFFFFF', text: '#000000', borders: '#E6E6E6', hoverBackground: '#F5F5F5', hoverText: '#000000', hoverBorders: '#E6E6E6' },
  selectedVariants: { background: '#000000', text: '#FFFFFF', borders: '#000000', hoverBackground: '#1A1A1A', hoverText: '#FFFFFF', hoverBorders: '#1A1A1A' },
};

const EXACT_SCHEME_3 = {
  base: { background: '#EBF4FD', headings: '#342A24', text: '#342A24', links: '#342A24', hoverLinks: '#342A24', borders: '#342A24', shadow: '#342A24' },
  primaryButton: { background: '#422F22', text: '#F8F6F0', borders: '#422F22', hoverBackground: '#422F22', hoverText: '#F8F6F0', hoverBorders: '#422F22' },
  secondaryButton: { background: '#F8F6F0', text: '#422F22', borders: '#422F22', hoverBackground: '#C5D7E8', hoverText: '#422F22', hoverBorders: '#F8F6F0' },
  inputs: { background: '#FFFFFF', text: '#342A24', borders: '#342A24', hoverBackground: '#FFFFFF' },
  variants: { background: '#FFFFFF', text: '#342A24', borders: '#F8F6F0', hoverBackground: '#FFFFFF', hoverText: '#342A24', hoverBorders: '#F8F6F0' },
  selectedVariants: { background: '#000000', text: '#FFFFFF', borders: '#000000', hoverBackground: '#1A1A1A', hoverText: '#FFFFFF', hoverBorders: '#1A1A1A' },
};

const EXACT_SCHEME_4 = {
  base: { background: '#422F22', headings: '#EBF4FD', text: '#C5D7E8', links: '#EBF4FD', hoverLinks: '#C5D7E8', borders: '#FCFBF9', shadow: '#F8F6F0' },
  primaryButton: { background: '#FCFBF9', text: '#000000', borders: '#FFFFFF', hoverBackground: '#EBF4FD', hoverText: '#000000', hoverBorders: '#EBF4FD' },
  secondaryButton: { background: '#EBF4FD', text: '#342A24', borders: '#342A24', hoverBackground: '#C5D7E8', hoverText: '#422F22', hoverBorders: '#422F22' },
  inputs: { background: '#FCFBF9', text: '#342A24', borders: '#342A24', hoverBackground: '#F8F6F0' },
  variants: { background: '#FCFBF9', text: '#342A24', borders: '#342A24', hoverBackground: '#C5D7E8', hoverText: '#342A24', hoverBorders: '#342A24' },
  selectedVariants: { background: '#342A24', text: '#FCFBF9', borders: '#342A24', hoverBackground: '#C5D7E8', hoverText: '#FCFBF9', hoverBorders: '#F8F6F0' },
};

const EXACT_SCHEME_5 = {
  base: { background: '#342924', headings: '#FFFFFF', text: '#F8F6F0', links: '#F8F6F0', hoverLinks: '#59402F', borders: '#422F22', shadow: '#342924' },
  primaryButton: { background: '#FCFBF9', text: '#342924', borders: '#F8F6F0', hoverBackground: '#DAEBFA', hoverText: '#342924', hoverBorders: '#DAEBFA' },
  secondaryButton: { background: '#C5D7E8', text: '#342A24', borders: '#FCFBF9', hoverBackground: '#342924', hoverText: '#C5D7E8', hoverBorders: '#422F22' },
  inputs: { background: '#342924', text: '#FFFFFF', borders: '#FFFFFF', hoverBackground: '#422F22' },
  variants: { background: '#F5F5F5', text: '#342924', borders: '#DAECFB', hoverBackground: '#DAECFB', hoverText: '#342924', hoverBorders: '#F5F5F5' },
  selectedVariants: { background: '#342A24', text: '#F8F6F0', borders: '#342A24', hoverBackground: '#422F22', hoverText: '#DBEDFC', hoverBorders: '#422F22' },
};

const EXACT_SCHEME_6 = {
  base: { background: 'transparent', headings: '#FFFFFF', text: '#FFFFFF', links: '#FFFFFF', hoverLinks: '#ACACAC', borders: 'transparent', shadow: 'transparent' },
  primaryButton: { background: '#FDC656', text: '#000000', borders: '#FFFFFF', hoverBackground: '#DEDEDE', hoverText: '#000000', hoverBorders: '#DEDEDE' },
  secondaryButton: { background: 'transparent', text: '#FFFFFF', borders: '#FFFFFF', hoverBackground: 'transparent', hoverText: '#ACACAC', hoverBorders: '#ACACAC' },
  inputs: { background: '#FFFFFF', text: '#000000', borders: '#000000', hoverBackground: '#F5F5F5' },
  variants: { background: '#FFFFFF', text: '#000000', borders: '#E6E6E6', hoverBackground: '#F5F5F5', hoverText: '#000000', hoverBorders: '#E6E6E6' },
  selectedVariants: { background: '#000000', text: '#FFFFFF', borders: '#000000', hoverBackground: '#1A1A1A', hoverText: '#FFFFFF', hoverBorders: '#1A1A1A' },
};

const EXACT_SCHEME_7 = {
  base: { background: '#F1EDE7', headings: '#000000', text: '#000000', links: '#000000', hoverLinks: '#000000', borders: '#000000', shadow: '#000000' },
  primaryButton: { background: '#C3CCA6', text: '#000000', borders: '#000000', hoverBackground: '#000000', hoverText: '#FFFFFF', hoverBorders: '#000000' },
  secondaryButton: { background: '#EFEFEF', text: '#000000', borders: '#000000', hoverBackground: '#DEDEDE', hoverText: '#000000', hoverBorders: '#000000' },
  inputs: { background: '#FFFFFF', text: '#000000', borders: '#000000', hoverBackground: '#F5F5F5' },
  variants: { background: '#FFFFFF', text: '#000000', borders: '#E6E6E6', hoverBackground: '#F5F5F5', hoverText: '#000000', hoverBorders: '#E6E6E6' },
  selectedVariants: { background: '#000000', text: '#FFFFFF', borders: '#000000', hoverBackground: '#1A1A1A', hoverText: '#FFFFFF', hoverBorders: '#1A1A1A' },
};

const EXACT_SCHEME_8 = {
  base: { background: '#FAF9F1', headings: '#000000', text: '#000000', links: '#C3CCA6', hoverLinks: '#000000', borders: '#E6E6E6', shadow: '#000000' },
  primaryButton: { background: '#C3CCA6', text: '#000000', borders: '#000000', hoverBackground: '#000000', hoverText: '#FFFFFF', hoverBorders: '#000000' },
  secondaryButton: { background: '#EFEFEF', text: '#000000', borders: '#000000', hoverBackground: '#DEDEDE', hoverText: '#000000', hoverBorders: '#000000' },
  inputs: { background: '#FFFFFF', text: '#000000', borders: '#000000', hoverBackground: '#FAF9F1' },
  variants: { background: '#FFFFFF', text: '#000000', borders: '#E6E6E6', hoverBackground: '#F5F5F5', hoverText: '#000000', hoverBorders: '#E6E6E6' },
  selectedVariants: { background: '#000000', text: '#FFFFFF', borders: '#000000', hoverBackground: '#1A1A1A', hoverText: '#FFFFFF', hoverBorders: '#1A1A1A' },
};

export const DEFAULT_COLOR_SCHEMES = {
  scheme1: EXACT_SCHEME_1,
  scheme2: EXACT_SCHEME_2,
  scheme3: EXACT_SCHEME_3,
  scheme4: EXACT_SCHEME_4,
  scheme5: EXACT_SCHEME_5,
  scheme6: EXACT_SCHEME_6,
  scheme7: EXACT_SCHEME_7,
  scheme8: EXACT_SCHEME_8,
};

export const DEFAULT_THEME = {
  ...Object.fromEntries(THEME_COLORS.map((color) => [color.key, color.default])),
  colorSchemes: DEFAULT_COLOR_SCHEMES,
  typography: DEFAULT_TYPOGRAPHY,
};

export function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ''));
}

export function isTransparentColor(value) {
  return String(value || '').trim().toLowerCase() === 'transparent';
}

/** Shopify scheme roles accept opaque six-digit hex colors or the CSS keyword transparent. */
export function isThemeColorValue(value) {
  return isHexColor(value) || isTransparentColor(value);
}

function normalizeThemeColorValue(value, fallback) {
  if (isHexColor(value)) return value.toLowerCase();
  if (isTransparentColor(value)) return 'transparent';
  return isHexColor(fallback) ? fallback.toLowerCase() : 'transparent';
}

/** Fills absent or invalid roles from the exact captured records, including transparent values. */
export function normalizeColorSchemes(colorSchemes = {}) {
  return Object.fromEntries(COLOR_SCHEME_NUMBERS.map((number) => {
    const schemeKey = `scheme${number}`;
    const savedScheme = colorSchemes?.[schemeKey] || {};
    const defaultScheme = DEFAULT_COLOR_SCHEMES[schemeKey];
    return [schemeKey, Object.fromEntries(COLOR_SCHEME_GROUPS.map((group) => [
      group.key,
      Object.fromEntries(group.roles.map(({ key: role }) => [
        role,
        normalizeThemeColorValue(savedScheme[group.key]?.[role], defaultScheme[group.key][role]),
      ])),
    ]))];
  }));
}

/** Legacy records with the original seven brand colors gain the canonical eight schemes. */
export function normalizeTheme(theme = {}) {
  return {
    ...Object.fromEntries(THEME_COLORS.map((color) => [color.key, isHexColor(theme[color.key]) ? theme[color.key].toLowerCase() : color.default])),
    colorSchemes: normalizeColorSchemes(theme.colorSchemes),
    typography: normalizeTypography(theme.typography),
  };
}

export function getThemeColorScheme(theme, schemeNumber = 1) {
  const normalized = normalizeTheme(theme);
  const safeSchemeNumber = COLOR_SCHEME_NUMBERS.includes(Number(schemeNumber)) ? Number(schemeNumber) : 1;
  return normalized.colorSchemes[`scheme${safeSchemeNumber}`];
}

/** True when the brand keys and all canonical scheme roles match their defaults. */
export function isDefaultTheme(theme) {
  return themesEqual(normalizeTheme(theme), DEFAULT_THEME);
}

/** Compares all brand keys and every group/role while keeping invalid hex drafts dirty. */
export function themesEqual(firstTheme = {}, secondTheme = {}) {
  const first = normalizeTheme(firstTheme);
  const second = normalizeTheme(secondTheme);
  const brandColorsMatch = THEME_COLORS.every(({ key }) => first[key] === second[key]);
  const schemesMatch = COLOR_SCHEME_NUMBERS.every((number) => {
    const schemeKey = `scheme${number}`;
    return COLOR_SCHEME_GROUPS.every((group) => group.roles.every(({ key: role }) => first.colorSchemes[schemeKey][group.key][role] === second.colorSchemes[schemeKey][group.key][role]));
  });
  const typographyMatch = JSON.stringify(first.typography) === JSON.stringify(second.typography);
  const invalidTypographyDraftDiffers = firstTheme.typography !== undefined
    && secondTheme.typography !== undefined
    && JSON.stringify(firstTheme.typography) !== JSON.stringify(secondTheme.typography)
    && (!isTypographyValid(firstTheme.typography) || !isTypographyValid(secondTheme.typography));
  const firstValues = THEME_COLORS.map(({ key }) => [firstTheme[key], secondTheme[key]]);
  const schemeValues = COLOR_SCHEME_NUMBERS.flatMap((number) => {
    const schemeKey = `scheme${number}`;
    return COLOR_SCHEME_GROUPS.flatMap((group) => group.roles.map(({ key: role }) => [firstTheme.colorSchemes?.[schemeKey]?.[group.key]?.[role], secondTheme.colorSchemes?.[schemeKey]?.[group.key]?.[role]]));
  });
  const invalidDraftDiffers = [...firstValues, ...schemeValues].some(([firstValue, secondValue]) => firstValue !== undefined && secondValue !== undefined && firstValue !== secondValue && (!isThemeColorValue(firstValue) || !isThemeColorValue(secondValue)));
  return brandColorsMatch && schemesMatch && typographyMatch && !invalidDraftDiffers && !invalidTypographyDraftDiffers;
}

export function isThemeValid(theme = {}) {
  return THEME_COLORS.every(({ key }) => isHexColor(theme[key]))
    && isTypographyValid(theme.typography || DEFAULT_TYPOGRAPHY)
    && COLOR_SCHEME_NUMBERS.every((number) => {
      const schemeKey = `scheme${number}`;
      return COLOR_SCHEME_GROUPS.every((group) => group.roles.every(({ key: role }) => isThemeColorValue(theme.colorSchemes?.[schemeKey]?.[group.key]?.[role])));
    });
}

/** Contrast warnings for the selected Shopify scheme; color editing itself stays available. */
export function colorSchemeWarnings(theme, schemeNumber = 1) {
  const scheme = getThemeColorScheme(theme, schemeNumber);
  const pairs = [
    [`Base text on background`, scheme.base.text, scheme.base.background, 4.5],
    [`Base headings on background`, scheme.base.headings, scheme.base.background, 3],
    [`Base links on background`, scheme.base.links, scheme.base.background, 4.5],
    [`Base hover links on background`, scheme.base.hoverLinks, scheme.base.background, 4.5],
    [`Primary button text on background`, scheme.primaryButton.text, scheme.primaryButton.background, 4.5],
    [`Primary button hover text on background`, scheme.primaryButton.hoverText, scheme.primaryButton.hoverBackground, 4.5],
    [`Secondary button text on background`, scheme.secondaryButton.text, scheme.secondaryButton.background, 4.5],
    [`Secondary button hover text on background`, scheme.secondaryButton.hoverText, scheme.secondaryButton.hoverBackground, 4.5],
    [`Input text on background`, scheme.inputs.text, scheme.inputs.background, 4.5],
    [`Variant text on background`, scheme.variants.text, scheme.variants.background, 4.5],
    [`Variant hover text on background`, scheme.variants.hoverText, scheme.variants.hoverBackground, 4.5],
    [`Selected variant text on background`, scheme.selectedVariants.text, scheme.selectedVariants.background, 4.5],
    [`Selected variant hover text on background`, scheme.selectedVariants.hoverText, scheme.selectedVariants.hoverBackground, 4.5],
  ];
  return pairs
    .filter(([, foreground, background]) => isHexColor(foreground) && isHexColor(background))
    .map(([label, foreground, background, minimum]) => ({ label, ratio: contrastRatio(foreground, background), minimum }))
    .filter(({ ratio, minimum }) => ratio < minimum)
    .map(({ label, ratio, minimum }) => `${label} may be hard to read (contrast ${ratio.toFixed(1)}:1; aim for ${minimum}:1 or more).`);
}

/** CSS vars follow `--color-scheme-{N}-{group}-{role}` for later section and header consumers. */
export function themeCssVariableMap(theme) {
  const normalized = normalizeTheme(theme);
  const variables = Object.fromEntries(THEME_COLORS.map(({ key, cssVar }) => [cssVar, normalized[key]]));
  const roleVariables = {};
  THEME_FONT_ROLES.forEach((role) => {
    const font = normalized.typography.fonts[role];
    const styleParts = font.style.startsWith('italic-') ? font.style.slice('italic-'.length) : font.style;
    roleVariables[`--theme-font-${role}`] = DEFAULT_FONT_STACKS[font.family];
    roleVariables[`--theme-font-${role}-weight`] = styleParts === 'italic' ? '400' : styleParts;
    roleVariables[`--theme-font-${role}-style`] = font.style.startsWith('italic') ? 'italic' : 'normal';
  });
  roleVariables['--sans'] = 'var(--theme-font-body)';
  roleVariables['--serif'] = 'var(--theme-font-heading)';
  roleVariables['--mono'] = 'var(--theme-font-accent)';
  roleVariables['--subheading-font'] = 'var(--theme-font-subheading)';
  roleVariables['--subheading-font-weight'] = 'var(--theme-font-subheading-weight)';
  roleVariables['--subheading-font-style'] = 'var(--theme-font-subheading-style)';
  THEME_TYPOGRAPHY_PRESETS.forEach((preset) => {
    const settings = normalized.typography.presets[preset];
    const defaults = DEFAULT_TYPOGRAPHY.presets[preset];
    const prefix = `--typography-${preset}`;
    if (settings.size !== defaults.size) roleVariables[`${prefix}-size`] = responsiveTypographySize(settings.size);
    if (settings.lineHeight !== defaults.lineHeight) roleVariables[`${prefix}-line-height`] = String(settings.lineHeight);
    if (preset !== 'paragraph') {
      const role = settings.font;
      if (role !== defaults.font) roleVariables[`${prefix}-font`] = `var(--theme-font-${role})`;
      if (settings.letterSpacing !== defaults.letterSpacing) roleVariables[`${prefix}-letter-spacing`] = settings.letterSpacing;
      if (settings.case !== defaults.case) roleVariables[`${prefix}-case`] = settings.case;
      const roleDefaultStyle = DEFAULT_TYPOGRAPHY.fonts[role]?.style;
      const selectedStyle = normalized.typography.fonts[role]?.style;
      if (selectedStyle !== roleDefaultStyle) {
        roleVariables[`${prefix}-font-weight`] = `var(--theme-font-${role}-weight)`;
        roleVariables[`${prefix}-font-style`] = `var(--theme-font-${role}-style)`;
      }
    }
  });
  Object.assign(variables, roleVariables);
  COLOR_SCHEME_NUMBERS.forEach((number) => {
    const schemeKey = `scheme${number}`;
    COLOR_SCHEME_GROUPS.forEach((group) => group.roles.forEach(({ key: role }) => {
      const cssGroup = group.key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const cssRole = role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      variables[`--color-scheme-${number}-${cssGroup}-${cssRole}`] = normalized.colorSchemes[schemeKey][group.key][role];
    }));
  });
  return variables;
}

/** CSS declarations for legacy brand colors, Shopify schemes, and typography controls. */
export function themeCssVariables(theme) {
  return Object.entries(themeCssVariableMap(theme)).map(([name, value]) => `${name}: ${value};`).join(' ');
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Existing readability warnings for the byShreen storefront's legacy brand-color consumers. */
export function themeWarnings(theme) {
  const normalized = normalizeTheme(theme);
  const pairs = [
    ['Text on the page background', normalized.ink, normalized.paper, 4.5],
    ['Button text on the accent color', normalized.ivory, normalized.mulberry, 3],
    ['Light text on dark sections', normalized.ivory, normalized.mulberryDark, 4.5],
    ['Light text on olive sections', normalized.ivory, normalized.inkDark, 4.5],
  ];
  return pairs
    .map(([label, foreground, background, minimum]) => ({ label, ratio: contrastRatio(foreground, background), minimum }))
    .filter(({ ratio, minimum }) => ratio < minimum)
    .map(({ label, ratio, minimum }) => `${label} may be hard to read (contrast ${ratio.toFixed(1)}:1; aim for ${minimum}:1 or more).`);
}
