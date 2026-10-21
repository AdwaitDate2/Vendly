'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOptionalCart } from './CartProvider';
import ProductDetailsAccordion from './ProductDetailsAccordion';
import ProductEnquiry from './ProductEnquiry';
import { Inline } from './RichText';
import { isPurchasable } from '@/lib/product-variants';

const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function ProductPurchaseSection({ product, selectedVariantId = product.selectedVariantId, productInfo, contactEmail, blocks = null, vendorLabel = '', titleOverride = '', descriptionOverride = '' }) {
  const cart = useOptionalCart();
  const options = (product.variants || []).filter((variant) => variant.active !== false);
  const [variantIndex, setVariantIndex] = useState(() => {
    const requestedIndex = options.findIndex((option) => String(option.id) === String(selectedVariantId));
    return requestedIndex >= 0 ? requestedIndex : 0;
  });
  const [size, setSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(() => {
    const configuredQuantity = blocks?.find((block) => block.type === 'quantitySelector')?.count;
    return Math.max(1, Math.min(10, Number(configuredQuantity) || 1));
  });
  const variant = options[variantIndex] || options[0];
  const price = variant?.price ?? product.price;
  const needsSize = product.sizeOption?.enabled;
  const available = isPurchasable(product, variant);

  const handleAddToCart = () => {
    if (needsSize && !size) { setSizeError(true); return; }
    cart?.add?.({
      productId: product.id || product.slug,
      slug: product.slug,
      title: product.title,
      shortTitle: product.shortTitle || product.title,
      image: product.images?.[0] || '',
      variantId: variant?.id || 'default',
      variantTitle: variant?.title || '',
      size: needsSize ? size : '',
      price,
      qty: quantity,
    });
  };

  if (Array.isArray(blocks)) {
    const hasEnquiryBlock = blocks.some((block) => block.type === 'enquiryForm' && block.enabled !== false);
    const renderProductBlock = (block) => {
      if (block.enabled === false) return null;
      switch (block.type) {
        case 'vendor':
          return <span className="eyebrow" key={block.id}>{vendorLabel || block.eyebrow || 'byShreen · Fine Diamond Jewelry'}</span>;
        case 'productTitle':
          return <h1 key={block.id}><Inline text={block.heading || titleOverride || product.title} /></h1>;
        case 'description':
          return <p className="pdp__description" key={block.id}><Inline text={block.body || descriptionOverride || product.description} /></p>;
        case 'price':
          return <div className={`pdp__price${product.saleMode === 'enquire' ? ' pdp__price--enquire' : ''}`} key={block.id}>
            {product.saleMode === 'enquire' ? 'Price on request' : money(price)}
            {product.saleMode !== 'enquire' && variant ? <span className="pdp__karat-tag">{variant.title}</span> : null}
          </div>;
        case 'variantPicker':
          if (product.saleMode === 'enquire' || options.length < 2) return null;
          return <div className="pdp-karat-selector" key={block.id}>
            <div className="pdp-karat-header">
              <span className="pdp-karat-label">{block.label || 'Metal:'} <strong>{variant?.title}</strong></span>
              <span className="pdp-karat-hint">Natural diamonds only</span>
            </div>
            <div className="pdp-karat-options" role="radiogroup" aria-label="Select metal">
              {options.map((option, index) => (
                <button key={option.id} type="button" role="radio" aria-checked={index === variantIndex} className={`pdp-karat-btn ${index === variantIndex ? 'is-active' : ''}`} onClick={() => setVariantIndex(index)}>
                  <span className="pdp-karat-name">{option.title}</span>
                  <span className="pdp-karat-sub">{money(option.price)}</span>
                </button>
              ))}
            </div>
          </div>;
        case 'sizeSelector':
          if (product.saleMode === 'enquire' || !needsSize) return null;
          return <label className={`pdp-size-select${sizeError ? ' has-error' : ''}`} key={block.id}>
            <span>{block.label || product.sizeOption.label || 'Ring size'} (US)</span>
            <select value={size} onChange={(event) => { setSize(event.target.value); setSizeError(false); }}>
              <option value="">Select a size</option>
              {product.sizeOption.values.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            {sizeError ? <small role="alert">Please choose a ring size. Not sure? <Link href="/size-guide">See the size guide</Link> or book an appointment.</small> : null}
          </label>;
        case 'quantitySelector':
          if (product.saleMode === 'enquire') return null;
          return <label className="pdp-quantity-select" key={block.id}>
            <span>{block.label || 'Quantity'}</span>
            <input type="number" min="1" max="10" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} />
          </label>;
        case 'madeToOrder':
          if (product.saleMode === 'enquire') return null;
          return <div className="pdp-made-to-order-badge" key={block.id}>
            <div className="pdp-made-to-order-badge__header"><span className="pdp-made-to-order-badge__dot" /><span className="pdp-made-to-order-badge__title">Made to Order: <strong>5–7 weeks</strong></span></div>
            <p className="pdp-made-to-order-badge__note">{block.body || <>For custom sizing or modifications, <Link href="/book-appointment" className="text-link">book an appointment</Link> or <Link href="/contact" className="text-link">contact us</Link>.</>}</p>
          </div>;
        case 'buyButtons':
          if (product.saleMode === 'enquire') return null;
          return <button key={block.id} type="button" className="button button--full pdp-add-to-bag" onClick={handleAddToCart} disabled={!available}>
            {available ? `${block.label || 'Add to bag'} · ${money(price)}` : 'Currently unavailable'}
          </button>;
        case 'enquiryForm':
          if (product.saleMode !== 'enquire') return null;
          return <ProductEnquiry key={block.id} product={product} />;
        case 'productDetails':
          return <ProductDetailsAccordion key={block.id} product={product} selectedMetal={variant?.title || ''} info={productInfo || {}} email={contactEmail || ''} />;
        case 'share':
          return <button key={block.id} type="button" className="text-link" onClick={() => {
            const shareUrl = window.location.href;
            if (navigator.share) navigator.share({ title: product.title, url: shareUrl }).catch(() => {});
            else navigator.clipboard?.writeText(shareUrl).catch(() => {});
          }}>{block.label || 'Share'}</button>;
        default:
          return null;
      }
    };

    return <div className="pdp-purchase-section">{blocks.map(renderProductBlock)}</div>;
  }

  if (product.saleMode === 'enquire') {
    return (
      <div className="pdp-purchase-section">
        <div className="pdp__price pdp__price--enquire">Price on request</div>
        <ProductEnquiry product={product} />
        <ProductDetailsAccordion product={product} selectedMetal="" info={productInfo} email={contactEmail} />
      </div>
    );
  }

  return (
    <div className="pdp-purchase-section">
      <div className="pdp__price">
        {money(price)}
        {variant ? <span className="pdp__karat-tag">{variant.title}</span> : null}
      </div>

      {options.length > 1 ? (
        <div className="pdp-karat-selector">
          <div className="pdp-karat-header">
            <span className="pdp-karat-label">Metal: <strong>{variant?.title}</strong></span>
            <span className="pdp-karat-hint">Natural diamonds only</span>
          </div>
          <div className="pdp-karat-options" role="radiogroup" aria-label="Select metal">
            {options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={index === variantIndex}
                className={`pdp-karat-btn ${index === variantIndex ? 'is-active' : ''}`}
                onClick={() => setVariantIndex(index)}
              >
                <span className="pdp-karat-name">{option.title}</span>
                <span className="pdp-karat-sub">{money(option.price)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {needsSize ? (
        <label className={`pdp-size-select${sizeError ? ' has-error' : ''}`}>
          <span>{product.sizeOption.label || 'Ring size'} (US)</span>
          <select value={size} onChange={(event) => { setSize(event.target.value); setSizeError(false); }}>
            <option value="">Select a size</option>
            {product.sizeOption.values.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          {sizeError ? <small role="alert">Please choose a ring size. Not sure? <Link href="/size-guide">See the size guide</Link> or book an appointment.</small> : null}
        </label>
      ) : null}

      <div className="pdp-made-to-order-badge">
        <div className="pdp-made-to-order-badge__header">
          <span className="pdp-made-to-order-badge__dot" />
          <span className="pdp-made-to-order-badge__title">Made to Order: <strong>5–7 weeks</strong></span>
        </div>
        <p className="pdp-made-to-order-badge__note">
          For custom sizing or modifications,{' '}
          <Link href="/book-appointment" className="text-link">book an appointment</Link> or{' '}
          <Link href="/contact" className="text-link">contact us</Link>.
        </p>
      </div>

      <button type="button" className="button button--full pdp-add-to-bag" onClick={handleAddToCart} disabled={!available}>
        {available ? `Add to bag · ${money(price)}` : 'Currently unavailable'}
      </button>

      <ProductDetailsAccordion product={product} selectedMetal={variant?.title} info={productInfo} email={contactEmail} />
    </div>
  );
}
