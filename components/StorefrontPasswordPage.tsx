import BlockRenderer from '@/components/blocks/BlockRenderer';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { getStoreSettings } from '@/lib/settings';
import { loadMediaFocalPoints } from '@/lib/page-data';

/** Public storefront gate: only the published Password template can reach this renderer. */
export default async function StorefrontPasswordPage() {
  const [template, settings] = await Promise.all([
    getPublishedResourceTemplate('password', 'password'),
    getStoreSettings(),
  ]);
  const resource = {
    handle: 'password',
    title: 'Password',
    logo: settings.logo || settings.emailDesign?.logo || '',
    logoWidth: settings.logoWidth || settings.emailDesign?.logoWidth || 140,
  };
  const sections = template.sections || [];
  const hasVisiblePasswordFooter = sections.some((section) => section.type === 'passwordFooter' && section.enabled !== false);
  const publicSections = hasVisiblePasswordFooter
    ? sections
    : [...sections, { id: 'password-footer-gate-fallback', type: 'passwordFooter', enabled: true, static: true }];
  const focalPointBySource = await loadMediaFocalPoints(resource, publicSections);

  return (
    <main className="password-template-preview password-template-public">
      <BlockRenderer
        blocks={publicSections}
        preview={false}
        resourceType="password"
        resource={resource}
        focalPointBySource={focalPointBySource}
        contactEmail={settings.contactEmail || ''}
      />
    </main>
  );
}
