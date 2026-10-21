import BlockRenderer from '@/components/blocks/BlockRenderer';
import { getContentMetadata, getPageBlocks } from '@/lib/content';
import { loadBlockInstagram, loadBlockProducts, loadBlockProposals, loadBlockTestimonials, loadMediaFocalPoints } from '@/lib/page-data';

export async function generateMetadata() {
  return getContentMetadata('bespoke');
}

export default async function CustomPage() {
  const blocks = await getPageBlocks('bespoke');
  const [products, instagram, proposals, testimonials] = await Promise.all([loadBlockProducts(blocks), loadBlockInstagram(blocks), loadBlockProposals(blocks), loadBlockTestimonials(blocks)]);
  const focalPointBySource = await loadMediaFocalPoints(blocks, products, instagram, proposals, testimonials);
  return (
    <main className="custom-page">
      <BlockRenderer blocks={blocks} products={products} instagram={instagram} proposals={proposals} testimonials={testimonials} focalPointBySource={focalPointBySource} />
    </main>
  );
}
