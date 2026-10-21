import { notFound } from 'next/navigation';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import { getPublishedCustomPage } from '@/lib/custom-pages';
import { loadBlockInstagram, loadBlockProducts, loadBlockProposals, loadBlockTestimonials, loadMediaFocalPoints } from '@/lib/page-data';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublishedCustomPage(slug);
  if (!page) return {};
  return { title: page.seoTitle || `${page.title} — byShreen`, description: page.seoDescription || undefined };
}

export default async function CustomPage({ params }) {
  const { slug } = await params;
  const page = await getPublishedCustomPage(slug);
  if (!page) notFound();
  const blocks = (page.sections || []).filter((block) => block.type);
  const [products, instagram, proposals, testimonials] = await Promise.all([loadBlockProducts(blocks), loadBlockInstagram(blocks), loadBlockProposals(blocks), loadBlockTestimonials(blocks)]);
  const focalPointBySource = await loadMediaFocalPoints(blocks, products, instagram, proposals, testimonials);
  return (
    <main className="about-page">
      <BlockRenderer blocks={blocks} products={products} instagram={instagram} proposals={proposals} testimonials={testimonials} focalPointBySource={focalPointBySource} />
    </main>
  );
}
