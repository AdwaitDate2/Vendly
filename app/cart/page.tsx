import CartTemplateRenderer from '@/components/blocks/CartTemplateRenderer';
import { getPublicProducts } from '@/lib/public-catalog';
import { getPublishedResourceTemplate } from '@/lib/resource-templates';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your bag — byShreen',
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [template, catalog] = await Promise.all([
    getPublishedResourceTemplate('cart', 'cart'),
    getPublicProducts(),
  ]);
  const focalPointBySource = await loadMediaFocalPoints(template.sections, catalog.products);

  return (
    <main className="cart-template-page">
      <CartTemplateRenderer sections={template.sections} products={catalog.products} focalPointBySource={focalPointBySource} />
    </main>
  );
}
