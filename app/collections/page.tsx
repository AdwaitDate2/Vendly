import { getPublicCollections } from '@/lib/public-catalog';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const metadata = {
  title: 'Collections — byShreen',
  description: 'Explore rings, necklaces, earrings, bracelets, and the current byShreen edit.',
};

export default async function CollectionsIndexPage() {
  const [collections, template] = await Promise.all([
    getPublicCollections(),
    getPublishedResourceTemplate('collection-list', 'index'),
  ]);
  const focalPointBySource = await loadMediaFocalPoints(collections, template.sections);
  return (
    <main className="listing-page">
      <ResourceTemplateRenderer resourceType="collection-list" resource={collections} sections={template.sections} focalPointBySource={focalPointBySource} />
    </main>
  );
}
