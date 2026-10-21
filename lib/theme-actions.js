'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { getStoreSettings, publishThemeDraft, saveStoreSettings, saveThemeDraft } from './settings';
import { COLOR_SCHEME_NUMBERS, THEME_COLORS, isDefaultTheme, normalizeTheme } from './theme';

/** Unified with page draft/publish: save is draft (versioned, revertible), publish goes live. */
export async function saveThemeDraftAction(themeInput, expectedVersion) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const currentSettings = await getStoreSettings();
    const theme = Object.fromEntries(THEME_COLORS.map((color) => [
      color.key,
      Object.hasOwn(themeInput || {}, color.key) ? String(themeInput[color.key] ?? '') : currentSettings.theme[color.key],
    ]));
    theme.colorSchemes = themeInput?.colorSchemes ?? currentSettings.theme.colorSchemes;
    theme.typography = themeInput?.typography ?? currentSettings.theme.typography;
    const result = await saveThemeDraft(theme, session.email, expectedVersion);
    return { ok: true, theme: normalizeTheme(result.theme), version: result.version };
  } catch (error) {
    const issue = error.issues?.[0];
    const path = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    return { ok: false, message: issue ? `${path}${issue.message}` : error.message || 'Could not save theme draft.' };
  }
}

export async function publishThemeAction(expectedVersion) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const saved = await publishThemeDraft(session.email, expectedVersion);
    await logActivity({
      actor: session.email,
      type: 'settings',
      action: isDefaultTheme(saved.theme) ? 'Reset theme settings' : 'Published theme settings',
      details: `${THEME_COLORS.map((color) => `${color.label}: ${saved.theme[color.key]}`).join(', ')}. Typography published.`,
    });
    revalidatePath('/', 'layout');
    return { ok: true, theme: normalizeTheme(saved.theme) };
  } catch (error) {
    const issue = error.issues?.[0];
    const path = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    return { ok: false, message: issue ? `${path}${issue.message}` : error.message || 'Could not publish theme.' };
  }
}

/** Legacy immediate-save path: kept for non-editor flows; editor draft/publish should be used in /admin/editor. */
export async function saveThemeAction(themeInput) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const currentSettings = await getStoreSettings();
    const theme = Object.fromEntries(THEME_COLORS.map((color) => [
      color.key,
      Object.hasOwn(themeInput || {}, color.key) ? String(themeInput[color.key] ?? '') : currentSettings.theme[color.key],
    ]));
    // Older clients submit only the seven brand colors. Preserve their saved schemes.
    theme.colorSchemes = themeInput?.colorSchemes ?? currentSettings.theme.colorSchemes;
    // Keep typography intact when a color-only client submits a partial theme payload.
    theme.typography = themeInput?.typography ?? currentSettings.theme.typography;
    const saved = await saveStoreSettings({ theme }, session.email);
    const changedSchemes = COLOR_SCHEME_NUMBERS.filter((number) => JSON.stringify(saved.theme.colorSchemes[`scheme${number}`]) !== JSON.stringify(currentSettings.theme.colorSchemes[`scheme${number}`]));
    const schemeSummary = changedSchemes.length ? `Changed Shopify schemes: ${changedSchemes.map((number) => `Scheme ${number}`).join(', ')}` : 'No Shopify scheme records changed';
    await logActivity({
      actor: session.email,
      type: 'settings',
      action: isDefaultTheme(saved.theme) ? 'Reset theme settings' : 'Changed theme settings',
      details: `${THEME_COLORS.map((color) => `${color.label}: ${saved.theme[color.key]}`).join(', ')}. ${schemeSummary}. Typography settings saved.`,
    });
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Theme saved. The website now uses these colors, schemes, and typography settings.', theme: normalizeTheme(saved.theme) };
  } catch (error) {
    const issue = error.issues?.[0];
    const path = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    return { ok: false, message: issue ? `${path}${issue.message}` : error.message || 'Could not save the theme.' };
  }
}
