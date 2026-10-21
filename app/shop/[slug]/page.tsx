import { notFound } from 'next/navigation';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import { products as staticProducts } from '@/data/products';
import { getPublicProduct } from '@/lib/public-catalog';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { getStoreSettings } from '@/lib/settings';
import { loadMediaFocalPoints } from '@/lib/page-data';

export function generateStaticParams() {
  return staticProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getPublicProduct(slug);
  if (!result) return {};
  const { product } = result;
  const description = product.seoDescription || String(product.description || '').slice(0, 160);
  return {
    title: product.seoTitle || `${product.title} — byShreen`,
    description,
    openGraph: { title: product.seoTitle || product.title, description, images: product.images?.[0] ? [product.images[0]] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const result = await getPublicProduct(slug);
  if (!result) notFound();
  const { product, related } = result;
  const selectedVariantId = typeof query?.variant === 'string' ? query.variant : '';
  const { productInfo, contactEmail } = await getStoreSettings();
  const template = await getPublishedResourceTemplate('product', slug);
  const resource = { ...product, selectedVariantId };
  const focalPointBySource = await loadMediaFocalPoints(resource, template.sections, related, productInfo);

  return (
    <main className="product-page">
      <ResourceTemplateRenderer
        resourceType="product"
        resource={resource}
        sections={template.sections}
        relatedProducts={related}
        focalPointBySource={focalPointBySource}
        productInfo={productInfo}
        contactEmail={contactEmail}
      />
    </main>
  );
}
