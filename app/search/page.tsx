import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { getSearchPageData } from './search-results';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const metadata = {
  title: 'Search — byShreen',
  description: 'Search the byShreen jewelry collection.',
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const template = await getPublishedResourceTemplate('search', 'search');
  const searchData = await getSearchPageData(params, { enableTemplateFeatures: template.isPublished });
  const resource = { ...searchData, templatePublished: template.isPublished };
  const focalPointBySource = await loadMediaFocalPoints(resource, template.sections);

  return (
    <main className="listing-page">
      <ResourceTemplateRenderer
        resourceType="search"
        resource={resource}
        sections={template.sections}
        focalPointBySource={focalPointBySource}
      />
    </main>
  );
}
