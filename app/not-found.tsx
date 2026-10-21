import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { getPublicProducts } from '@/lib/public-catalog';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export default async function NotFound() {
  const [template, catalog] = await Promise.all([
    getPublishedResourceTemplate('404', '404'),
    getPublicProducts(),
  ]);
  const resource = { handle: '404', title: '404 page' };
  const focalPointBySource = await loadMediaFocalPoints(resource, template.sections, catalog.products);

  return (
    <main className="not-found-template">
      <ResourceTemplateRenderer
        resourceType="404"
        resource={resource}
        sections={template.sections}
        products={catalog.products}
        focalPointBySource={focalPointBySource}
      />
    </main>
  );
}
