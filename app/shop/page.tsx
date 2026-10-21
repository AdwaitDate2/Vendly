import BlockRenderer from '@/components/blocks/BlockRenderer';
import { getContentMetadata, getPageBlocks } from '@/lib/content';
import { loadBlockInstagram, loadBlockProducts, loadBlockProposals, loadBlockTestimonials, loadMediaFocalPoints } from '@/lib/page-data';
import { getPublicProducts } from '@/lib/public-catalog';

export async function generateMetadata() {
  return getContentMetadata('shop');
}

export default async function ShopIndexPage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.q || '').trim();
  const category = String(params?.category || '').trim();
  const blocks = await getPageBlocks('shop');
  const [{ products, categories }, featured, instagram, proposals, testimonials] = await Promise.all([getPublicProducts({ query, category }), loadBlockProducts(blocks), loadBlockInstagram(blocks), loadBlockProposals(blocks), loadBlockTestimonials(blocks)]);
  const focalPointBySource = await loadMediaFocalPoints(blocks, featured, products, categories, instagram, proposals, testimonials);

  return (
    <main className="listing-page">
      <BlockRenderer blocks={blocks} products={featured} instagram={instagram} proposals={proposals} testimonials={testimonials} catalog={{ products, categories, category }} focalPointBySource={focalPointBySource} />
    </main>
  );
}
