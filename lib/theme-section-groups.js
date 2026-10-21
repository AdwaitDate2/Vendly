export const THEME_SECTION_GROUPS_SCHEMA_VERSION = 1;

export const LEGACY_THEME_SECTION_SOURCES = [
  'global.announcement',
  'navigation.header-settings',
  'global.newsletter',
  'global.footer',
];

export function createDefaultThemeSectionGroups() {
  return {
    schemaVersion: THEME_SECTION_GROUPS_SCHEMA_VERSION,
    header: [
      {
        id: 'announcement-bar',
        type: 'legacyReference',
        source: 'global.announcement',
        label: 'Announcement bar',
        enabled: true,
        settings: {},
      },
      {
        id: 'header',
        type: 'legacyReference',
        source: 'navigation.header-settings',
        label: 'Header',
        enabled: true,
        settings: {},
      },
    ],
    footer: [
      {
        id: 'newsletter',
        type: 'legacyReference',
        source: 'global.newsletter',
        label: 'Newsletter',
        enabled: true,
        settings: {},
      },
      {
        id: 'footer',
        type: 'legacyReference',
        source: 'global.footer',
        label: 'Footer',
        enabled: true,
        settings: {},
      },
    ],
  };
}

export function resolveThemeSectionGroups(value) {
  if (
    value?.schemaVersion === THEME_SECTION_GROUPS_SCHEMA_VERSION
    && Array.isArray(value.header)
    && Array.isArray(value.footer)
  ) {
    return value;
  }

  return createDefaultThemeSectionGroups();
}
