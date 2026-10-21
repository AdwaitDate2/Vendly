import { notFound } from 'next/navigation';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { categories } from '@/data/products';
import { getPublicCollection } from '@/lib/public-catalog';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collection = await getPublicCollection(slug);
  if (!collection?.category) return {};
  const { category } = collection;
  const title = `${category.name} — byShreen`;
  const description = category.description || category.note || `Fine natural diamond ${category.name.toLowerCase()} in 14kt and 18kt solid gold.`;
  return {
    title,
    description,
    openGraph: { title, description, images: category.image ? [category.image] : undefined },
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const collection = await getPublicCollection(slug);
  if (!collection) notFound();
  const { category, products: collectionProducts } = collection;
  const template = await getPublishedResourceTemplate('collection', slug);
  const focalPointBySource = await loadMediaFocalPoints(category, collectionProducts, template.sections);

  return (
    <main className="collection-page">
      <ResourceTemplateRenderer
        resourceType="collection"
        resource={category}
        sections={template.sections}
        products={collectionProducts}
        focalPointBySource={focalPointBySource}
      />
    </main>
  );
}
