// @ts-nocheck
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Inline, Paragraphs } from '@/components/RichText';
import Reveal from '@/components/Reveal';
import { useOptionalCart } from '@/components/CartProvider';
import { isPurchasable } from '@/lib/product-variants';
import { resolveAssetPath } from '@/lib/asset-paths';

const formatPrice = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

function blockAnchor(block, preview) {
  return preview ? { 'data-block-anchor': block.id } : {};
}

function boundedNumber(value, fallback = 0, maximum = 1200) {
  const numberValue = Number(value);
  return Math.min(maximum, Math.max(0, Number.isFinite(numberValue) ? numberValue : fallback));
}

function paddingStyle(settings = {}) {
  return {
    paddingTop: `${boundedNumber(settings.paddingTop)}px`,
    paddingRight: `${boundedNumber(settings.paddingRight)}px`,
    paddingBottom: `${boundedNumber(settings.paddingBottom)}px`,
    paddingLeft: `${boundedNumber(settings.paddingLeft)}px`,
  };
}

function typographyStyle(preset) {
  const presets = {
    heading: { fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.05 },
    subheading: { fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 400, lineHeight: 1.15 },
    body: { fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 400, lineHeight: 1.4 },
    caption: { fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 400, lineHeight: 1.3, letterSpacing: '.08em', textTransform: 'uppercase' },
  };
  return presets[preset] || presets.body;
}

function textBlockStyle(settings = {}) {
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  const colors = { ink: 'var(--ink)', ivory: 'var(--ivory)', green: 'var(--olive)', mulberry: 'var(--mulberry)' };
  const backgrounds = { ivory: 'var(--ivory)', paper: 'var(--paper)', green: 'var(--olive)', mulberry: 'var(--mulberry)' };
  return {
    display: 'block',
    width: settings.width === 'fit' ? 'fit-content' : '100%',
    maxWidth: boundedNumber(settings.maxWidth) > 0 ? `${boundedNumber(settings.maxWidth)}px` : 'none',
    textAlign: alignment,
    ...typographyStyle(settings.typographyPreset),
    ...(colors[settings.color] ? { color: colors[settings.color] } : {}),
    ...(backgrounds[settings.background] ? { backgroundColor: backgrounds[settings.background] } : {}),
    ...paddingStyle(settings),
  };
}

function mediaStyle(settings = {}) {
  const ratio = settings.aspectRatio || 'auto';
  return {
    aspectRatio: ratio === 'auto' ? 'auto' : ({ portrait: '1 / 1.16', square: '1 / 1', landscape: '4 / 3' }[ratio] || '1 / 1.16'),
    border: settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none',
    borderRadius: `${boundedNumber(settings.cornerRadius, 0, 100)}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...paddingStyle(settings),
  };
}

function safeGroupMediaSource(value) {
  const source = String(value || '').trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(source) ? source : '';
}

function safeGroupHref(value) {
  const href = String(value || '').trim();
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href) ? href : '';
}

function groupStyle(block) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const direction = ['vertical', 'horizontal', 'grid'].includes(settings.direction) ? settings.direction : 'vertical';
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  const position = ['top', 'center', 'bottom', 'space-between'].includes(settings.position) ? settings.position : 'top';
  const scheme = ['ivory', 'paper', 'olive', 'mulberry'].includes(settings.colorScheme) ? settings.colorScheme : 'inherit';
  const gap = boundedNumber(settings.gap, 40, 160);
  const size = (mode, customValue, maximum) => {
    if (mode === 'fit') return 'fit-content';
    return mode === 'custom' ? `${boundedNumber(customValue, 480, maximum)}px` : '100%';
  };
  const width = size(settings.widthMode, settings.widthCustom, 2400);
  const mobileWidth = size(settings.mobileWidthMode, settings.mobileWidthCustom, 1200);
  const height = settings.heightMode === 'custom' ? `${boundedNumber(settings.heightCustom, 100, 2400)}px` : settings.heightMode === 'fill' ? '100%' : 'auto';
  const backgroundMedia = ['image', 'video'].includes(settings.backgroundMedia) ? settings.backgroundMedia : 'none';
  const backgroundImage = backgroundMedia === 'image' ? safeGroupMediaSource(settings.backgroundImage) : '';
  const backgroundVideo = backgroundMedia === 'video' ? safeGroupMediaSource(settings.backgroundVideo) : '';
  const overlayOpacity = boundedNumber(settings.overlayOpacity, 0, 100) / 100;
  return {
    className: [
      'block-group',
      `block-group--${direction}`,
      `block-group--align-${alignment}`,
      `block-group--position-${position}`,
      `block-group--scheme-${scheme}`,
      `block-group--border-${settings.borderStyle === 'solid' ? 'solid' : 'none'}`,
      backgroundVideo ? 'block-group--has-video' : '',
    ].filter(Boolean).join(' '),
    backgroundImage,
    backgroundVideo,
    overlayOpacity,
    style: {
      '--block-group-gap': `${gap}px`,
      '--block-group-width': width,
      '--block-group-mobile-width': mobileWidth,
      '--block-group-height': height,
      '--block-group-radius': `${boundedNumber(settings.cornerRadius, 0, 200)}px`,
      '--block-group-padding-top': `${boundedNumber(settings.paddingTop, 0, 200)}px`,
      '--block-group-padding-right': `${boundedNumber(settings.paddingRight, 0, 200)}px`,
      '--block-group-padding-bottom': `${boundedNumber(settings.paddingBottom, 0, 200)}px`,
      '--block-group-padding-left': `${boundedNumber(settings.paddingLeft, 0, 200)}px`,
      '--block-group-overlay-opacity': overlayOpacity,
      ...(backgroundImage ? { backgroundImage: `url("${backgroundImage.replace(/["\\\n\r]/g, '\\$&')}")` } : {}),
    },
  };
}

function collectionHrefWithVariant(href, variant) {
  if (!variant?.id) return href;
  return `${href}${href.includes('?') ? '&' : '?'}variant=${encodeURIComponent(variant.id)}`;
}

function priceDetails(product, variant, settings = {}) {
  const salePrice = Number(product?.salePrice ?? (Number.isFinite(Number(product?.salePriceCents)) ? Number(product.salePriceCents) / 100 : Number.NaN));
  const compareAtPrice = Number(product?.compareAtPrice ?? (Number.isFinite(Number(product?.compareAtPriceCents)) ? Number(product.compareAtPriceCents) / 100 : Number.NaN));
  const hasSalePrice = Number.isFinite(salePrice) && Number.isFinite(compareAtPrice) && compareAtPrice > salePrice;
  const selectedPrice = variant?.price ?? product?.price;
  const normalPrice = product?.saleMode === 'enquire'
    ? 'Enquire'
    : Number.isFinite(Number(selectedPrice)) ? formatPrice(selectedPrice) : '';
  const currentPrice = hasSalePrice ? formatPrice(salePrice) : normalPrice;
  const comparisonPrice = hasSalePrice ? formatPrice(compareAtPrice) : '';
  return {
    currentPrice,
    comparisonPrice,
    saleFirst: settings.showSaleFirst !== false,
    installmentInformation: settings.showInstallmentPrice
      ? product?.installmentText || (Number.isFinite(Number(product?.installmentPrice)) ? `From ${formatPrice(product.installmentPrice)} per installment` : '')
      : '',
    taxInformation: settings.showTaxInformation ? product?.taxInformation || product?.taxText || '' : '',
  };
}

function FeaturedCollectionProductCard({ block, product, collectionHref = '/shop', preview = false, index = 0, style = {} }) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const cart = useOptionalCart();
  const variants = (Array.isArray(product?.variants) ? product.variants : []).filter((variant) => variant.active !== false);
  const selectedVariant = variants.find((variant) => String(variant.id) === String(selectedVariantId)) || null;
  const defaultVariant = variants[0] || null;
  const productTitle = product?.shortTitle || product?.title || '';
  const productHref = `/shop/${product.slug}`;
  const children = Array.isArray(block.blocks) ? block.blocks : [];

  const renderNode = (child, childIndex = 0) => {
    if (!child || child.enabled === false) return null;
    const anchorProps = blockAnchor(child, preview);
    const settings = child.settings && typeof child.settings === 'object' && !Array.isArray(child.settings) ? child.settings : {};
    const childNodes = Array.isArray(child.blocks) ? child.blocks.map(renderNode) : [];

    if (child.type === 'featuredCollectionGroup') {
      const group = groupStyle(child);
      const groupHref = preview ? '' : safeGroupHref(settings.link);
      const openInNewTab = Boolean(settings.openInNewTab && groupHref);
      const className = `${group.className} product-card__meta${groupHref ? ' block-group--linked' : ''}`;
      return <div key={child.id || `${block.id}-group-${childIndex}`} className={className} style={group.style} {...anchorProps}>
        {group.backgroundVideo ? <video className="block-group__background-video" src={group.backgroundVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /> : null}
        {group.overlayOpacity > 0 && (group.backgroundImage || group.backgroundVideo) ? <span className="block-group__overlay" aria-hidden="true" /> : null}
        {groupHref ? <a className="block-group__link" href={groupHref} aria-label="Open grouped content" {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} /> : null}
        <div className="block-group__content">{childNodes}</div>
      </div>;
    }
    if (child.type === 'featuredCollectionHeading') {
      return child.heading ? <h3 key={child.id || childIndex} className="featured-collection__card-heading" {...anchorProps}><Inline text={child.heading} /></h3> : null;
    }
    if (child.type === 'featuredCollectionImage') {
      if (!child.image) return null;
      return <div key={child.id || childIndex} className="featured-collection__custom-image" {...anchorProps}><Image src={resolveAssetPath(child.image)} alt={child.imageAlt || ''} fill sizes="(max-width: 700px) 100vw, 25vw" style={child.imagePosition ? { objectPosition: child.imagePosition } : { objectFit: 'cover' }} /></div>;
    }
    if (child.type === 'featuredCollectionText') {
      return child.body ? <div key={child.id || childIndex} className="featured-collection__card-text" {...anchorProps}><Paragraphs text={child.body} /></div> : null;
    }
    if (child.type === 'featuredCollectionMedia') {
      const variantImages = Array.isArray(selectedVariant?.images)
        ? selectedVariant.images.filter((image) => typeof image === 'string' && image)
        : selectedVariant?.image ? [selectedVariant.image] : [];
      const images = variantImages.length ? variantImages : Array.isArray(product?.images) ? product.images : [];
      const primaryImage = images[0];
      if (!primaryImage) return null;
      const ratio = settings.aspectRatio || 'auto';
      const useNaturalImageRatio = ratio === 'auto';
      const variantImagePositions = Array.isArray(selectedVariant?.imagePositions)
        ? selectedVariant.imagePositions
        : selectedVariant?.imagePosition ? [selectedVariant.imagePosition] : [];
      const imagePositions = variantImages.length
        ? variantImagePositions
        : Array.isArray(product.imagePositions) ? product.imagePositions : [];
      return <Link key={child.id || childIndex} className={`product-card__image featured-collection__media${useNaturalImageRatio ? ' featured-collection__media--auto' : ''}`} href={collectionHrefWithVariant(productHref, selectedVariant)} style={mediaStyle(settings)} {...anchorProps}>
        {useNaturalImageRatio
          ? <Image className="product-card__image-primary" src={primaryImage} alt={productTitle} width={1} height={1} unoptimized style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', aspectRatio: 'auto', objectFit: 'cover', objectPosition: imagePositions[0] || 'center center' }} />
          : <Image className="product-card__image-primary" src={primaryImage} alt={productTitle} fill sizes="(max-width: 700px) 100vw, 25vw" style={{ objectPosition: imagePositions[0] || 'center center' }} />}
        {settings.showSecondaryImage !== false && images[1] ? <Image className="product-card__image-hover" src={images[1]} alt={`${productTitle} alternate view`} fill sizes="(max-width: 700px) 100vw, 25vw" style={{ objectPosition: imagePositions[1] || 'center center' }} /> : null}
        {settings.showViewLink !== false ? <span>View piece</span> : null}
      </Link>;
    }
    if (child.type === 'featuredCollectionProductTitle') {
      return productTitle ? <div key={child.id || childIndex} className="featured-collection__product-title" style={textBlockStyle(settings)} {...anchorProps}><p style={typographyStyle(settings.typographyPreset)}>{productTitle}</p></div> : null;
    }
    if (child.type === 'featuredCollectionPrice') {
      const price = priceDetails(product, selectedVariant, settings);
      if (!price.currentPrice) return null;
      const currentPriceElement = <strong style={typographyStyle(settings.typographyPreset)}>{price.currentPrice}</strong>;
      const comparisonPriceElement = price.comparisonPrice ? <s>{price.comparisonPrice}</s> : null;
      return <div key={child.id || childIndex} className="featured-collection__price-block" style={{ ...textBlockStyle(settings), display: 'flex' }} {...anchorProps}>
        {price.saleFirst ? <>{currentPriceElement}{comparisonPriceElement}</> : <>{comparisonPriceElement}{currentPriceElement}</>}
        {price.installmentInformation ? <small>{price.installmentInformation}</small> : null}
        {price.taxInformation ? <small>{price.taxInformation}</small> : null}
      </div>;
    }
    if (child.type === 'featuredCollectionSwatches') {
      if (!variants.length) return null;
      const alignment = { left: 'flex-start', center: 'center', right: 'flex-end' };
      const swatchStyle = {
        '--featured-swatch-desktop-alignment': alignment[settings.desktopAlignment] || 'flex-start',
        '--featured-swatch-mobile-alignment': alignment[settings.mobileAlignment] || 'flex-start',
        ...paddingStyle(settings),
      };
      return <div key={child.id || childIndex} className="featured-collection__swatches" style={swatchStyle} role="group" aria-label="Available product options" {...anchorProps}>
        {variants.map((variant) => <button className={`featured-collection__swatch${selectedVariant?.id === variant.id ? ' is-selected' : ''}`} type="button" aria-pressed={selectedVariant?.id === variant.id} onClick={() => setSelectedVariantId(String(variant.id))} key={variant.id || variant.title}>{variant.title}</button>)}
      </div>;
    }
    if (child.type === 'featuredCollectionSku') {
      const skuVariant = selectedVariant || defaultVariant;
      if (!skuVariant?.sku) return null;
      return <span key={child.id || childIndex} className="featured-collection__sku" style={{ ...textBlockStyle(settings), display: 'block', fontFamily: 'var(--mono)' }} {...anchorProps}>{settings.showLabel === false ? skuVariant.sku : `SKU: ${skuVariant.sku}`}</span>;
    }
    if (child.type === 'featuredCollectionBuyButtons') {
      const chosenVariant = selectedVariant || (variants.length === 1 ? defaultVariant : null);
      const needsSize = Boolean(product.sizeOption?.enabled);
      const needsProductOptions = variants.length > 1 && !selectedVariant;
      const configuredLabel = child.linkLabel || 'Add to bag';
      const linkLabel = product.saleMode === 'enquire'
        ? configuredLabel === 'Add to bag' ? 'View piece' : configuredLabel
        : needsSize || needsProductOptions
          ? configuredLabel === 'Add to bag' ? 'Choose options' : configuredLabel
          : configuredLabel;
      const needsProductPage = product.saleMode === 'enquire' || needsSize || needsProductOptions || !chosenVariant;
      if (needsProductPage) return <Link key={child.id || childIndex} className="button button--full featured-collection__buy-button" href={collectionHrefWithVariant(productHref, selectedVariant)} {...anchorProps}>{linkLabel}</Link>;
      const purchasable = isPurchasable(product, chosenVariant);
      return <button key={child.id || childIndex} type="button" className="button button--full featured-collection__buy-button" disabled={!purchasable} onClick={() => {
        if (!purchasable) return;
        cart?.add?.({
          productId: product.id || product.slug,
          slug: product.slug,
          title: product.title,
          shortTitle: product.shortTitle || product.title,
          image: product.images?.[0] || '',
          variantId: chosenVariant.id || 'default',
          variantTitle: chosenVariant.title || '',
          size: '',
          price: chosenVariant.price ?? product.price,
          qty: 1,
        });
      }} {...anchorProps}>{purchasable ? `${configuredLabel} · ${formatPrice(chosenVariant.price ?? product.price)}` : 'Currently unavailable'}</button>;
    }
    if (child.type === 'featuredCollectionDivider') return <hr key={child.id || childIndex} className="featured-collection__divider" aria-hidden="true" {...anchorProps} />;
    if (child.type === 'featuredCollectionSpacer') return <div key={child.id || childIndex} className="featured-collection__spacer" style={{ height: `${boundedNumber(child.spacerHeight, 24, 240)}px` }} aria-hidden="true" {...anchorProps} />;
    if (child.type === 'featuredCollectionButton') {
      const href = String(child.linkHref || '/shop').trim();
      const safeHref = /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : '/shop';
      return child.linkLabel ? <Link key={child.id || childIndex} className="button" href={safeHref} {...anchorProps}>{child.linkLabel}</Link> : null;
    }
    if (child.type === 'featuredCollectionViewAll') return <Link key={child.id || childIndex} className="text-link" href={collectionHref} {...anchorProps}>{child.linkLabel || 'View all'}</Link>;
    return null;
  };

  return <Reveal as="article" className="product-card featured-collection__product-card" style={style} delay={Math.min(index, 6) * 70} {...blockAnchor(block, preview)}>{children.map(renderNode)}</Reveal>;
}

export default FeaturedCollectionProductCard;
