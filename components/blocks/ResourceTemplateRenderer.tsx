import BlockRenderer from './BlockRenderer';
import CartTemplateRenderer from './CartTemplateRenderer';
import GiftCardPreview from './GiftCardPreview';

/** Shared storefront renderer for resource templates, including the admin preview. */
export default function ResourceTemplateRenderer({
  resourceType,
  resource,
  sections = [],
  relatedProducts = [],
  products = [],
  focalPointBySource = {},
  productInfo = {},
  contactEmail = '',
  preview = false,
}) {
  if (resourceType === 'cart') {
    return <CartTemplateRenderer products={products} sections={sections} focalPointBySource={focalPointBySource} preview={preview} />;
  }

  if (resourceType === 'gift-card') {
    return <GiftCardPreview resource={resource} />;
  }

  return (
    <BlockRenderer
      blocks={sections}
      resourceType={resourceType}
      resource={resource ? { ...resource, previewMode: preview } : resource}
      relatedProducts={relatedProducts}
      products={products}
      focalPointBySource={focalPointBySource}
      productInfo={productInfo}
      contactEmail={contactEmail}
      preview={preview}
    />
  );
}
