import ThemeEditor from '@/components/admin/ThemeEditor';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { getStoreSettings } from '@/lib/settings';
import { normalizeTheme } from '@/lib/theme';

export default async function ThemePage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Theme</h1><p>Only owners can change the website’s colors.</p></div></div></div>;
  }
  const settings = await getStoreSettings();
  return (
    <div className="admin-page admin-page--wide">
      <div className="admin-page-heading"><div><h1>Theme</h1><p>The colors used across the whole website. Changes show in the preview right away; nothing goes live until you save.</p></div></div>
      <ThemeEditor initial={normalizeTheme(settings.theme)} comingSoonEnabled={settings.comingSoon.enabled} />
    </div>
  );
}
