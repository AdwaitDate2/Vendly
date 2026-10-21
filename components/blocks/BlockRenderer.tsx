// @ts-nocheck
import Image, { getImageProps } from 'next/image';
import { cloneElement } from 'react';
import Link from 'next/link';
import BotanicalLogoAnimation from '@/components/BotanicalLogoAnimation';
import AppointmentScheduler from '@/components/AppointmentScheduler';
import InquiryForm from '@/components/InquiryForm';
import InstagramFeed from '@/components/InstagramFeed';
import NewsletterForm from '@/components/NewsletterForm';
import StorefrontPasswordUnlock from '@/components/StorefrontPasswordUnlock';
import LotusMark from '@/components/LotusMark';
import ProcessVideoCard from '@/components/ProcessVideoCard';
import ProductCard from '@/components/ProductCard';
import ProductPurchaseSection from '@/components/ProductPurchaseSection';
import FeaturedCollectionProductCard from '@/components/blocks/FeaturedCollectionProductCard';
import BlogPostCollection from '@/components/blocks/BlogPostCollection';
import ComparisonSlider from '@/components/blocks/ComparisonSlider';
import HeroMediaVideo from '@/components/blocks/HeroMediaVideo';
import ProposalsGallery from '@/components/ProposalsGallery';
import Reveal from '@/components/Reveal';
import RevealLink from '@/components/RevealLink';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { Inline, JoinedParagraphs, Paragraphs } from '@/components/RichText';
import RichTextContent, { RichTextInlineContent } from '@/components/RichTextContent';
import { clientStories } from '@/data/client-stories';
import { resolveAssetPath } from '@/lib/asset-paths';
import { applyMediaFocalPoints, normalizeMediaFocalPoint } from '@/lib/media-focal-points';
import { BLOCK_TYPES, DARK_TONES, FEATURED_COLLECTION_DEFAULT_BLOCKS, FIELD_DEFS, HERO_CONTENT_BLOCK_SCHEMA_VERSION, PRODUCT_INFORMATION_DEFAULT_BLOCKS, SEARCH_HEADER_DEFAULT_BLOCKS, SEARCH_RESULTS_DEFAULT_BLOCKS, getHeroMediaConfiguration, getHeroSectionDefaults } from '@/lib/blocks';
import { customHtmlScope, sanitizeCustomHtml, scopeCustomCss } from '@/lib/custom-html';
import { compileSectionCss, sectionCssScope } from '@/lib/section-css';
import { customLiquidScope, renderCustomLiquid } from '@/lib/custom-liquid';
import { DEFAULT_THEME, getThemeColorScheme } from '@/lib/theme';
import { resolveColorSchemeSelection } from '@/lib/header-settings';
import { docToText, sanitizeRichDoc } from '@/lib/rich-text';

const asset = (src) => (src ? resolveAssetPath(src) : '');
const focus = (position) => (position ? { objectPosition: position } : undefined);
const cols = (items, fallback) => ({ '--cols': items?.length || fallback });

function schemeCssColor(number, groupKey, roleKey) {
  const scheme = getThemeColorScheme(DEFAULT_THEME, number);
  const cssGroup = groupKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  const cssRole = roleKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `var(--color-scheme-${number}-${cssGroup}-${cssRole}, ${scheme[groupKey][roleKey]})`;
}

function sectionSchemeStyle(number, prefix = 'section-scheme') {
  return {
    [`--${prefix}-background`]: schemeCssColor(number, 'base', 'background'),
    [`--${prefix}-headings`]: schemeCssColor(number, 'base', 'headings'),
    [`--${prefix}-text`]: schemeCssColor(number, 'base', 'text'),
    [`--${prefix}-links`]: schemeCssColor(number, 'base', 'links'),
    [`--${prefix}-hover-links`]: schemeCssColor(number, 'base', 'hoverLinks'),
    [`--${prefix}-borders`]: schemeCssColor(number, 'base', 'borders'),
    [`--${prefix}-shadow`]: schemeCssColor(number, 'base', 'shadow'),
    [`--${prefix}-primary-button-background`]: schemeCssColor(number, 'primaryButton', 'background'),
    [`--${prefix}-primary-button-text`]: schemeCssColor(number, 'primaryButton', 'text'),
    [`--${prefix}-primary-button-borders`]: schemeCssColor(number, 'primaryButton', 'borders'),
    [`--${prefix}-primary-button-hover-background`]: schemeCssColor(number, 'primaryButton', 'hoverBackground'),
    [`--${prefix}-primary-button-hover-text`]: schemeCssColor(number, 'primaryButton', 'hoverText'),
    [`--${prefix}-primary-button-hover-borders`]: schemeCssColor(number, 'primaryButton', 'hoverBorders'),
    [`--${prefix}-secondary-button-background`]: schemeCssColor(number, 'secondaryButton', 'background'),
    [`--${prefix}-secondary-button-text`]: schemeCssColor(number, 'secondaryButton', 'text'),
    [`--${prefix}-secondary-button-borders`]: schemeCssColor(number, 'secondaryButton', 'borders'),
    [`--${prefix}-secondary-button-hover-background`]: schemeCssColor(number, 'secondaryButton', 'hoverBackground'),
    [`--${prefix}-secondary-button-hover-text`]: schemeCssColor(number, 'secondaryButton', 'hoverText'),
    [`--${prefix}-secondary-button-hover-borders`]: schemeCssColor(number, 'secondaryButton', 'hoverBorders'),
    [`--${prefix}-inputs-background`]: schemeCssColor(number, 'inputs', 'background'),
    [`--${prefix}-inputs-text`]: schemeCssColor(number, 'inputs', 'text'),
    [`--${prefix}-inputs-borders`]: schemeCssColor(number, 'inputs', 'borders'),
    [`--${prefix}-inputs-hover-background`]: schemeCssColor(number, 'inputs', 'hoverBackground'),
    [`--${prefix}-variants-background`]: schemeCssColor(number, 'variants', 'background'),
    [`--${prefix}-variants-text`]: schemeCssColor(number, 'variants', 'text'),
    [`--${prefix}-variants-borders`]: schemeCssColor(number, 'variants', 'borders'),
    [`--${prefix}-variants-hover-background`]: schemeCssColor(number, 'variants', 'hoverBackground'),
    [`--${prefix}-selected-variants-background`]: schemeCssColor(number, 'selectedVariants', 'background'),
    [`--${prefix}-selected-variants-text`]: schemeCssColor(number, 'selectedVariants', 'text'),
    [`--${prefix}-selected-variants-borders`]: schemeCssColor(number, 'selectedVariants', 'borders'),
  };
}

// Returns override classes only when the chosen color differs from the block's designed default.
function toneClass(tone, designDefault) {
  if (!tone || tone === designDefault) return '';
  return ` block-tone block-tone--${tone} ${DARK_TONES.has(tone) ? 'block-tone--dark' : 'block-tone--light'}`;
}

// Phones get their own crop when a phone version is uploaded (see "Phone image" in the admin).
const MOBILE_QUERY = '(max-width: 700px)';

/** A full-bleed <picture> that swaps to `mobile` on phone-sized screens. */
function ArtDirectedImage({ desktop, mobile, alt, sizes, priority, className, style, mobileStyle }) {
  const common = { alt, fill: true, sizes, priority };
  const { props: { srcSet: mobileSrcSet } } = getImageProps({ ...common, src: asset(mobile) });
  const { props: rest } = getImageProps({ ...common, src: asset(desktop) });
  return (
    <picture>
      <source media={MOBILE_QUERY} srcSet={mobileSrcSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through from the block */}
      <img {...rest} src={rest.src} className={`${className}${mobileStyle ? ' has-mobile-focus' : ''}`} style={{ ...rest.style, ...style, ...(mobileStyle ? { '--mobile-focus': mobileStyle.objectPosition } : {}) }} />
    </picture>
  );
}

function HeroMediaVisual({ media, imageClassName, videoClassName, posterClassName, priority = false, pageHero = false }) {
  const imageStyle = focus(media.imagePosition);
  const mobileImage = media.showDifferentOnMobile ? media.mobileImage : '';
  const mobileImageStyle = media.showDifferentOnMobile ? focus(media.mobileImagePosition || media.imagePosition) : undefined;
  const posterStyle = focus(media.imagePosition || media.posterPosition);
  const mobilePosterStyle = focus(media.mobileImagePosition || media.imagePosition || media.mobilePosterPosition || media.posterPosition);
  const mobileVideo = media.showDifferentOnMobile ? media.mobileVideo : '';
  const mobilePoster = media.showDifferentOnMobile ? media.mobilePoster : '';
  const videoStyle = pageHero ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...imageStyle } : imageStyle;

  if (media.type === 'image') {
    if (!media.image) {
      if (!mobileImage) return null;
      return <Image className={`${imageClassName} hero-mobile-only`} src={asset(mobileImage)} alt={media.imageAlt || ''} fill priority={priority} sizes="100vw" style={mobileImageStyle} />;
    }
    if (mobileImage) {
      return <ArtDirectedImage className={imageClassName} desktop={media.image} mobile={mobileImage} alt={media.imageAlt || ''} sizes="100vw" priority={priority} style={imageStyle} mobileStyle={mobileImageStyle} />;
    }
    return <Image className={imageClassName} src={asset(media.image)} alt={media.imageAlt || ''} fill priority={priority} sizes="100vw" style={imageStyle} />;
  }

  if (media.video || mobileVideo) {
    return <HeroMediaVideo
      className={`${videoClassName}${!media.video && mobileVideo ? ' hero-video-mobile-only' : ''}`}
      src={asset(media.video)}
      mobileSrc={asset(mobileVideo)}
      poster={asset(media.poster)}
      mobilePoster={asset(mobilePoster)}
      showDifferentOnMobile={media.showDifferentOnMobile}
      posterClassName={posterClassName}
      videoStyle={videoStyle}
      imageStyle={posterStyle}
      mobileImageStyle={mobilePosterStyle}
      priority={priority}
    />;
  }

  const fallbackImage = media.poster || mobilePoster;
  if (!fallbackImage) return null;
  if (mobilePoster && fallbackImage === media.poster) {
    return <ArtDirectedImage className={imageClassName} desktop={media.poster} mobile={mobilePoster} alt="" sizes="100vw" priority={priority} style={posterStyle} mobileStyle={mobilePosterStyle} />;
  }
  if (!media.poster && mobilePoster) {
    return <Image className={`${imageClassName} hero-mobile-only`} src={asset(mobilePoster)} alt="" fill priority={priority} sizes="100vw" style={mobilePosterStyle} />;
  }
  return <Image className={imageClassName} src={asset(fallbackImage)} alt="" fill priority={priority} sizes="100vw" style={posterStyle} />;
}

function heroMediaHasDesktopAsset(media) {
  if (!media) return false;
  return media.type === 'image'
    ? Boolean(media.image)
    : Boolean(media.video || media.poster);
}

function heroMediaHasMobileAsset(media) {
  if (!media) return false;
  if (!media.showDifferentOnMobile) return heroMediaHasDesktopAsset(media);
  return media.type === 'image'
    ? Boolean(media.mobileImage || media.image)
    : Boolean(media.mobileVideo || media.mobilePoster || media.video || media.poster);
}

function HeroMediaLayers({ media, imageClassName, videoClassName, posterClassName, priority = false, pageHero = false }) {
  const firstSlot = media;
  const secondSlot = { ...media.media2, showDifferentOnMobile: media.showDifferentOnMobile };
  const slotConfigurations = [firstSlot, secondSlot].map((slot, index) => ({
    slot,
    key: index === 0 ? 'media-1' : 'media-2',
    hasDesktopAsset: heroMediaHasDesktopAsset(slot),
    hasMobileAsset: heroMediaHasMobileAsset(slot),
  }));
  const activeSlots = slotConfigurations.filter(({ hasDesktopAsset, hasMobileAsset }) => hasDesktopAsset || hasMobileAsset);
  const desktopVisibleSlotCount = slotConfigurations.filter(({ hasDesktopAsset }) => hasDesktopAsset).length;
  const mobileVisibleSlotCount = slotConfigurations.filter(({ hasMobileAsset }) => hasMobileAsset).length;

  if (activeSlots.length === 0) return null;
  if (activeSlots.length === 1) {
    const [{ slot, hasDesktopAsset, hasMobileAsset }] = activeSlots;
    return <div className={`hero-media-single${hasDesktopAsset ? '' : ' hero-media-single--desktop-hidden'}${hasMobileAsset ? '' : ' hero-media-single--mobile-hidden'}`}>
      <HeroMediaVisual media={slot} imageClassName={imageClassName} videoClassName={videoClassName} posterClassName={posterClassName} priority={priority} pageHero={pageHero} />
    </div>;
  }

  const pairLayoutClasses = [
    'hero-media-pair',
    pageHero ? 'hero-media-pair--page' : '',
    desktopVisibleSlotCount === 1 ? 'hero-media-pair--one-desktop' : '',
    mobileVisibleSlotCount === 1 ? 'hero-media-pair--one-mobile' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={pairLayoutClasses}>
      {activeSlots.map(({ slot, key, hasDesktopAsset, hasMobileAsset }) => <div key={key} className={`hero-media-pair__slot${hasDesktopAsset ? '' : ' hero-media-pair__slot--desktop-hidden'}${hasMobileAsset ? '' : ' hero-media-pair__slot--mobile-hidden'}`}>
        <HeroMediaVisual media={slot} imageClassName={imageClassName} videoClassName={videoClassName} posterClassName={posterClassName} priority={priority} pageHero={pageHero} />
      </div>)}
    </div>
  );
}

function heroContentSchemaIsCurrent(block) {
  return Number(block?.settings?.heroContentSchemaVersion) >= HERO_CONTENT_BLOCK_SCHEMA_VERSION;
}

function heroResourceUrl(resource, resourceType) {
  const handle = resource?.handle;
  if (resourceType === 'product' && handle) return `/shop/${handle}`;
  if (resourceType === 'collection' && handle) return `/collections/${handle}`;
  if (resourceType === 'collection-list') return '/collections';
  if (resourceType === 'blog' && handle) return `/blogs/${handle}`;
  if (resourceType === 'blog-post' && handle) {
    const articleHandle = resource.article?.handle;
    return articleHandle ? `/blogs/${handle}/${articleHandle}` : `/blogs/${handle}`;
  }
  if (resourceType === 'search') return '/search';
  if (resourceType === 'cart') return '/cart';
  if (resourceType === '404') return '/404';
  if (resourceType === 'password') return '/password';
  if (resourceType === 'gift-card' && handle) return `/gift-cards/${handle}`;
  return '/';
}

function resolveHeroDynamicValue(source, resource, resourceType) {
  if (!resource || typeof source !== 'string') return null;
  if (source === 'product.title' && resourceType === 'product') return resource.title || null;
  if (source === 'product.description' && resourceType === 'product') return resource.description || null;
  if (source === 'product.url' && resourceType === 'product') return resource.handle ? heroResourceUrl(resource, resourceType) : null;
  if (source === 'product.featured_image' && resourceType === 'product') {
    const image = resource.featuredImage || resource.featured_image || resource.images?.[0];
    return typeof image === 'string' ? image : image?.url || image?.src || null;
  }
  if (source === 'collection.title' && resourceType === 'collection') return resource.title || resource.name || null;
  if (source === 'collection.description' && resourceType === 'collection') return resource.description || resource.note || null;
  if (source === 'collection.url' && resourceType === 'collection') return resource.handle ? heroResourceUrl(resource, resourceType) : null;
  if (source === 'collection.image' && resourceType === 'collection') {
    const image = resource.image;
    return typeof image === 'string' ? image : image?.url || image?.src || null;
  }
  return null;
}

function setConfiguredBlockField(block, field, value) {
  if (!field.includes('.')) return { ...block, [field]: value };
  const [group, property, ...remainingPath] = field.split('.');
  if (group !== 'cta' || !property || remainingPath.length) return block;
  const cta = block.cta && typeof block.cta === 'object' && !Array.isArray(block.cta) ? block.cta : {};
  return { ...block, cta: { ...cta, [property]: value } };
}

function blockWithResolvedDynamicFields(block, resource, resourceType) {
  const settings = block?.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const dynamicSources = settings.dynamicSources && typeof settings.dynamicSources === 'object' && !Array.isArray(settings.dynamicSources) ? settings.dynamicSources : {};
  const configuredFields = BLOCK_TYPES[block.type]?.fields || [];
  return configuredFields.reduce((resolvedBlock, field) => {
    const fieldKind = FIELD_DEFS[field]?.kind;
    const expectedSourceKind = fieldKind === 'text' || fieldKind === 'textarea' ? 'text' : fieldKind;
    if (!['text', 'link', 'image'].includes(expectedSourceKind)) return resolvedBlock;
    const source = dynamicSources[field];
    if (typeof source !== 'string' || !source) return resolvedBlock;
    const sourceKind = source.endsWith('.url') ? 'link'
      : source === 'product.featured_image' || source === 'collection.image' ? 'image'
        : ['product.title', 'product.description', 'collection.title', 'collection.description'].includes(source) ? 'text'
          : '';
    const value = sourceKind === expectedSourceKind ? resolveHeroDynamicValue(source, resource, resourceType) : null;
    return setConfiguredBlockField(resolvedBlock, field, typeof value === 'string' ? value : '');
  }, block);
}

function blockSupportsResourceFieldSources(block, resourceType) {
  return ['product', 'collection'].includes(resourceType)
    && !block?.static
    && !['heroEyebrow', 'heroHeading', 'heroText', 'heroButton', 'heroVideo', 'heroImage'].includes(block?.type)
    && !block?.type?.startsWith('collectionList')
    && !block?.type?.startsWith('featuredCollection')
    && !block?.type?.startsWith('productInformation');
}

function heroDynamicSource(block, field) {
  const settings = block?.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const sources = settings.dynamicSources && typeof settings.dynamicSources === 'object' && !Array.isArray(settings.dynamicSources) ? settings.dynamicSources : {};
  return typeof sources[field] === 'string' ? sources[field] : '';
}

function hasHeroDynamicConnection(block, field) {
  return Boolean(heroDynamicSource(block, field));
}

function blockWithDynamicText(block, field, resource, resourceType) {
  if (!hasHeroDynamicConnection(block, field)) return block;
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const dynamicValue = resolveHeroDynamicValue(heroDynamicSource(block, field), resource, resourceType);
  const resolvedText = typeof dynamicValue === 'string' ? dynamicValue : '';
  return { ...block, [field]: resolvedText, settings: { ...settings, contentRichText: '' } };
}

function heroPresentation(block, resource, resourceType) {
  const savedSettings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const defaults = getHeroSectionDefaults(block.type);
  const merged = { ...defaults, ...savedSettings };
  // Migrate legacy "original" sentinels that Shopify never exposed
  if (merged.position === 'original') merged.position = 'center';
  if (merged.width === 'original') merged.width = 'page';
  if (merged.overlayStyle === 'original') merged.overlayStyle = 'solid';
  if (merged.paddingPreset === 'original') merged.paddingPreset = 'custom';
  const settings = merged;
  const schemeSelection = resolveColorSchemeSelection(settings.colorScheme, 'scheme5');
  const usesOriginalPadding = false;
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  const direction = settings.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const position = ['top', 'center', 'bottom', 'space-between'].includes(settings.position) ? settings.position : block.type === 'heroImage' ? 'bottom' : 'center';
  const contentGap = Math.max(0, Math.min(160, Number(settings.gap) || 0));
  const height = { small: '40svh', medium: '60svh', large: '80svh', 'full-screen': '100svh' }[settings.height]
    || (settings.height === 'custom' ? `${Math.max(100, Math.min(1600, Number(settings.customHeight) || 600))}px` : undefined);
  const opacity = Math.max(0, Math.min(100, Number(settings.overlayOpacity ?? 35))) / 100;
  const overlayColor = /^#[\da-f]{6}$/i.test(settings.overlayColor || '') ? settings.overlayColor : '#000000';
  const [red, green, blue] = overlayColor.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16));
  const overlayRgb = `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  const sourceConnectedValue = (field, fallback) => {
    if (!hasHeroDynamicConnection(block, field)) return fallback;
    const resolvedValue = resolveHeroDynamicValue(heroDynamicSource(block, field), resource, resourceType);
    return typeof resolvedValue === 'string' ? resolvedValue : '';
  };
  const media = getHeroMediaConfiguration(block);
  const media2 = media.media2;
  const isImageMedia1 = media.type === 'image';
  const isImageMedia2 = media2.type === 'image';
  const resolvedMedia = {
    ...media,
    image: isImageMedia1 ? sourceConnectedValue('media1Image', media.image) : media.image,
    mobileImage: isImageMedia1 && media.showDifferentOnMobile ? sourceConnectedValue('media1MobileImage', media.mobileImage) : media.mobileImage,
    poster: !isImageMedia1 ? sourceConnectedValue('media1Poster', media.poster) : media.poster,
    mobilePoster: !isImageMedia1 && media.showDifferentOnMobile ? sourceConnectedValue('media1MobilePoster', media.mobilePoster) : media.mobilePoster,
    media2: {
      ...media2,
      image: isImageMedia2 ? sourceConnectedValue('media2Image', media2.image) : media2.image,
      mobileImage: isImageMedia2 && media.showDifferentOnMobile ? sourceConnectedValue('media2MobileImage', media2.mobileImage) : media2.mobileImage,
      poster: !isImageMedia2 ? sourceConnectedValue('media2Poster', media2.poster) : media2.poster,
      mobilePoster: !isImageMedia2 && media.showDifferentOnMobile ? sourceConnectedValue('media2MobilePoster', media2.mobilePoster) : media2.mobilePoster,
    },
  };
  const headingBlock = block.blocks?.find((childBlock) => childBlock.type === 'heroHeading');
  const headingIsConnected = headingBlock ? hasHeroDynamicConnection(headingBlock, 'heading') : false;
  const dynamicHeading = headingIsConnected
    ? resolveHeroDynamicValue(heroDynamicSource(headingBlock, 'heading'), resource, resourceType)
    : null;
  return {
    settings,
    media: resolvedMedia,
    sectionLink: block.dynamicSource === 'resource.url' ? heroResourceUrl(resource, resourceType) : settings.sectionLink,
    alignment,
    usesColorScheme: schemeSelection.number !== null,
    sectionStyle: {
      minHeight: height,
      paddingTop: usesOriginalPadding ? undefined : `${Math.max(0, Math.min(240, Number(settings.paddingTop) || 0))}px`,
      paddingBottom: usesOriginalPadding ? undefined : `${Math.max(0, Math.min(240, Number(settings.paddingBottom) || 0))}px`,
      flexDirection: direction === 'horizontal' ? 'row' : 'column',
      alignItems: direction === 'horizontal' ? ({ top: 'flex-start', center: 'center', bottom: 'flex-end' }[position] || 'space-between') : ({ left: 'flex-start', center: 'center', right: 'flex-end' }[alignment]),
      justifyContent: direction === 'horizontal' ? ({ left: 'flex-start', center: 'center', right: 'flex-end' }[alignment]) : undefined,
      '--hero-vertical-position': settings.position === 'original' ? undefined : ({ top: 'flex-start', center: 'center', bottom: 'flex-end', 'space-between': 'space-between' }[position]),
      textAlign: alignment,
      gap: `${contentGap}px`,
      '--hero-content-width': settings.width === 'original' ? undefined : settings.width === 'full' ? '100%' : 'min(1200px, 100%)',
      '--hero-content-max-width': settings.width === 'original' ? undefined : settings.width === 'full' ? '100%' : 'min(1200px, 100%)',
      '--hero-content-direction': direction === 'horizontal' ? 'row' : 'column',
      '--hero-content-gap': `${contentGap}px`,
      ...(schemeSelection.number ? sectionSchemeStyle(schemeSelection.number, 'hero-scheme') : {}),
    },
    washStyle: settings.overlayEnabled
      ? settings.overlayStyle === 'original' ? undefined : { background: settings.overlayStyle === 'gradient' ? `linear-gradient(${settings.overlayDirection === 'up' ? 'to top' : 'to bottom'}, ${overlayRgb}, transparent)` : overlayRgb }
      : { background: 'transparent' },
    title: headingIsConnected ? (dynamicHeading || 'section') : headingBlock?.heading || block.heading || 'section',
  };
}

function HeroSectionLink({ settings, sectionLink, title }) {
  if (!sectionLink) return null;
  return <Link className="hero-section-link" href={sectionLink} target={settings.sectionLinkNewTab ? '_blank' : undefined} rel={settings.sectionLinkNewTab ? 'noopener noreferrer' : undefined} aria-label={`Open ${title}`} />;
}

function heroContentTextDocument(block) {
  const serializedDocument = block.settings?.contentRichText;
  if (typeof serializedDocument === 'string') {
    try {
      return sanitizeRichDoc(JSON.parse(serializedDocument));
    } catch {
      // Fall back to the existing plain text if saved formatting is malformed.
    }
  }
  const contentField = block.type === 'heroEyebrow' ? 'eyebrow' : 'body';
  const text = block[contentField] || '';
  return { type: 'doc', content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) }] };
}

function heroContentTextStyle(block) {
  const settings = block.settings || {};
  const width = settings.width === 'fill' ? '100%' : settings.width === 'fit' ? 'fit-content' : undefined;
  const maxWidth = { narrow: 'min(28rem, 100%)', normal: 'min(44rem, 100%)', none: '100%' }[settings.maxWidth];
  const defaultTypography = 'default';
  const typographyPreset = settings.typographyPreset || defaultTypography;
  const fontSizes = {
    paragraph: '18px',
    heading1: 'clamp(36px, 5vw, 64px)',
    heading2: 'clamp(32px, 4vw, 52px)',
    heading3: 'clamp(28px, 3.5vw, 42px)',
    heading4: '24px',
    heading5: '20px',
    heading6: '18px',
    caption: '10px',
    custom: `${Math.max(10, Math.min(96, Number(settings.customFontSize) || 16))}px`,
  };
  const lineHeights = {
    paragraph: 1.4,
    heading1: 0.95,
    heading2: 1,
    heading3: 1.1,
    heading4: 1.2,
    heading5: 1.3,
    heading6: 1.35,
    caption: 1.5,
    custom: 1.4,
  };
  const textColors = {
    text: 'var(--hero-scheme-text)',
    heading: 'var(--hero-scheme-headings)',
    link: 'var(--hero-scheme-links)',
  };
  const padding = (side) => `${Math.max(0, Math.min(240, Number(settings[`padding${side}`]) || 0))}px`;

  return {
    width,
    maxWidth,
    fontSize: fontSizes[typographyPreset] || undefined,
    lineHeight: lineHeights[typographyPreset] || undefined,
    color: textColors[settings.color],
    backgroundColor: settings.backgroundEnabled ? settings.backgroundColor || '#fff6df' : undefined,
    padding: `${padding('Top')} ${padding('Right')} ${padding('Bottom')} ${padding('Left')}`,
  };
}

function renderHeroContentBlock(block, heroType, resource, resourceType) {
  if (block.type === 'heroHeading') block = blockWithDynamicText(block, 'heading', resource, resourceType);
  if (block.type === 'heroText') block = blockWithDynamicText(block, 'body', resource, resourceType);
  if (block.type === 'heroEyebrow') block = blockWithDynamicText(block, 'eyebrow', resource, resourceType);
  if (block.type === 'heroEyebrow') {
    const textDocument = heroContentTextDocument(block);
    const text = block.settings?.contentRichText
      ? <RichTextInlineContent doc={textDocument} />
      : <span>{block.eyebrow}</span>;
    return <div className="hero-content-block hero-content-block--eyebrow" style={heroContentTextStyle(block)}>
      {heroType === 'heroVideo'
        ? <span className="hero__eyebrow">{text}<span className="hero__eyebrow-line" aria-hidden="true" /></span>
        : <span className="eyebrow eyebrow--light">{text}</span>}
    </div>;
  }
  if (block.type === 'heroHeading') return <h1><Inline text={block.heading} /></h1>;
  if (block.type === 'heroText') {
    if (!block.body && !block.settings?.contentRichText) return null;
    const textDocument = heroContentTextDocument(block);
    return <div className="hero-content-block hero-content-block--text" style={heroContentTextStyle(block)}>
      {block.settings?.contentRichText
        ? <RichTextContent doc={textDocument} className="hero-content-block__rich-text rich-text" />
        : <p><Inline text={block.body} /></p>}
    </div>;
  }
  if (block.type === 'heroButton' && block.linkLabel) {
    const isSecondary = block.settings?.variant === 'secondary';
    return <Link className={isSecondary ? 'hero__link-secondary' : 'hero__button-primary'} href={block.linkHref || '/'}>{block.linkLabel}</Link>;
  }
  return null;
}

function HeroContentBlocks({ blocks, heroType, preview, resource, resourceType }) {
  const enabledBlocks = (blocks || []).filter((childBlock) => childBlock?.enabled !== false && HERO_CONTENT_BLOCK_TYPES.has(childBlock?.type));
  const renderedBlocks = [];

  for (let index = 0; index < enabledBlocks.length; index += 1) {
    const childBlock = enabledBlocks[index];
    if (childBlock.type === 'heroButton') {
      const buttonRun = [];
      while (index < enabledBlocks.length && enabledBlocks[index].type === 'heroButton') {
        buttonRun.push(enabledBlocks[index]);
        index += 1;
      }
      index -= 1;
      renderedBlocks.push(<div className="hero__actions" key={`${buttonRun[0].id}-actions`}>
        {buttonRun.map((buttonBlock) => <BlockSlot key={buttonBlock.id} id={buttonBlock.id} block={buttonBlock} preview={preview} anchorOnContent>
          {renderHeroContentBlock(buttonBlock, heroType, resource, resourceType)}
        </BlockSlot>)}
      </div>);
      continue;
    }
    renderedBlocks.push(<BlockSlot key={childBlock.id} id={childBlock.id} block={childBlock} preview={preview} anchorOnContent>
      {renderHeroContentBlock(childBlock, heroType, resource, resourceType)}
    </BlockSlot>);
  }

  return renderedBlocks;
}

const HERO_CONTENT_BLOCK_TYPES = new Set(['heroEyebrow', 'heroHeading', 'heroText', 'heroButton']);

function HeroVideo({ block, preview = false, resource = null, resourceType = '' }) {
  const presentation = heroPresentation(block, resource, resourceType);
  const media = presentation.media;
  const hasBothMobileMediaSlots = heroMediaHasMobileAsset(media) && heroMediaHasMobileAsset({ ...media.media2, showDifferentOnMobile: media.showDifferentOnMobile });
  if (heroContentSchemaIsCurrent(block)) {
    return (
      <section className={`hero${presentation.usesColorScheme ? ' hero--theme-scheme' : ''} hero--align-${presentation.alignment}${presentation.settings.width === 'full' ? ' hero--full-width-content' : ''}${presentation.settings.height && presentation.settings.height !== 'auto' ? ` hero--height-${presentation.settings.height}` : ''}${presentation.settings.blurredReflection && media.type === 'image' ? ' hero--blurred-reflection' : ''}${hasBothMobileMediaSlots && media.stackMediaOnMobile ? ' hero--stack-media-mobile' : ''}`} style={presentation.sectionStyle}>
        <HeroMediaLayers media={media} imageClassName="hero__video hero__image" videoClassName="hero__video" posterClassName="hero__video hero__poster" priority />
        <div className="hero__wash" style={presentation.washStyle} />
        <HeroSectionLink settings={presentation.settings} sectionLink={presentation.sectionLink} title={presentation.title} />
        <div className="hero__content"><HeroContentBlocks blocks={block.blocks} heroType={block.type} preview={preview} resource={resource} resourceType={resourceType} /></div>
      </section>
    );
  }
  return (
    <section className={`hero${presentation.usesColorScheme ? ' hero--theme-scheme' : ''} hero--align-${presentation.alignment}${presentation.settings.width === 'full' ? ' hero--full-width-content' : ''}${presentation.settings.height && presentation.settings.height !== 'auto' ? ` hero--height-${presentation.settings.height}` : ''}${presentation.settings.blurredReflection && media.type === 'image' ? ' hero--blurred-reflection' : ''}${hasBothMobileMediaSlots && media.stackMediaOnMobile ? ' hero--stack-media-mobile' : ''}`} style={presentation.sectionStyle}>
      <HeroMediaLayers media={media} imageClassName="hero__video hero__image" videoClassName="hero__video" posterClassName="hero__video hero__poster" priority />
      <div className="hero__wash" style={presentation.washStyle} />
      <HeroSectionLink settings={presentation.settings} sectionLink={presentation.sectionLink} title={presentation.title} />
      <div className="hero__content">
        <div className="hero__eyebrow">
          <span>{block.eyebrow}</span>
          <span className="hero__eyebrow-line" aria-hidden="true" />
        </div>
        <h1><Inline text={block.heading} /></h1>
        {block.body ? <p><Inline text={block.body} /></p> : null}
        <div className="hero__actions">
          {block.linkLabel ? <Link className="hero__button-primary" href={block.linkHref || '/'}>{block.linkLabel}</Link> : null}
          {block.secondaryLinkLabel ? <Link className="hero__link-secondary" href={block.secondaryLinkHref || '/'}>{block.secondaryLinkLabel}</Link> : null}
        </div>
      </div>
    </section>
  );
}

function HeroImage({ block, first, preview = false, resource = null, resourceType = '' }) {
  const presentation = heroPresentation(block, resource, resourceType);
  const media = presentation.media;
  const hasBothMobileMediaSlots = heroMediaHasMobileAsset(media) && heroMediaHasMobileAsset({ ...media.media2, showDifferentOnMobile: media.showDifferentOnMobile });
  if (heroContentSchemaIsCurrent(block)) {
    return (
      <section className={`page-hero${presentation.usesColorScheme ? ' page-hero--theme-scheme' : ''} hero--align-${presentation.alignment}${presentation.settings.width === 'full' ? ' hero--full-width-content' : ''}${presentation.settings.height && presentation.settings.height !== 'auto' ? ` hero--height-${presentation.settings.height}` : ''}${presentation.settings.blurredReflection && media.type === 'image' ? ' hero--blurred-reflection' : ''}${hasBothMobileMediaSlots && media.stackMediaOnMobile ? ' page-hero--stack-media-mobile' : ''}`} style={presentation.sectionStyle}>
        <HeroMediaLayers media={media} imageClassName="page-hero__image" videoClassName="page-hero__video" posterClassName="page-hero__video page-hero__poster" priority={first} pageHero />
        <div className="page-hero__wash" style={presentation.washStyle} />
        <HeroSectionLink settings={presentation.settings} sectionLink={presentation.sectionLink} title={presentation.title} />
        <div className="page-hero__content"><HeroContentBlocks blocks={block.blocks} heroType={block.type} preview={preview} resource={resource} resourceType={resourceType} /></div>
      </section>
    );
  }
  return (
    <section className={`page-hero${presentation.usesColorScheme ? ' page-hero--theme-scheme' : ''} hero--align-${presentation.alignment}${presentation.settings.width === 'full' ? ' hero--full-width-content' : ''}${presentation.settings.height && presentation.settings.height !== 'auto' ? ` hero--height-${presentation.settings.height}` : ''}${hasBothMobileMediaSlots && media.stackMediaOnMobile ? ' page-hero--stack-media-mobile' : ''}`} style={presentation.sectionStyle}>
      <HeroMediaLayers media={media} imageClassName="page-hero__image" videoClassName="page-hero__video" posterClassName="page-hero__video page-hero__poster" priority={first} pageHero />
      <div className="page-hero__wash" style={presentation.washStyle} />
      <HeroSectionLink settings={presentation.settings} sectionLink={presentation.sectionLink} title={presentation.title} />
      <div className="page-hero__content">
        <span className="eyebrow eyebrow--light">{block.eyebrow}</span>
        <h1><Inline text={block.heading} /></h1>
        {block.body ? <p><Inline text={block.body} /></p> : null}
      </div>
    </section>
  );
}

function PageHeader({ block, first }) {
  if (block.layout === 'left') {
    return (
      <section className="appointment-hero">
        <div>
          <span className="eyebrow">{block.eyebrow}</span>
          <h1><Inline text={block.heading} /></h1>
          <Paragraphs text={block.body} />
        </div>
      </section>
    );
  }
  if (block.layout === 'story') {
    return (
      <section className={`block-page-header section--ivory${first ? ' block-page-header--first' : ''}`}>
        <div className="content-page__hero" style={{ paddingBottom: '32px' }}>
          <span className="eyebrow">{block.eyebrow}</span>
          <h1 style={{ maxWidth: '960px', margin: '14px auto 18px' }}><Inline text={block.heading} /></h1>
          {block.body ? (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(18px, 2.2vw, 22px)', fontStyle: 'italic', color: 'var(--mulberry, #6B2D3E)', maxWidth: '720px', margin: '0 auto' }}>
              <Inline text={block.body} />
            </p>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section className={`block-page-header section--ivory${first ? ' block-page-header--first' : ''}`}>
      <div className="content-page__hero">
        <span className="eyebrow">{block.eyebrow}</span>
        <h1><Inline text={block.heading} /></h1>
        {block.body ? <p><Inline text={block.body} /></p> : null}
      </div>
    </section>
  );
}

function CenteredText({ block }) {
  return (
    <Reveal as="section" className={`section section--ivory brand-intro${toneClass(block.tone, 'ivory')}`}>
      <span className="eyebrow">{block.eyebrow}</span>
      <h2><Inline text={block.heading} /></h2>
      <Paragraphs text={block.body} />
      {block.linkLabel ? <Link href={block.linkHref || '/'} className="text-link">{block.linkLabel}</Link> : null}
    </Reveal>
  );
}

function SplitText({ block }) {
  return (
    <section className={`custom-why${toneClass(block.tone, 'mulberry')}`}>
      <div className="custom-why__title">
        <span className="eyebrow">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
      </div>
      <div className="custom-why__copy">
        <Paragraphs text={block.body} />
        {block.linkLabel ? <Link href={block.linkHref || '/'} className="text-link" style={{ marginTop: 12, display: 'inline-block' }}>{block.linkLabel}</Link> : null}
      </div>
    </section>
  );
}

function SplitImage({ block }) {
  return (
    <Reveal as="section" className={`about-founder craftsmanship-gold section section--paper${toneClass(block.tone, 'mulberry')}`}>
      <div>
        <span className="eyebrow">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
        <Paragraphs text={block.body} />
      </div>
      <div className="about-founder__image">
        {block.image ? <Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="45vw" style={{ objectFit: 'cover', ...focus(block.imagePosition) }} /> : null}
      </div>
    </Reveal>
  );
}

const CHAPTER_TONE = { paper: 'section section--paper', ivory: 'section section--ivory', olive: 'story-chapter--olive section' };

function StoryChapter({ block }) {
  const tone = block.tone || 'paper';
  const toneClasses = CHAPTER_TONE[tone] || `story-chapter--olive section block-tone block-tone--${tone} ${DARK_TONES.has(tone) ? 'block-tone--dark' : 'block-tone--light'}`;
  return (
    <Reveal as="section" className={`story-chapter ${toneClasses}`}>
      <div className={`story-chapter__inner${block.layout === 'image-left' ? ' story-chapter__inner--reverse' : ''}`}>
        <div className="story-chapter__copy">
          <span className="eyebrow">{block.eyebrow}</span>
          <h2><Inline text={block.heading} /></h2>
          {block.note ? <span className="story-chapter__tagline"><Inline text={block.note} /></span> : null}
          <Paragraphs text={block.body} />
          {block.accent ? <p className="story-chapter__highlight"><Inline text={block.accent} /></p> : null}
        </div>
        <div className="story-chapter__media">
          <div className="story-family-duo">
            {(block.cards || []).filter((photo) => photo.image).map((photo) => (
              <div className="story-family-card" key={photo.id}>
                <div className={`story-family-card__img story-family-card__img--${photo.shape === 'portrait' ? 'portrait' : '3x2'}`}>
                  <Image src={asset(photo.image)} alt={photo.imageAlt || ''} fill sizes="(max-width: 860px) 100vw, 40vw" style={focus(photo.imagePosition)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Letter({ block }) {
  return (
    <Reveal as="section" className="founder-letter">
      <div className="founder-letter__image">
        {block.image ? <Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="(max-width: 900px) 100vw, 50vw" priority={false} style={focus(block.imagePosition)} /> : null}
      </div>
      <div className="founder-letter__copy">
        <span className="founder-letter__eyebrow">{block.eyebrow}</span>
        <div className="founder-letter__text">
          <Paragraphs text={block.body} />
        </div>
        <div className="founder-letter__signoff">
          {block.note ? <p><Inline text={block.note} /></p> : null}
          {block.heading ? <p className="founder-letter__name"><Inline text={block.heading} /></p> : null}
        </div>
        {block.linkLabel ? <Link href={block.linkHref || '/'} className="hero__button-primary founder-letter__button">{block.linkLabel}</Link> : null}
      </div>
    </Reveal>
  );
}

function QuoteBand({ block }) {
  const light = block.tone && !DARK_TONES.has(block.tone);
  return (
    <Reveal as="div" className={`story-interlude-band${toneClass(block.tone, 'mulberry')}`}>
      <LotusMark style={{ height: 28, width: 'auto', margin: '0 auto 16px', opacity: 0.8 }} fill={light ? 'var(--mulberry)' : 'var(--ivory)'} />
      <blockquote className="story-interlude-band__quote"><Inline text={block.body} /></blockquote>
      {block.note ? <span className="story-interlude-band__author">{block.note}</span> : null}
    </Reveal>
  );
}

function Cta({ block }) {
  return (
    <Reveal as="section" className={`final-cta${toneClass(block.tone, 'mulberry-dark')}`}>
      <h2><Inline text={block.heading} /></h2>
      {block.body ? <p><Inline text={block.body} /></p> : null}
      <div className="final-cta__actions">
        {block.linkLabel ? <Link className="button button--light" href={block.linkHref || '/'}>{block.linkLabel}</Link> : null}
        {block.secondaryLinkLabel ? (
          <Link className="button button--outline" href={block.secondaryLinkHref || '/'} style={{ borderColor: 'rgba(255,246,223,0.5)', color: 'var(--ivory)' }}>
            {block.secondaryLinkLabel}
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}

function ClosingBand({ block }) {
  return (
    <Reveal as="section" className={`made-to-last${toneClass(block.tone, 'olive-dark')}`}>
      <span className="eyebrow eyebrow--light">{block.eyebrow}</span>
      <Paragraphs text={block.body} />
      {block.accent ? <p className="signoff"><Inline text={block.accent} /></p> : null}
    </Reveal>
  );
}

function ImageCards({ block }) {
  return (
    <Reveal as="section" className="categories-section" id="collections">
      <div className="categories-intro">
        <span className="eyebrow">{block.eyebrow}</span>
        <h2 className="editorial-heading"><Inline text={block.heading} /></h2>
      </div>
      <div className="category-grid" style={cols(block.cards, 4)}>
        {(block.cards || []).map((card, index) => (
          <RevealLink href={card.linkHref || '/'} className="category-card" delay={index * 90} key={card.id}>
            <div className="category-card__image">
              {card.image ? <Image src={asset(card.image)} alt={card.heading || ''} fill sizes="(max-width: 800px) 100vw, 25vw" style={focus(card.imagePosition)} /> : null}
            </div>
            <div className="category-card__body">
              <span>{card.eyebrow}</span>
              <h3><Inline text={card.heading} /></h3>
              <p><Inline text={card.body} /></p>
              {card.linkLabel ? <span className="category-card__link">{card.linkLabel} →</span> : null}
            </div>
          </RevealLink>
        ))}
      </div>
    </Reveal>
  );
}

function ImageCompareSection({ block, children, preview = false }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const contentGroup = Array.isArray(block.blocks) ? block.blocks.find((childBlock) => childBlock?.type === 'group' && childBlock.enabled !== false) : null;
  const hasContent = Array.isArray(contentGroup?.blocks) && contentGroup.blocks.some((contentBlock) => contentBlock?.enabled !== false
    && ['eyebrow', 'heading', 'body', 'text', 'caption', 'linkLabel', 'label'].some((fieldName) => String(contentBlock?.[fieldName] || '').trim()));
  const showContentHint = preview && contentGroup && !hasContent;
  const layoutDirection = settings.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const alignment = { left: 'flex-start', center: 'center', right: 'flex-end', 'space-between': layoutDirection === 'vertical' ? 'stretch' : 'space-between' }[settings.alignment] || 'space-between';
  const position = { top: 'flex-start', center: 'center', bottom: 'flex-end', 'space-between': 'space-between' }[settings.position] || 'center';
  const width = settings.width === 'full' ? '100%' : 'min(80rem, 100%)';
  const height = { auto: 'auto', small: '40svh', medium: '60svh', large: '80svh', 'full-screen': '100svh' }[settings.height]
    || (settings.height === 'custom' ? `${Math.min(1600, Math.max(100, Number(settings.customHeight) || 600))}px` : 'auto');
  const scheme = resolveColorSchemeSelection(settings.colorScheme || 'scheme1', 'scheme1');
  const isThemeScheme = String(settings.colorScheme || 'scheme1').startsWith('scheme');
  const sectionStyle = {
    ...(isThemeScheme ? sectionSchemeStyle(scheme.number, 'image-compare-scheme') : {}),
    '--image-compare-width': width,
    '--image-compare-gap': `${Math.min(160, Math.max(0, Number(settings.gap) || 0))}px`,
    ...(height !== 'auto' ? { minHeight: height } : {}),
    '--image-compare-border': settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none',
    '--image-compare-radius': `${Math.min(200, Math.max(0, Number(settings.cornerRadius) || 0))}px`,
    '--image-compare-alignment': alignment,
    '--image-compare-position': position,
    paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop) || 0))}px`,
    paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom) || 0))}px`,
    textAlign: ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'center',
    ...(isThemeScheme ? { backgroundColor: 'var(--image-compare-scheme-background)', color: 'var(--image-compare-scheme-text)' } : {}),
  };
  const imageBackground = settings.backgroundMedia === 'image' && settings.backgroundImage ? asset(settings.backgroundImage) : '';
  const videoBackground = settings.backgroundMedia === 'video' && settings.backgroundVideo ? asset(settings.backgroundVideo) : '';

  return <section className={`image-compare-section image-compare-section--${layoutDirection}${settings.verticalOnMobile ? ' image-compare-section--vertical-mobile' : ''}${settings.width === 'full' ? ' image-compare-section--full-width' : ''}${isThemeScheme ? ' image-compare-section--theme-scheme' : ''}`} style={sectionStyle}>
    {imageBackground ? <Image className="image-compare-section__background" src={imageBackground} alt="" fill sizes="100vw" aria-hidden="true" /> : null}
    {videoBackground ? <video className="image-compare-section__background" src={videoBackground} autoPlay muted loop playsInline aria-hidden="true" /> : null}
    {settings.overlayEnabled ? <span className="image-compare-section__overlay" aria-hidden="true" style={{ background: settings.overlayColor || '#000', opacity: Math.min(100, Math.max(0, Number(settings.overlayOpacity) || 0)) / 100 }} /> : null}
    <div className="image-compare-section__inner">
      {showContentHint ? <p className="image-compare-section__empty-content">Add text or a button in the Content group.</p> : null}
      {children}
    </div>
  </section>;
}

function ValuesBand({ block }) {
  return (
    <Reveal as="section" className="house-values">
      <Image src="/icons/lotus-ivory.svg" alt="" width={520} height={520} unoptimized className="house-values__mark" style={{ opacity: 0.08 }} />
      <div className="house-values__intro">
        <span className="eyebrow eyebrow--light">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
      </div>
      <div className="house-values__grid house-values__grid--split" style={cols(block.cards, 3)}>
        {(block.cards || []).map((value) => (
          <div key={value.id}>
            <span>{value.eyebrow}</span>
            <h3><Inline text={value.heading} /></h3>
            <p><Inline text={value.body} /></p>
          </div>
        ))}
      </div>
      {block.linkLabel ? (
        <div className="house-values__cta">
          <Link href={block.linkHref || '/'}>{block.linkLabel}</Link>
        </div>
      ) : null}
    </Reveal>
  );
}

function StandardsBand({ block }) {
  return (
    <Reveal as="section" className="standards-band">
      <Image src="/icons/lotus-ivory.svg" alt="" width={520} height={520} unoptimized className="house-values__mark" style={{ width: 520, height: 520, position: 'absolute', top: -100, right: -120, opacity: 0.08, pointerEvents: 'none' }} />
      <div className="standards-band__head">
        <span className="eyebrow eyebrow--light">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
        <Paragraphs text={block.body} />
      </div>
      <div className="standards-grid" style={cols(block.cards, 3)}>
        {(block.cards || []).map((fact) => (
          <div key={fact.id}>
            <h3><Inline text={fact.heading} /></h3>
            <p><Inline text={fact.body} /></p>
          </div>
        ))}
      </div>
      {block.accent ? <p className="standards-band__note"><Inline text={block.accent} /></p> : null}
    </Reveal>
  );
}

function StepsList({ block }) {
  return (
    <Reveal as="section" className="craft-journey section section--paper">
      <div className="craft-journey__intro">
        <span className="eyebrow">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
        <Paragraphs text={block.body} />
      </div>
      <ol className="craft-journey__list">
        {(block.cards || []).map((step) => (
          <li key={step.id}>
            <span>{step.eyebrow}</span>
            <div>
              <h3><Inline text={step.heading} /></h3>
              <Paragraphs text={step.body} />
            </div>
            <div className="craft-journey__step-image">
              {step.image ? <Image src={asset(step.image)} alt={step.imageAlt || ''} fill sizes="(max-width: 860px) 100vw, 200px" style={{ objectFit: 'cover', ...focus(step.imagePosition) }} /> : null}
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function ProcessTimeline({ block }) {
  const stages = block.cards || [];
  return (
    <section className="custom-timeline-section">
      <div className="custom-timeline__header">
        <div className="custom-timeline__eyebrow-row">
          <span className="custom-timeline__rule" />
          <span className="custom-timeline__eyebrow">{block.eyebrow}</span>
          <span className="custom-timeline__rule" />
        </div>
        <h2 className="custom-timeline__title"><Inline text={block.heading} /></h2>
        {block.body ? <p className="custom-timeline__subtitle"><Inline text={block.body} /></p> : null}
      </div>
      <div className="custom-timeline__track">
        <div className="custom-timeline__spine" />
        <div className="custom-timeline__grid custom-timeline__grid--five" style={cols(stages, 5)}>
          {stages.map((step, index) => (
            <div key={step.id} className="timeline-step-item">
              <div className="timeline-step__icon-wrap">
                <div className="timeline-step__icon-circle">
                  {step.icon ? <Image src={step.icon} alt="" width={32} height={32} unoptimized className="timeline-step__icon-svg" /> : null}
                </div>
                <span className="timeline-step__num-badge">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="timeline-step__content">
                <span className="timeline-step__stage-tag">{step.eyebrow}</span>
                <h3 className="timeline-step__heading"><Inline text={step.heading} /></h3>
                <p className="timeline-step__copy"><Inline text={step.body} /></p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {block.accent || block.linkLabel ? (
        <div className="custom-timeline__footer">
          <div className="custom-timeline__divider" />
          {block.accent ? <p className="custom-timeline__note"><Inline text={block.accent} /></p> : null}
          {block.linkLabel ? <Link href={block.linkHref || '/'} className="button button--mulberry">{block.linkLabel}</Link> : null}
        </div>
      ) : null}
    </section>
  );
}

function ProcessVideos({ block }) {
  const cta = block.cta || {};
  return (
    <Reveal as="section" id="custom-journey" className="section section--paper bespoke">
      <div className="bespoke__head">
        <span className="eyebrow">{block.eyebrow}</span>
        <h2><Inline text={block.heading} /></h2>
        <p><JoinedParagraphs text={block.body} /></p>
      </div>
      <div className="process-grid" style={cols(block.cards, 4)}>
        {(block.cards || []).map((step, index) => (
          <ProcessVideoCard key={step.id} title={step.heading} body={step.body} path={step.icon || 'circle'} videoSrc={asset(step.video)} posterSrc={asset(step.image)} index={index} />
        ))}
      </div>
      {cta.heading || cta.linkLabel ? (
        <div className="bespoke__cta">
          <div className="bespoke__cta-copy">
            <span className="eyebrow">{cta.eyebrow}</span>
            <h3><Inline text={cta.heading} /></h3>
            {cta.body ? <p><Inline text={cta.body} /></p> : null}
          </div>
          {cta.linkLabel ? <Link className="button" href={cta.linkHref || '/'}>{cta.linkLabel}</Link> : null}
        </div>
      ) : null}
    </Reveal>
  );
}

function GuidanceSplit({ block }) {
  return (
    <section className="bridal-guidance">
      <div className="bridal-guidance__text">
        <div className="bridal-guidance__intro">
          <span className="eyebrow eyebrow--light">{block.eyebrow}</span>
          <h2><Inline text={block.heading} /></h2>
        </div>
        <div className="bridal-guidance__copy">
          <Paragraphs text={block.body} />
          {block.note ? <p style={{ fontWeight: 600, color: 'var(--ivory, #FFF6DF)' }}><Inline text={block.note} /></p> : null}
          <Paragraphs text={block.accent} />
          {block.linkLabel ? <Link href={block.linkHref || '/book-appointment'} className="hero__button-primary" style={{ marginTop: 14, display: 'inline-flex' }}>{block.linkLabel}</Link> : null}
        </div>
      </div>
      <div className="bridal-guidance__image">
        {block.image ? <Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="(max-width: 900px) 100vw, 40vw" style={{ objectFit: 'cover', objectPosition: block.imagePosition || 'center 40%' }} /> : null}
      </div>
    </section>
  );
}

function EditorialFeature({ block }) {
  return (
    <section className="bridal-traditional bridal-traditional--editorial">
      <div className="bridal-traditional__content">
        <span className="eyebrow">{block.eyebrow}</span>
        <h2 className="bridal-traditional__title"><Inline text={block.heading} /></h2>
        {block.body ? <p className="bridal-traditional__lead"><Inline text={block.body} /></p> : null}
        <div className="bridal-traditional__actions">
          {block.linkLabel ? <Link href={block.linkHref || '/'} className="bridal-traditional__link">{block.linkLabel}</Link> : null}
          {block.secondaryLinkLabel ? <Link href={block.secondaryLinkHref || '/'} className="bridal-traditional__link bridal-traditional__link--secondary">{block.secondaryLinkLabel}</Link> : null}
        </div>
      </div>
      <div className="bridal-traditional__media">
        {block.image ? <Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="(max-width: 980px) 100vw, 50vw" style={{ objectPosition: block.imagePosition || 'center 20%', objectFit: 'cover' }} /> : null}
      </div>
    </section>
  );
}

function ListingHeader({ block }) {
  return (
    <section className="listing-page__hero section section--ivory">
      <span className="eyebrow">{block.eyebrow}</span>
      <h1><Inline text={block.heading} /></h1>
      {block.body ? <p style={{ maxWidth: 680, margin: '14px auto 0', color: 'var(--stone, #6F675B)', fontSize: '1.05rem', lineHeight: 1.6 }}><Inline text={block.body} /></p> : null}
    </section>
  );
}

function BlogPosts({ block, resource = {}, children, showEmptyState = false }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const layout = ['grid', 'carousel', 'editorial'].includes(settings.layout) ? settings.layout : 'legacy-grid';
  const hasArticles = Array.isArray(resource.articles) && resource.articles.length > 0;
  const schemeSelection = resolveColorSchemeSelection(settings.colorScheme || 'scheme1', 'scheme1');
  return (
    <section className="blog-posts-section blog-posts-section--theme-scheme" style={{
      paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop ?? 0)))}px`,
      paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom ?? 48)))}px`,
      background: schemeCssColor(schemeSelection.number, 'base', 'background'),
      color: schemeCssColor(schemeSelection.number, 'base', 'text'),
      ...sectionSchemeStyle(schemeSelection.number, 'blog-posts-scheme'),
    }}>
      <div className="blog-posts-section__inner" data-blog-layout={layout}>
        {children}
        {!hasArticles && showEmptyState ? <p className="blog-posts-section__empty">No published posts yet.</p> : null}
      </div>
    </section>
  );
}

function BlogTitle({ block, resource = {} }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  let richTitleDocument = null;
  if (!block.dynamicSource && typeof settings.titleRichText === 'string') {
    try {
      richTitleDocument = sanitizeRichDoc(JSON.parse(settings.titleRichText));
    } catch {
      richTitleDocument = null;
    }
  }
  const hasRichTitle = richTitleDocument && docToText(richTitleDocument).length > 0;
  const titleContent = block.dynamicSource === 'blog.title'
    ? resource.title || 'News'
    : hasRichTitle
      ? <RichTextInlineContent doc={richTitleDocument} />
      : block.heading || resource.title || 'News';
  const typographyPreset = settings.typographyPreset || 'heading1';
  const typographyStyle = blogPostTypographyStyle(settings, 'heading1');
  if (typographyPreset === 'heading1') typographyStyle.fontSize = 'clamp(42px, 6vw, 76px)';
  const color = blogPostTextColor(settings.color || 'heading');
  const maxWidthOptions = { narrow: '44rem', normal: '68rem', none: 'none' };
  const backgroundColor = /^#[\da-f]{6}$/i.test(settings.backgroundColor || '') ? settings.backgroundColor : '#fff6df';
  return <h1 className="blog-posts-section__title" style={{
    width: settings.width === 'fill' ? '100%' : 'fit-content',
    maxWidth: maxWidthOptions[settings.maxWidth] || maxWidthOptions.normal,
    marginInline: 'auto',
    boxSizing: 'border-box',
    ...typographyStyle,
    ...blogPostPaddingStyle(settings, false, { paddingTop: 48, paddingBottom: 48 }, 240),
    ...(color ? { color } : {}),
    ...(settings.backgroundEnabled ? { backgroundColor } : {}),
  }}>{titleContent}</h1>;
}

function BlogPost({ children, resource = {} }) {
  const articles = Array.isArray(resource.articles) ? resource.articles : [];
  if (!articles.length) return null;
  return <BlogPostCollection layout={resource.blogPostsLayout || 'legacy-grid'}>{children}</BlogPostCollection>;
}

function blogPostTypographyStyle(settings = {}, defaultPreset = 'default') {
  const preset = settings.typographyPreset || defaultPreset;
  const typographyPresets = {
    paragraph: { fontFamily: 'var(--sans)', fontSize: '16px', fontWeight: 400, lineHeight: 1.55 },
    heading1: { fontFamily: 'var(--serif)', fontSize: '40px', fontWeight: 400, lineHeight: 1.05 },
    heading2: { fontFamily: 'var(--serif)', fontSize: '34px', fontWeight: 400, lineHeight: 1.08 },
    heading3: { fontFamily: 'var(--serif)', fontSize: 'clamp(25px, 3vw, 38px)', fontWeight: 400, lineHeight: 1.14 },
    heading4: { fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 400, lineHeight: 1.2 },
    heading5: { fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: 400, lineHeight: 1.25 },
    heading6: { fontFamily: 'var(--sans)', fontSize: '15px', fontWeight: 600, lineHeight: 1.3 },
  };
  const customStyle = preset === 'custom' ? { fontSize: `${Math.min(72, Math.max(10, Number(settings.customFontSize) || 16))}px` } : {};
  return { ...(typographyPresets[preset] || {}), ...customStyle };
}

function blogPostPaddingStyle(settings = {}, verticalOnly = false, defaults = {}, maximum = 120) {
  const boundedPadding = (value, fallback = 0) => `${Math.min(maximum, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallback))}px`;
  return {
    paddingTop: boundedPadding(settings.paddingTop, defaults.paddingTop),
    paddingBottom: boundedPadding(settings.paddingBottom, defaults.paddingBottom),
    ...(verticalOnly ? {} : {
      paddingLeft: boundedPadding(settings.paddingLeft, defaults.paddingLeft),
      paddingRight: boundedPadding(settings.paddingRight, defaults.paddingRight),
    }),
  };
}

function blogPostTextColor(color = 'inherit') {
  return ({
    text: 'var(--blog-posts-scheme-text)',
    heading: 'var(--blog-posts-scheme-headings)',
    link: 'var(--blog-posts-scheme-links)',
  })[color];
}

function BlogPostTitle({ block, resource = {} }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const color = blogPostTextColor(settings.color || 'heading');
  const style = {
    ...blogPostTypographyStyle(settings, 'heading3'),
    ...blogPostPaddingStyle(settings, false, { paddingBottom: 10 }),
    ...(color ? { color } : {}),
  };
  if (!resource.article?.title) return null;
  const title = <h2 className="blog-post-card__title" style={style}>{resource.article.title}</h2>;
  const href = resource.article.route || (resource.article.handle ? `/blogs/${resource.handle}/${resource.article.handle}` : '');
  return resource.previewMode || !href ? title : <Link href={href} className="blog-post-card__link">{title}</Link>;
}

function BlogPostDetails({ block, resource = {} }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const publishedAt = settings.showDate ? resource.article?.publishedAt : null;
  const date = publishedAt ? new Date(`${String(publishedAt).slice(0, 10)}T12:00:00.000Z`) : null;
  const author = settings.showAuthor ? resource.article?.author : null;
  const details = [publishedAt && date && Number.isFinite(date.getTime()) ? <time key="date" dateTime={date.toISOString()}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time> : null, author ? <span key="author">{author}</span> : null].filter(Boolean);
  if (!details.length) return null;
  const color = blogPostTextColor(settings.color || 'text');
  return <p className="blog-post-card__details" style={{ ...blogPostTypographyStyle(settings), ...blogPostPaddingStyle(settings, true), ...(color ? { color } : {}) }}>{details.map((detail, index) => <span key={detail.key || index}>{index ? ' · ' : null}{detail}</span>)}</p>;
}

function BlogPostDescription({ block, resource = {} }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const color = blogPostTextColor(settings.color || 'text');
  return resource.article?.description ? <p className="blog-post-card__description" style={{ ...blogPostTypographyStyle(settings), ...blogPostPaddingStyle(settings, true, { paddingTop: 16 }), ...(color ? { color } : {}) }}>{resource.article.description}</p> : null;
}

function BlogPostImage({ block, resource = {} }) {
  const article = resource.article;
  if (!article?.image) return null;
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const height = ['small', 'medium', 'large'].includes(settings.height) ? settings.height : 'large';
  const cornerRadius = Math.min(100, Math.max(0, Number.isFinite(Number(settings.cornerRadius)) ? Number(settings.cornerRadius) : 4));
  const image = <div className={`blog-post-card__image blog-post-card__image--height-${height}`} style={{ border: settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none', borderRadius: `${cornerRadius}px` }}><Image src={asset(article.image)} alt={article.imageAlt || article.title || ''} fill unoptimized sizes="(max-width: 760px) 100vw, 50vw" style={{ objectFit: 'cover', ...focus(article.imagePosition) }} /></div>;
  const href = article.route || (article.handle ? `/blogs/${resource.handle}/${article.handle}` : '');
  return resource.previewMode || !href ? image : <Link href={href} className="blog-post-card__image-link" aria-label={`Read ${article.title || 'blog post'}`}>{image}</Link>;
}

function BlogArticle({ children }) {
  return <article className="blog-article">{children}</article>;
}

function BlogArticleTitle({ resource = {} }) {
  const title = resource.article?.title;
  return title ? <header className="blog-article__header"><h1>{title}</h1></header> : null;
}

function BlogArticleDetails({ resource = {} }) {
  const article = resource.article || {};
  const date = article.publishedAt ? new Date(`${String(article.publishedAt).slice(0, 10)}T12:00:00.000Z`) : null;
  const formattedDate = date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const details = [formattedDate, article.author].filter(Boolean);
  return details.length ? <div className="blog-article__details">{details.map((detail, index) => <span key={`${index}-${detail}`}>{detail}</span>)}</div> : null;
}

function BlogArticleImage({ resource = {} }) {
  const article = resource.article;
  if (!article?.image) return null;
  return <div className="blog-article__image"><Image src={asset(article.image)} alt={article.imageAlt || article.title || ''} fill priority unoptimized sizes="(max-width: 760px) 100vw, 1080px" style={{ objectFit: 'cover', ...focus(article.imagePosition) }} /></div>;
}

function BlogArticleExcerpt({ resource = {} }) {
  return resource.article?.excerpt ? <p className="blog-article__excerpt">{resource.article.excerpt}</p> : null;
}

function BlogArticleBody({ resource = {} }) {
  const body = resource.article?.body;
  if (!body) return null;
  return <RichTextContent doc={sanitizeRichDoc(body)} className="blog-article__content rich-text" />;
}

function SearchHeader({ block, resource }) {
  const searchBlocks = Array.isArray(block.cards) ? block.cards : SEARCH_HEADER_DEFAULT_BLOCKS;
  const formAction = resource?.previewMode ? '/preview/templates/search/default' : '/search';
  const clearHref = `${resource?.previewMode ? '/preview/templates/search/default?resource=search' : '/search'}${resource?.searchType === 'product' ? `${resource?.previewMode ? '&' : '?'}type=product` : ''}`;
  return (
    <section className={`listing-page__hero section section--${block.tone || 'ivory'} search-page-header search-page-header--${block.layout || 'center'}`}>
      {searchBlocks.map((searchBlock) => {
        if (searchBlock.enabled === false) return null;
        if (searchBlock.type === 'heading') return <div className="search-page-header__heading" key={searchBlock.id}>
          {searchBlock.eyebrow ? <span className="eyebrow">{searchBlock.eyebrow}</span> : null}
          {searchBlock.heading ? <h1><Inline text={searchBlock.heading} /></h1> : null}
        </div>;
        if (searchBlock.type === 'searchInput') return <form className="public-search-form" action={formAction} key={searchBlock.id}>
          {resource?.previewMode ? <input type="hidden" name="resource" value="search" /> : null}
          {resource?.searchType === 'product' ? <input type="hidden" name="type" value="product" /> : null}
          <label htmlFor="site-search">{searchBlock.body || 'Search the collection'}</label>
          <div>
            <input id="site-search" name="q" type="search" defaultValue={resource?.query || ''} placeholder={searchBlock.note || ''} />
            {resource?.query ? <Link href={clearHref} className="public-search-form__reset" aria-label="Clear search">×</Link> : null}
            <button className="button" type="submit">{searchBlock.linkLabel || 'Search'}</button>
          </div>
        </form>;
        return null;
      })}
    </section>
  );
}

function SearchResults({ block, resource = {} }) {
  const query = String(resource.query || '').trim();
  const collections = Array.isArray(resource.collections) ? resource.collections : [];
  const searchBlocks = Array.isArray(block.cards) ? block.cards : SEARCH_RESULTS_DEFAULT_BLOCKS;
  const canUseTemplateFeatures = resource.templatePublished !== false || resource.previewMode;
  const filteringAndSorting = canUseTemplateFeatures ? searchBlocks.find((item) => item.type === 'filteringAndSorting' && item.enabled !== false) : null;
  const productCard = searchBlocks.find((item) => item.type === 'productCard' && item.enabled !== false);
  const products = Array.isArray(resource.products) ? resource.products : [];
  const visibleProducts = products.slice(0, Math.max(1, Number(filteringAndSorting?.count) || 24));
  const recommendedProducts = Array.isArray(resource.recommendedProducts) ? resource.recommendedProducts : [];
  const resultCount = collections.length + products.length;
  const desktopColumns = productCard?.cardSize === 'small' ? 4 : productCard?.cardSize === 'large' ? 2 : 3;
  const mobileColumns = productCard?.fullWidthMobile || productCard?.mobileCardSize !== 'small' ? 1 : 2;
  const cardGridStyle = {
    '--search-grid-columns': filteringAndSorting?.layout === 'editorial' ? 2 : desktopColumns,
    '--search-grid-columns-mobile': mobileColumns,
  };
  const action = resource.previewMode ? '/preview/templates/search/default' : '/search';
  const querylessResults = !query && resource.searchType === 'product';
  const emptySearch = query && resultCount === 0;
  return (
    <section className="section section--paper">
      <div className="search-results__inner">
      {query
        ? <p className="search-summary">{resultCount} result{resultCount === 1 ? '' : 's'} for “{query}”</p>
        : querylessResults
          ? <p className="search-summary">{resultCount} product{resultCount === 1 ? '' : 's'}</p>
          : <p className="search-summary">{block.note || 'Search by piece, collection, metal, or stone.'}</p>}
      {searchBlocks.map((searchBlock) => {
        if (searchBlock.enabled === false) return null;
        if (searchBlock.type === 'filteringAndSorting') {
          if (!canUseTemplateFeatures) return null;
          return <form className="search-results__toolbar" action={action} key={searchBlock.id}>
            {resource.previewMode ? <input type="hidden" name="resource" value="search" /> : null}
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {resource.searchType === 'product' ? <input type="hidden" name="type" value="product" /> : null}
            {searchBlock.showAvailability !== false ? <label><span>Availability</span><select name="availability" defaultValue={resource.availability || 'all'}><option value="all">All</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label> : null}
            {searchBlock.showPriceFilter !== false ? <div className="search-results__price-filter"><span>Price</span><div><label><span className="sr-only">Minimum price</span><input name="min_price" type="number" min="0" inputMode="decimal" placeholder="Min" defaultValue={resource.minimumPrice || ''} /></label><label><span className="sr-only">Maximum price</span><input name="max_price" type="number" min="0" inputMode="decimal" placeholder="Max" defaultValue={resource.maximumPrice || ''} /></label></div></div> : null}
            {searchBlock.showSorting !== false ? <label><span>Sort by</span><select name="sort_by" defaultValue={resource.sortBy || 'relevance'}><option value="relevance">Relevance</option><option value="price-ascending">Price, low to high</option><option value="price-descending">Price, high to low</option><option value="title-ascending">Alphabetically, A–Z</option><option value="title-descending">Alphabetically, Z–A</option></select></label> : null}
            <button type="submit" className="search-results__apply">Apply</button>
          </form>;
        }
        if (searchBlock.type === 'productCard') return <div key={searchBlock.id}>
          {collections.length ? <div className="search-results__collections" style={{ justifyContent: 'flex-start' }}>
            {collections.map((collection) => <Link href={`/collections/${collection.slug}`} key={collection.slug}><span className="eyebrow">Collection</span><strong>{collection.name}</strong><span>{collection.note}</span></Link>)}
          </div> : null}
          {visibleProducts.length ? <div className="product-grid product-grid--three search-results__product-grid" style={cardGridStyle}>
            {visibleProducts.map((product, index) => <Link className="product-card" href={`/shop/${product.slug}`} key={product.slug}>
              <div className="product-card__image"><Image src={product.images[0]} alt={product.shortTitle || product.title} fill sizes="(max-width: 800px) 100vw, 33vw" priority={index < 3} style={{ objectPosition: product.imagePositions?.[0] || 'center center' }} /></div>
              <div className="product-card__meta"><div><p>{product.shortTitle || product.title}</p><span>{product.metal} · {product.stone}</span></div><strong>{product.saleMode === 'enquire' ? 'Enquire' : `$${product.price.toLocaleString()}`}</strong></div>
            </Link>)}
          </div> : null}
        </div>;
        return null;
      })}
      {emptySearch ? <div className="search-results__empty">
        <div className="empty-collection">
          <h2>{block.heading || 'Nothing found yet.'}</h2>
          <p>{block.body || 'Try a broader search or contact the atelier for a personal recommendation.'}</p>
          {block.linkLabel ? <Link className="button" href={block.linkHref || '/book-appointment'}>{block.linkLabel}</Link> : null}
        </div>
        {recommendedProducts.length ? <>
          <h3>{block.eyebrow || 'You may also like.'}</h3>
          <div className="product-grid product-grid--three search-results__product-grid" style={cardGridStyle}>
            {recommendedProducts.slice(0, Math.max(1, Number(filteringAndSorting?.count) || 24)).map((product, index) => (
              <Link className="product-card" href={`/shop/${product.slug}`} key={product.slug}>
                <div className="product-card__image"><Image src={product.images[0]} alt={product.shortTitle || product.title} fill sizes="(max-width: 800px) 100vw, 33vw" priority={index < 3} style={{ objectPosition: product.imagePositions?.[0] || 'center center' }} /></div>
                <div className="product-card__meta"><div><p>{product.shortTitle || product.title}</p><span>{product.metal} · {product.stone}</span></div><strong>{product.saleMode === 'enquire' ? 'Enquire' : `$${product.price.toLocaleString()}`}</strong></div>
              </Link>
            ))}
          </div>
        </> : null}
      </div> : null}
      </div>
    </section>
  );
}

function ProductGrid({ block, catalog, products }) {
  const items = catalog?.products || products || [];
  const categories = catalog?.categories || [];
  const category = catalog?.category || '';
  return (
    <section className="section section--paper">
      <div className="listing-toolbar listing-toolbar--centered listing-toolbar--column">
        <span className="eyebrow">{block.eyebrow}</span>
        <div className="listing-filters listing-filters--pills">
          <Link className={`filter-btn ${!category ? 'is-active' : ''}`} href="/shop">All</Link>
          {categories.map((item) => <Link className={`filter-btn ${category === item.slug ? 'is-active' : ''}`} href={'/shop?category=' + item.slug} key={item.slug}>{item.name}</Link>)}
        </div>
      </div>
      {items.length ? (
        <div className="product-grid product-grid--three">
          {items.map((product, index) => <ProductCard key={product.slug} product={product} index={index} />)}
        </div>
      ) : (
        <div className="empty-collection">
          <h2>No pieces match that edit.</h2>
          <p>Try another collection or contact the atelier for a personal recommendation.</p>
          <Link className="button" href="/book-appointment">Ask the atelier</Link>
        </div>
      )}
    </section>
  );
}

function ProductInformation({ block, resource: product, productInfo, contactEmail }) {
  if (!product) return null;
  const images = Array.isArray(product.images) ? product.images : [];
  const isSingleImage = images.length === 1;
  const gallery = (
    <div className={`pdp__gallery ${isSingleImage ? 'pdp__gallery--single' : ''}`}>
      {images.map((image, index) => (
        <div
          className={`pdp__image ${index === 0 && !isSingleImage ? 'pdp__image--hero' : ''} ${isSingleImage ? 'pdp__image--single' : ''}`}
          key={`${image}-${index}`}
        >
          <Image
            src={image}
            alt={`${product.shortTitle || product.title} view ${index + 1}`}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            priority={index === 0}
            style={{ objectPosition: product.imagePositions?.[index] || 'center center' }}
          />
        </div>
      ))}
    </div>
  );
  const info = <aside className="pdp__info">
    <ProductPurchaseSection
      product={product}
      selectedVariantId={product.selectedVariantId}
      productInfo={productInfo || {}}
      contactEmail={contactEmail || ''}
      blocks={Array.isArray(block.cards) ? block.cards : PRODUCT_INFORMATION_DEFAULT_BLOCKS}
    />
  </aside>;

  return (
    <section className="resource-product-information">
      <div className="product-breadcrumb">
        <Link href="/">Home</Link>
        {product.category ? <><span>/</span><Link href={`/collections/${product.category}`}>{product.category}</Link></> : null}
      </div>
      <section className={`pdp${block.layout === 'gallery-right' ? ' pdp--gallery-right' : ''}`}>
        {block.layout === 'gallery-right' ? <>{info}{gallery}</> : <>{gallery}{info}</>}
      </section>
    </section>
  );
}

function ProductStory({ block }) {
  return (
    <section className={`section section--${block.tone || 'ivory'} pdp-story`}>
      {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
      {block.heading ? <h2><Inline text={block.heading} /></h2> : null}
      {block.body ? <div className="pdp-story__body"><Paragraphs text={block.body} /></div> : null}
    </section>
  );
}

function RelatedProducts({ block, relatedProducts = [] }) {
  const items = relatedProducts.slice(0, Number(block.count) || 3);
  return (
    <section className={`section section--${block.tone || 'paper'} related`}>
      <div className="collection-head">
        <div>
          {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
          {block.heading ? <h2><Inline text={block.heading} /></h2> : null}
        </div>
      </div>
      <div className="product-grid product-grid--three">
        {items.map((item, index) => <ProductCard key={item.slug} product={item} index={index} />)}
      </div>
    </section>
  );
}

function CollectionHero({ block, resource: collection }) {
  if (!collection) return null;
  const image = block.image || collection.image;
  return (
    <section className="collection-hero">
      {image ? <Image
        src={asset(image)}
        alt={block.imageAlt || collection.name || ''}
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: block.imagePosition || collection.heroPosition || 'center 30%' }}
      /> : null}
      <div className="collection-hero__overlay" />
      <div className="collection-hero__content">
        <span className="eyebrow eyebrow--light">{block.eyebrow || 'Natural Diamonds · 14kt & 18kt Solid Gold'}</span>
        <h1>{block.heading || collection.name}</h1>
        {(block.body || collection.description || collection.note) ? <p className="collection-hero__desc">{block.body || collection.description || collection.note}</p> : null}
        <div className="collection-hero__badges">
          <span className="collection-badge">14KT &amp; 18KT SOLID GOLD</span>
          <span className="collection-badge">NATURAL DIAMONDS EXCLUSIVELY</span>
          <span className="collection-badge">BESPOKE CUSTOM AVAILABLE</span>
        </div>
      </div>
    </section>
  );
}

function CollectionProductGrid({ block, resource: collection, products = [] }) {
  if (!collection) return null;
  const productCount = products.length;
  return (
    <section className="section section--paper" style={{ paddingBottom: 0 }}>
      {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
      <div className="collection-filter">
        <span>{productCount} piece{productCount === 1 ? '' : 's'} currently online</span>
        <span className="collection-filter__purity">Fine natural diamond jewelry · Handcrafted in 14kt &amp; 18kt solid gold</span>
      </div>
      {productCount ? (
        <div className="product-grid product-grid--three">
          {products.map((product, index) => <ProductCard key={product.slug} product={product} index={index} />)}
        </div>
      ) : (
        <div className="empty-collection">
          <Image src="/icons/lotus-mulberry.svg" alt="" width={80} height={80} unoptimized />
          <h2>The online edit is arriving soon.</h2>
          <p>For pieces in this category, contact the atelier directly for current availability and custom design in solid 14kt or 18kt gold.</p>
          <Link className="button" href="/book-appointment">Ask the atelier</Link>
        </div>
      )}
    </section>
  );
}

function CollectionListGrid({ resource: collections = [] }) {
  if (!Array.isArray(collections)) return null;
  return (
    <section className="section section--paper">
      <div className="category-grid category-grid--index">
        {collections.map((collection, index) => (
          <Link href={`/collections/${collection.slug}`} className="category-card" key={collection.slug}>
            <div className="category-card__image">
              {collection.image ? <Image src={asset(collection.image)} alt={collection.name || ''} fill sizes="(max-width: 800px) 100vw, 50vw" style={focus(collection.imagePosition)} /> : null}
            </div>
            <div className="category-card__meta">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><h2>{collection.name}</h2><p>{collection.note}</p></div>
              <b aria-hidden="true">↗</b>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CollectionListSection({ block, collections = [], preview = false }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const selectedRefs = Array.isArray(block.collectionRefs) ? block.collectionRefs : [];
  const collectionBySlug = new Map((Array.isArray(collections) ? collections : []).map((collection) => [collection.slug, collection]));
  const visibleCollections = selectedRefs.map((collectionRef) => collectionBySlug.get(collectionRef)).filter(Boolean);
  const sectionBlocks = Array.isArray(block.blocks) ? block.blocks.filter((child) => child?.enabled !== false) : [];
  const headerBlock = sectionBlocks.find((child) => child.type === 'collectionListHeader');
  const headerTextBlocks = Array.isArray(headerBlock?.blocks) ? headerBlock.blocks.filter((child) => child?.enabled !== false && child.type === 'collectionListText') : [];
  const cardBlock = sectionBlocks.find((child) => child.type === 'collectionListCard');
  const cardBlocks = Array.isArray(cardBlock?.blocks) ? cardBlock.blocks.filter((child) => child?.enabled !== false) : [];
  const imageBlock = cardBlocks.find((child) => child.type === 'collectionListImage');
  const titleBlock = cardBlocks.find((child) => child.type === 'collectionListTitle');
  if (!visibleCollections.length && !preview) return null;
  if (!visibleCollections.length) return <section className="section section--paper collection-list-section collection-list-section--empty"><p>Choose published collections in the section settings to populate this list.</p></section>;
  const layout = ['grid', 'carousel', 'bento', 'editorial'].includes(settings.layout) ? settings.layout : 'grid';
  const width = settings.width === 'full' ? 'full' : 'page';
  const scheme = resolveColorSchemeSelection(settings.colorScheme || 'scheme1', 'scheme1');
  const sectionStyle = {
    paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop ?? 48)))}px`,
    paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom ?? 64)))}px`,
    background: schemeCssColor(scheme.number, 'base', 'background'),
    color: schemeCssColor(scheme.number, 'base', 'text'),
    '--collection-list-card-gap': `${Math.min(64, Math.max(0, Number(settings.cardGap ?? 12)))}px`,
    '--collection-list-section-gap': `${Math.min(96, Math.max(0, Number(settings.sectionGap ?? 12)))}px`,
    ...sectionSchemeStyle(scheme.number, 'collection-list-scheme'),
  };
  return (
    <section className={`section collection-list-section collection-list-section--${layout} collection-list-section--width-${width}${settings.mobileCarousel ? ' collection-list-section--mobile-carousel' : ''}`} style={sectionStyle}>
      <div className={`collection-list-section__inner${width === 'full' ? ' collection-list-section__inner--full' : ''}`}>
        {headerBlock ? <div className="collection-list-section__heading" data-collection-list-header={headerBlock.id} data-block-anchor={preview ? headerBlock.id : undefined}>
          {headerTextBlocks.map((textBlock) => <div className="collection-list-section__text" key={textBlock.id} data-block-anchor={preview ? textBlock.id : undefined}>
            {textBlock.heading ? <h2><Inline text={textBlock.heading} /></h2> : null}
            {textBlock.body ? <p>{textBlock.body}</p> : null}
          </div>)}
        </div> : (block.eyebrow || block.heading || block.body) ? <div className="collection-list-section__heading">
          {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
          {block.heading ? <h2><Inline text={block.heading} /></h2> : null}
          {block.body ? <p>{block.body}</p> : null}
        </div> : null}
        <div className={`category-grid category-grid--index collection-list-section__grid collection-list-section__grid--count-${Math.min(visibleCollections.length, 6)}`}>
          {visibleCollections.map((collection, index) => (
            <Link href={`/collections/${collection.slug}`} className="category-card collection-list-section__card" key={`${collection.slug}-${index}`} data-block-anchor={preview ? cardBlock?.id : undefined}>
              <div className="category-card__image collection-list-section__image" data-block-anchor={preview ? imageBlock?.id : undefined}>
                {(imageBlock?.image || collection.image) ? <Image src={asset(imageBlock?.image || collection.image)} alt={imageBlock?.imageAlt || collection.name || ''} fill sizes="(max-width: 800px) 100vw, 50vw" style={focus(imageBlock?.imagePosition || collection.imagePosition)} /> : null}
              </div>
              <div className="category-card__meta">
                <h3 data-block-anchor={preview ? titleBlock?.id : undefined}>{titleBlock?.heading || collection.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionBespokeBand({ block }) {
  const highlightedPhrase = '14kt or 18kt yellow, white, or rose gold';
  const phraseIndex = String(block.body || '').indexOf(highlightedPhrase);
  const body = phraseIndex >= 0 ? (
    <>{block.body.slice(0, phraseIndex)}<strong>{highlightedPhrase}</strong>{block.body.slice(phraseIndex + highlightedPhrase.length)}</>
  ) : block.body;
  return (
    <section className="section section--paper" style={{ paddingTop: 0 }}>
      <div className="collection-bespoke-band">
        <div className="collection-bespoke-band__inner">
          {block.eyebrow ? <span className="eyebrow">{block.eyebrow}</span> : null}
          {block.heading ? <h3><Inline text={block.heading} /></h3> : null}
          {block.body ? <p>{body}</p> : null}
          <div className="collection-bespoke-band__actions">
            {block.linkLabel ? <Link href={block.linkHref || '/custom'} className="button button--mulberry">{block.linkLabel}</Link> : null}
            {block.secondaryLinkLabel ? <Link href={block.secondaryLinkHref || '/book-appointment'} className="text-link" style={{ marginLeft: 20 }}>{block.secondaryLinkLabel}</Link> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomBand({ block }) {
  return (
    <section className="shop-custom-band section section--ivory">
      <div className="shop-custom-band__inner">
        <div className="shop-custom-band__content">
          <span className="eyebrow">{block.eyebrow}</span>
          <h2><Inline text={block.heading} /></h2>
          <Paragraphs text={block.body} />
          <div className="shop-custom-band__actions">
            {block.linkLabel ? <Link className="button" href={block.linkHref || '/custom'}>{block.linkLabel}</Link> : null}
            {block.secondaryLinkLabel ? <Link className="text-link" href={block.secondaryLinkHref || '/book-appointment'}>{block.secondaryLinkLabel}</Link> : null}
          </div>
        </div>
        <div className="shop-custom-band__image">
          {block.image ? <Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="(max-width: 860px) 100vw, 45vw" style={{ objectFit: 'cover', ...focus(block.imagePosition) }} /> : null}
        </div>
      </div>
    </section>
  );
}

function Divider({ block }) {
  const scheme = block.settings?.colorScheme;
  const color = scheme && scheme !== 'inherit' ? `var(--color-scheme-${String(scheme).replace(/^scheme/, '')}-base-borders, var(--line))` : 'var(--line)';
  const thickness = Math.max(1, Math.min(8, Number(block.settings?.thickness) || 1));
  const styleVariant = ['solid', 'dashed', 'dotted'].includes(block.settings?.style) ? block.settings.style : 'solid';
  const paddingTop = Math.max(0, Math.min(120, Number(block.settings?.paddingTop) || 16));
  const paddingBottom = Math.max(0, Math.min(120, Number(block.settings?.paddingBottom) || 16));
  return <hr className={`section-divider section-divider--${styleVariant}`} style={{ border: 'none', borderTop: `${thickness}px ${styleVariant} ${color}`, margin: 0, paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }} aria-hidden="true" />;
}

function CustomHtml({ block }) {
  const scope = customHtmlScope(block.id);
  const css = scopeCustomCss(block.css, scope);
  return (
    <section className={`custom-html custom-html--${block.layout === 'full' ? 'full' : 'contained'} ${scope}${toneClass(block.tone, '')}`}>
      {css ? <style>{css}</style> : null}
      {/* Cleaned by sanitize-html: no scripts, event handlers, or unsafe links. */}
      <div className="custom-html__inner" dangerouslySetInnerHTML={{ __html: sanitizeCustomHtml(block.html) }} />
    </section>
  );
}

function CustomLiquid({ block, resourceType, resource, preview, isRootSection }) {
  if (!isRootSection || !['product', 'collection'].includes(resourceType)) return null;
  const scope = customLiquidScope(block.id);
  const contentWidth = { default: '1180px', narrow: '44rem', standard: '68rem', wide: '84rem', full: 'none' }[block.design?.width || 'default'];
  const defaultVerticalSpacing = block.design?.spacing === undefined || block.design?.spacing === 'default'
    ? 'clamp(2.5rem, 5vw, 4rem)'
    : undefined;
  const sectionStyle = {
    '--custom-liquid-content-width': contentWidth,
    '--custom-liquid-horizontal-padding': block.design?.width === 'full' ? '0px' : 'max(1.25rem, 5vw)',
    ...(defaultVerticalSpacing ? { paddingBlock: defaultVerticalSpacing } : {}),
  };
  const customLiquidState = (() => {
    try {
      const html = renderCustomLiquid(block.liquid, resourceType, resource);
      return { ok: true, html };
    } catch (error) {
      const message = typeof error?.message === 'string' ? error.message.slice(0, 240) : 'Check the Liquid syntax and try again.';
      return { ok: false, message };
    }
  })();
  if (customLiquidState.ok) {
    return <section className={`custom-liquid ${scope}`} style={sectionStyle}><div className="custom-liquid__inner" dangerouslySetInnerHTML={{ __html: customLiquidState.html }} /></section>;
  }
  if (!preview) return null;
  return <section className={`custom-liquid ${scope} custom-liquid--error`} style={sectionStyle} role="alert"><strong>Custom Liquid preview error</strong><p>{customLiquidState.message}</p></section>;
}

function Testimonials({ block, testimonials }) {
  const items = testimonials || clientStories;
  const carousel = <TestimonialsCarousel items={items} eyebrow={block.eyebrow} title={block.heading} description={block.body} />;
  // The shop page uses its own spacing and no reveal animation.
  if (block.layout === 'collection') return <section className="testimonials testimonials--collection">{carousel}</section>;
  if (block.tone === 'mulberry') return <section className="testimonials testimonials--appointments testimonials--mulberry">{carousel}</section>;
  return <Reveal as="section" className="testimonials">{carousel}</Reveal>;
}

function FeaturedProducts({ block, products = [] }) {
  return (
    <Reveal as="section" className="section section--ivory featured-section">
      <div className="collection-head">
        <div>
          <span className="eyebrow">{block.eyebrow}</span>
          <h2><Inline text={block.heading} /></h2>
        </div>
        {block.body ? <p><Inline text={block.body} /></p> : null}
      </div>
      <div className="product-grid">
        {products.slice(0, Number(block.count) || 8).map((product, index) => <ProductCard key={product.slug} product={product} index={index} />)}
      </div>
      {block.linkLabel ? (
        <div className="featured-section__cta" style={{ textAlign: 'center', marginTop: 44 }}>
          <Link href={block.linkHref || '/shop'} className="button">{block.linkLabel}</Link>
        </div>
      ) : null}
    </Reveal>
  );
}

function FeaturedProduct({ block, products = [] }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const selectedProduct = settings.productSlug
    ? products.find((item) => item.slug === settings.productSlug)
    : products[0];
  const product = selectedProduct || null;
  if (!product) {
    const missingProduct = Boolean(settings.productSlug);
    return <section className="featured-product featured-product--empty" style={{ paddingBlock: `${Math.min(240, Math.max(0, Number(settings.paddingTop) || 0))}px ${Math.min(240, Math.max(0, Number(settings.paddingBottom) || 0))}px` }}><p>{missingProduct ? `The selected product “${settings.productSlug}” is no longer published. Choose another product in this section’s settings.` : 'No published products are available to feature yet.'}</p></section>;
  }
  const images = Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 4) : [];
  const galleryImages = images.length > 1 ? images.slice(0, 3) : images;
  const scheme = settings.colorScheme || 'ivory';
  const isThemeScheme = String(scheme).startsWith('scheme');
  const heading = String(settings.heading || product.shortTitle || product.title || '').trim();
  const description = String(product.description || '').trim().slice(0, 520);
  const price = product.saleMode === 'enquire' ? 'Enquire' : typeof product.price === 'number' ? `$${product.price.toLocaleString()}` : '';
  const sectionStyle = {
    paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop) || 0))}px`,
    paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom) || 0))}px`,
    ...(isThemeScheme ? sectionSchemeStyle(Number(scheme.replace('scheme', '')) || 1, 'featured-product-scheme') : {}),
  };
  const gallery = <div className={`featured-product__gallery featured-product__gallery--${settings.imageRatio === 'square' || settings.imageRatio === 'landscape' ? settings.imageRatio : 'portrait'}${galleryImages.length === 2 ? ' featured-product__gallery--two' : ''}`}>
    {galleryImages.length ? galleryImages.map((image, index) => <Link className={`featured-product__image${index === 0 ? ' featured-product__image--primary' : ''}`} href={`/shop/${product.slug}`} key={`${image}-${index}`} aria-label={`View ${product.shortTitle || product.title}`}>
      <Image src={image} alt={`${product.shortTitle || product.title}${index ? ` view ${index + 1}` : ''}`} fill priority={index === 0} sizes="(max-width: 760px) 100vw, 50vw" style={{ objectPosition: product.imagePositions?.[index] || 'center center' }} />
    </Link>) : <div className="featured-product__image featured-product__image--placeholder" role="img" aria-label={`${product.shortTitle || product.title} image unavailable`}><span>Product image coming soon</span></div>}
  </div>;
  const details = <div className="featured-product__details">
    {settings.eyebrow ? <span className="eyebrow">{settings.eyebrow}</span> : null}
    <h2>{heading}</h2>
    {product.metal || product.stone ? <p className="featured-product__attributes">{[product.metal, product.stone].filter(Boolean).join(' · ')}</p> : null}
    {price ? <p className="featured-product__price">{price}</p> : null}
    {settings.showDescription !== false && description ? <div className="featured-product__description"><Paragraphs text={description} /></div> : null}
    {settings.buttonLabel !== '' ? <Link href={`/shop/${product.slug}`} className="button">{settings.buttonLabel || 'View product'}</Link> : null}
  </div>;
  return <section className={`featured-product featured-product--${settings.layout === 'media-right' ? 'media-right' : 'media-left'} featured-product--${scheme}${isThemeScheme ? ' featured-product--theme-scheme' : ''}`} style={sectionStyle}>
    <div className="featured-product__inner">{settings.layout === 'media-right' ? <>{details}{gallery}</> : <>{gallery}{details}</>}</div>
  </section>;
}

function NotFoundSection({ block, children }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const width = { narrow: '40rem', standard: '68rem', wide: '84rem', full: '100%' }[settings.width] || '68rem';
  const height = { auto: 'auto', small: '24rem', medium: '36rem', large: '48rem', 'full-screen': '100svh' }[settings.height] || '24rem';
  const schemes = {
    ivory: { background: 'var(--ivory)', color: 'var(--ink)' },
    paper: { background: 'var(--paper)', color: 'var(--ink)' },
    olive: { background: 'var(--ink)', color: 'var(--ivory)' },
    mulberry: { background: 'var(--mulberry-dark)', color: 'var(--ivory)' },
  };
  const schemeSelection = resolveColorSchemeSelection(settings.colorScheme || 'paper', 'scheme1');
  const legacyScheme = schemes[schemeSelection.legacyValue];
  const isThemeScheme = !legacyScheme;
  const scheme = legacyScheme || {
    background: schemeCssColor(schemeSelection.number, 'base', 'background'),
    color: schemeCssColor(schemeSelection.number, 'base', 'text'),
  };
  const sectionStyle = {
    minHeight: height,
    paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop) || 0))}px`,
    paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom) || 0))}px`,
    background: scheme.background,
    color: scheme.color,
    textAlign: ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'center',
    justifyContent: settings.position === 'top' ? 'flex-start' : settings.position === 'bottom' ? 'flex-end' : 'center',
    '--not-found-content-width': width,
    '--not-found-gap': `${Math.min(160, Math.max(0, Number(settings.gap) || 0))}px`,
    ...(isThemeScheme ? sectionSchemeStyle(schemeSelection.number, 'not-found-scheme') : {}),
  };
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'center';
  return (
    <section className={`not-found-section not-found-section--align-${alignment}${isThemeScheme ? ' not-found-section--theme-scheme' : ''}`} style={sectionStyle}>
      <div className="not-found-section__content">{children}</div>
    </section>
  );
}

function NotFoundHeading({ block }) {
  return block.heading ? <h1 className="not-found-section__heading"><Inline text={block.heading} /></h1> : null;
}

function NotFoundText({ block }) {
  return block.body ? <div className="not-found-section__text"><Paragraphs text={block.body} /></div> : null;
}

function safeBlockHref(href) {
  const normalizedHref = String(href || '/shop').trim();
  return /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(normalizedHref) ? normalizedHref : '/shop';
}

function NotFoundButton({ block }) {
  return block.linkLabel ? <Link className="button not-found-section__button" href={safeBlockHref(block.linkHref)}>{block.linkLabel}</Link> : null;
}

function featuredCollectionBlockAnchor(block, preview) {
  return preview ? { 'data-block-anchor': block.id } : {};
}

function featuredCollectionCardStyle(block) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const schemes = {
    ivory: { background: 'var(--ivory)', color: 'var(--ink)' },
    paper: { background: 'var(--paper)', color: 'var(--ink)' },
    olive: { background: 'var(--ink)', color: 'var(--ivory)' },
    mulberry: { background: 'var(--mulberry-dark)', color: 'var(--ivory)' },
  };
  const colorSchemeValue = settings.colorScheme || 'inherit';
  const schemeSelection = resolveColorSchemeSelection(colorSchemeValue, 'scheme1');
  const legacyScheme = schemes[schemeSelection.legacyValue];
  const isThemeScheme = colorSchemeValue !== 'inherit' && !legacyScheme;
  const scheme = legacyScheme || (isThemeScheme ? {
    background: schemeCssColor(schemeSelection.number, 'base', 'background'),
    color: schemeCssColor(schemeSelection.number, 'base', 'text'),
  } : null);
  const boundedValue = (value, fallback, maximum) => Math.min(maximum, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallback));
  return {
    '--featured-card-gap': `${boundedValue(settings.verticalGap, 12, 120)}px`,
    '--featured-card-radius': `${boundedValue(settings.cornerRadius, 0, 100)}px`,
    '--featured-card-padding-top': `${boundedValue(settings.paddingTop, 0, 120)}px`,
    '--featured-card-padding-right': `${boundedValue(settings.paddingRight, 0, 120)}px`,
    '--featured-card-padding-bottom': `${boundedValue(settings.paddingBottom, 0, 120)}px`,
    '--featured-card-padding-left': `${boundedValue(settings.paddingLeft, 0, 120)}px`,
    ...(scheme ? { backgroundColor: scheme.background, color: scheme.color } : {}),
    ...(isThemeScheme ? sectionSchemeStyle(schemeSelection.number, 'featured-card-scheme') : {}),
    border: settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none',
  };
}

function featuredCollectionBoundedSetting(value, fallback = 0, maximum = 1200) {
  const numericValue = Number(value);
  return Math.min(maximum, Math.max(0, Number.isFinite(numericValue) ? numericValue : fallback));
}

function featuredCollectionPaddingStyle(settings = {}) {
  return {
    paddingTop: `${featuredCollectionBoundedSetting(settings.paddingTop)}px`,
    paddingRight: `${featuredCollectionBoundedSetting(settings.paddingRight)}px`,
    paddingBottom: `${featuredCollectionBoundedSetting(settings.paddingBottom)}px`,
    paddingLeft: `${featuredCollectionBoundedSetting(settings.paddingLeft)}px`,
  };
}

function featuredCollectionColorStyle(color) {
  const colors = { ink: 'var(--ink)', ivory: 'var(--ivory)', green: 'var(--olive)', mulberry: 'var(--mulberry)' };
  return colors[color] ? { color: colors[color] } : {};
}

function featuredCollectionBackgroundStyle(background) {
  const backgrounds = { ivory: 'var(--ivory)', paper: 'var(--paper)', green: 'var(--olive)', mulberry: 'var(--mulberry)' };
  return backgrounds[background] ? { backgroundColor: backgrounds[background] } : {};
}

function featuredCollectionTypographyStyle(preset) {
  const typographyPresets = {
    heading: { fontFamily: 'var(--serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.05 },
    subheading: { fontFamily: 'var(--serif)', fontSize: '16px', fontWeight: 400, lineHeight: 1.15 },
    body: { fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 400, lineHeight: 1.4 },
    caption: { fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 400, lineHeight: 1.3, letterSpacing: '.08em', textTransform: 'uppercase' },
  };
  return typographyPresets[preset] || typographyPresets.body;
}

function featuredCollectionTextBlockStyle(settings = {}) {
  const maximumWidth = featuredCollectionBoundedSetting(settings.maxWidth);
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  return {
    display: 'block',
    width: settings.width === 'fit' ? 'fit-content' : '100%',
    maxWidth: maximumWidth > 0 ? `${maximumWidth}px` : 'none',
    textAlign: alignment,
    justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[alignment],
    ...featuredCollectionTypographyStyle(settings.typographyPreset),
    ...featuredCollectionColorStyle(settings.color),
    ...featuredCollectionBackgroundStyle(settings.background),
    ...featuredCollectionPaddingStyle(settings),
  };
}

function featuredCollectionMediaStyle(settings = {}, ratio) {
  return {
    aspectRatio: ratio === 'auto' ? 'auto' : ({ portrait: '1 / 1.16', square: '1 / 1', landscape: '4 / 3' }[ratio] || '1 / 1.16'),
    border: settings.borderStyle === 'solid' ? '1px solid color-mix(in srgb, currentColor 30%, transparent)' : 'none',
    borderRadius: `${featuredCollectionBoundedSetting(settings.cornerRadius, 0, 100)}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...featuredCollectionPaddingStyle(settings),
  };
}

function FeaturedCollectionNode({ block, product, collectionTitle, collectionHref = '/shop', preview, index }) {
  if (!block || block.enabled === false) return null;
  const children = Array.isArray(block.blocks) ? block.blocks : [];
  const childNodes = children.map((child, childIndex) => <FeaturedCollectionNode key={child.id || `${block.id}-child-${childIndex}`} block={child} product={product} collectionTitle={collectionTitle} collectionHref={collectionHref} preview={preview} index={index} />);

  if (block.type === 'featuredCollectionHeader') {
    return <div className="featured-collection-section__heading" {...featuredCollectionBlockAnchor(block, preview)}>{childNodes}</div>;
  }
  if (block.type === 'featuredCollectionTitle') {
    const title = block.heading || collectionTitle;
    return title ? <h2 {...featuredCollectionBlockAnchor(block, preview)}><Inline text={title} /></h2> : null;
  }
  if (block.type === 'featuredCollectionButton') {
    return block.linkLabel ? <Link className="button" href={safeBlockHref(block.linkHref)} {...featuredCollectionBlockAnchor(block, preview)}>{block.linkLabel}</Link> : null;
  }
  if (block.type === 'featuredCollectionViewAll') {
    return <Link className="text-link" href={collectionHref} {...featuredCollectionBlockAnchor(block, preview)}>{block.linkLabel || 'View all'}</Link>;
  }
  if (block.type === 'featuredCollectionDivider') {
    return <hr className="featured-collection__divider" aria-hidden="true" {...featuredCollectionBlockAnchor(block, preview)} />;
  }
  if (block.type === 'featuredCollectionSpacer') {
    const height = Math.min(240, Math.max(0, Number.isFinite(Number(block.spacerHeight)) ? Number(block.spacerHeight) : 24));
    return <div className="featured-collection__spacer" style={{ height: `${height}px` }} aria-hidden="true" {...featuredCollectionBlockAnchor(block, preview)} />;
  }
  if (block.type === 'featuredCollectionProductCard') {
    return <FeaturedCollectionProductCard block={block} product={product} collectionHref={collectionHref} preview={preview} index={index} style={featuredCollectionCardStyle(block)} />;
  }
  if (block.type === 'featuredCollectionHeading') {
    return block.heading ? <h3 className="featured-collection__card-heading" {...featuredCollectionBlockAnchor(block, preview)}><Inline text={block.heading} /></h3> : null;
  }
  if (block.type === 'featuredCollectionImage') {
    if (!block.image) return null;
    return <div className="featured-collection__custom-image" {...featuredCollectionBlockAnchor(block, preview)}><Image src={asset(block.image)} alt={block.imageAlt || ''} fill sizes="(max-width: 700px) 100vw, 25vw" style={focus(block.imagePosition) || { objectFit: 'cover' }} /></div>;
  }
  if (block.type === 'featuredCollectionText') {
    return block.body ? <div className="featured-collection__card-text" {...featuredCollectionBlockAnchor(block, preview)}><Paragraphs text={block.body} /></div> : null;
  }
  if (block.type === 'featuredCollectionMedia') {
    const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
    const images = Array.isArray(product?.images) ? product.images : [];
    const primaryImage = images[0];
    if (!primaryImage) return null;
    const showSecondaryImage = settings.showSecondaryImage !== false && Boolean(images[1]);
    const ratio = settings.aspectRatio || 'auto';
    const imagePositions = Array.isArray(product.imagePositions) ? product.imagePositions : [];
    const useNaturalImageRatio = ratio === 'auto';
    return <Link className={`product-card__image featured-collection__media${useNaturalImageRatio ? ' featured-collection__media--auto' : ''}`} href={`/shop/${product.slug}`} style={featuredCollectionMediaStyle(settings, ratio)} {...featuredCollectionBlockAnchor(block, preview)}>
      {useNaturalImageRatio
        ? <Image className="product-card__image-primary" src={primaryImage} alt={product.shortTitle || product.title || ''} width={1} height={1} unoptimized style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', aspectRatio: 'auto', objectFit: 'cover', objectPosition: imagePositions[0] || 'center center' }} />
        : <Image className="product-card__image-primary" src={primaryImage} alt={product.shortTitle || product.title || ''} fill sizes="(max-width: 700px) 100vw, 25vw" style={{ objectPosition: imagePositions[0] || 'center center' }} />}
      {showSecondaryImage ? <Image className="product-card__image-hover" src={images[1]} alt={`${product.shortTitle || product.title || ''} alternate view`} fill sizes="(max-width: 700px) 100vw, 25vw" style={{ objectPosition: imagePositions[1] || 'center center' }} /> : null}
      {settings.showViewLink !== false ? <span>View piece</span> : null}
    </Link>;
  }
  if (block.type === 'featuredCollectionGroup') {
    return <GroupBlock block={block} preview={preview} className="product-card__meta" anchorProps={featuredCollectionBlockAnchor(block, preview)}>{childNodes}</GroupBlock>;
  }
  if (block.type === 'featuredCollectionProductTitle') {
    const title = product?.shortTitle || product?.title || '';
    const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
    return title ? <div className="featured-collection__product-title" style={featuredCollectionTextBlockStyle(settings)} {...featuredCollectionBlockAnchor(block, preview)}><p style={featuredCollectionTypographyStyle(settings.typographyPreset)}>{title}</p></div> : null;
  }
  return null;
}

function FeaturedCollection({ block, products = [], preview = false, blocks }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const sectionBlocks = Array.isArray(blocks) ? blocks : FEATURED_COLLECTION_DEFAULT_BLOCKS;
  const collectionHandle = settings.collectionHandle || block.collectionHandle || 'all';
  const matchingProducts = collectionHandle === 'all'
    ? products
    : products.filter((product) => product.category === collectionHandle);
  const visibleProducts = matchingProducts.slice(0, Math.min(24, Math.max(1, Number(settings.productCount ?? block.count) || 4)));
  if (!visibleProducts.length && !preview) return null;

  const columns = Math.min(6, Math.max(1, Number(settings.columns ?? block.columns) || 4));
  const mobileColumns = Math.min(2, Math.max(1, Number(settings.mobileColumns ?? block.mobileColumns) || 2));
  const horizontalGap = Math.min(100, Math.max(0, Number(settings.horizontalGap ?? block.horizontalGap) || 0));
  const verticalGap = Math.min(120, Math.max(0, Number(settings.verticalGap ?? block.verticalGap) || 0));
  const requestedLayout = settings.layout || block.layout || settings.type;
  const layout = ['grid', 'carousel', 'editorial'].includes(requestedLayout) ? requestedLayout : 'grid';
  const cardWidth = `calc(${100 / columns}% - ${horizontalGap * (columns - 1) / columns}px)`;
  const classNames = [
    'featured-collection',
    `featured-collection--${layout}`,
    layout === 'carousel' ? 'is-carousel' : '',
    (settings.mobileCarousel ?? block.mobileCarousel) ? 'has-mobile-carousel' : '',
  ].filter(Boolean).join(' ');
  const productListStyle = {
    '--featured-columns': columns,
    '--featured-mobile-columns': mobileColumns,
    '--featured-horizontal-gap': `${horizontalGap}px`,
    '--featured-vertical-gap': `${verticalGap}px`,
    '--featured-card-width': cardWidth,
  };
  const width = settings.width === 'full' ? '100%' : '80rem';
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  const schemes = {
    ivory: { background: 'var(--ivory)', color: 'var(--ink)' },
    paper: { background: 'var(--paper)', color: 'var(--ink)' },
    olive: { background: 'var(--ink)', color: 'var(--ivory)' },
    mulberry: { background: 'var(--mulberry-dark)', color: 'var(--ivory)' },
  };
  const schemeSelection = resolveColorSchemeSelection(settings.colorScheme || 'paper', 'scheme2');
  const legacyScheme = schemes[schemeSelection.legacyValue];
  const isThemeScheme = !legacyScheme;
  const scheme = legacyScheme || {
    background: schemeCssColor(schemeSelection.number, 'base', 'background'),
    color: schemeCssColor(schemeSelection.number, 'base', 'text'),
  };
  const sectionStyle = {
    paddingTop: `${Math.min(240, Math.max(0, Number(settings.paddingTop ?? 48)))}px`,
    paddingBottom: `${Math.min(240, Math.max(0, Number(settings.paddingBottom ?? 64)))}px`,
    background: scheme.background,
    color: scheme.color,
    textAlign: alignment,
    '--featured-section-gap': `${Math.min(160, Math.max(0, Number(settings.gap ?? 28)))}px`,
    ...(isThemeScheme ? sectionSchemeStyle(schemeSelection.number, 'featured-section-scheme') : {}),
  };
  const contentStyle = { maxWidth: width, marginInline: 'auto' };
  const collectionName = collectionHandle === 'all'
    ? 'All products'
    : collectionHandle.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
  const collectionTitle = settings.heading || block.heading || collectionName;

  return (
    <section className={`featured-collection-section${isThemeScheme ? ' featured-collection-section--theme-scheme' : ''}`} style={sectionStyle}>
      <div className="featured-collection-section__inner" style={contentStyle}>
        {sectionBlocks.map((sectionBlock, sectionIndex) => {
          if (sectionBlock.type === 'featuredCollectionHeader') {
            const collectionHref = collectionHandle === 'all' ? '/shop' : `/collections/${collectionHandle}`;
            return <FeaturedCollectionNode key={sectionBlock.id || `featured-header-${sectionIndex}`} block={sectionBlock} collectionTitle={collectionTitle} collectionHref={collectionHref} preview={preview} index={sectionIndex} />;
          }
          if (sectionBlock.type !== 'featuredCollectionProductCard') return null;
          const cardProducts = sectionBlock.settings?.repeating === false ? visibleProducts.slice(0, 1) : visibleProducts;
          const collectionHref = collectionHandle === 'all' ? '/shop' : `/collections/${collectionHandle}`;
          return <div className={classNames} style={productListStyle} key={sectionBlock.id || `featured-products-${sectionIndex}`}>
            {cardProducts.length ? cardProducts.map((product, index) => (
              <div className={`featured-collection__item${layout === 'editorial' && index === 0 ? ' is-editorial-lead' : ''}`} style={layout === 'editorial' && index === 0 ? { gridColumn: columns > 1 ? 'span 2' : 'span 1', gridRow: 'span 2' } : undefined} key={product.slug}>
                <FeaturedCollectionNode block={sectionBlock} product={product} collectionTitle={collectionTitle} collectionHref={collectionHref} preview={preview} index={index} />
              </div>
            )) : <p className="featured-collection__empty">Choose a collection with products to show here.</p>}
          </div>;
        })}
      </div>
    </section>
  );
}

function InquiryFormBlock({ block }) {
  return (
    <section className="section section--ivory">
      <div className="lead-page__form-section">
        <div className="lead-page__form-intro">
          <span className="eyebrow">{block.eyebrow}</span>
          <h2><Inline text={block.heading} /></h2>
          <Paragraphs text={block.body} />
        </div>
        <InquiryForm requestType="bespoke" />
      </div>
    </section>
  );
}

function EmailSignup({ block, preview = false }) {
  const tone = block.tone || 'ivory';
  const layout = block.layout === 'left' ? 'left' : 'centered';
  const headingId = `email-signup-${block.id}`;
  return (
    <section className={`section section--ivory email-signup-section email-signup-section--${layout}${toneClass(tone, 'ivory')}`} aria-labelledby={headingId}>
      <div className="email-signup-section__inner">
        <h2 id={headingId}><Inline text={block.heading || 'Subscribe to our emails'} /></h2>
        {block.body ? <div className="email-signup-section__description"><Paragraphs text={block.body} /></div> : null}
        <NewsletterForm placeholder="Email address" submitLabel={block.linkLabel || 'Sign up'} source="email-signup-section" preview={preview} />
      </div>
    </section>
  );
}

function PasswordLogo({ block, resource = {} }) {
  const logoSource = block.image || resource.logo || '';
  const logoAlt = block.imageAlt || (logoSource ? 'Store logo' : 'byShreen');
  if (logoSource) {
    const width = Math.min(320, Math.max(40, Number(resource.logoWidth) || 140));
    return <div className="password-logo"><Image src={asset(logoSource)} alt={logoAlt} width={width} height={88} unoptimized style={{ width: `${width}px`, height: 'auto', objectFit: 'contain' }} /></div>;
  }
  return <div className="password-logo password-logo--fallback" aria-label={logoAlt}><LotusMark className="password-logo__mark" /><span>byShreen</span></div>;
}

function PasswordText({ block }) {
  const style = block.settings?.style === 'heading' ? 'heading' : 'body';
  return style === 'heading'
    ? <h1 className="password-template__heading"><Inline text={block.body || ''} /></h1>
    : <p className="password-template__message"><Inline text={block.body || ''} /></p>;
}

function PasswordSection({ block, children }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const width = settings.width === 'full' ? 'full' : 'page';
  const group = {
    ...block,
    settings: {
      direction: 'vertical', alignment: 'center', position: 'center', gap: 12, colorScheme: 'scheme1', ...settings,
      widthMode: 'fill', heightMode: 'fit',
    },
  };
  return <>
    <GroupBlock block={group} className={`password-section password-section--${width}`}>{children}</GroupBlock>
  </>;
}

function PasswordFooter({ block, preview = false }) {
  const settings = block?.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const scheme = resolveColorSchemeSelection(settings.colorScheme || 'scheme1', 'scheme1');
  const footerStyle = {
    ...sectionSchemeStyle(scheme.number, 'password-footer-scheme'),
    backgroundColor: 'var(--password-footer-scheme-background)',
    color: 'var(--password-footer-scheme-text)',
  };

  return <>
    <footer className="password-template__footer password-template__footer--theme-scheme" style={footerStyle}>
      <p className="password-template__footer-credit">this shop will be powered by <span className="password-template__platform"><svg viewBox="0 0 18 20" fill="none" aria-hidden="true"><path d="M4.1 6.6h9.8l1.2 11.6H2.9L4.1 6.6Z" stroke="currentColor" strokeWidth="1.35"/><path d="M6.2 7V5a2.8 2.8 0 0 1 5.6 0v2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/><path d="M11.5 10.4c-.5-.5-2.2-.8-3.2-.1-.7.5-.5 1.4.3 1.7l1.6.6c1.4.5 1.5 1.5.5 2.2-.9.6-2.7.4-3.5-.3" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/></svg><strong>shopify</strong></span></p>
      <div className="password-template__footer-actions">
        <StorefrontPasswordUnlock preview={preview} />
        <span className="password-template__owner">are you the store owner? <Link href="/admin/login">log in here</Link></span>
      </div>
    </footer>
  </>;
}

function AppointmentForm({ block }) {
  return <AppointmentScheduler block={block} />;
}

function Instagram({ instagram }) {
  return (
    <Reveal as="div">
      <InstagramFeed feed={instagram || undefined} />
    </Reveal>
  );
}

function groupNumber(value, fallback, minimum, maximum) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(maximum, Math.max(minimum, numericValue));
}

function groupSize(mode, customValue, defaultMode, maximum) {
  const selectedMode = ['fit', 'fill', 'custom'].includes(mode) ? mode : defaultMode;
  if (selectedMode === 'fit') return 'fit-content';
  if (selectedMode === 'custom') return `${groupNumber(customValue, 480, 1, maximum)}px`;
  return '100%';
}

function safeGroupMediaSource(value) {
  const source = String(value || '').trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(source) ? source : '';
}

function safeGroupHref(value) {
  const href = String(value || '').trim();
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href) ? href : '';
}

function GroupBlock({ block, children, preview = false, className = '', anchorProps = {} }) {
  const settings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
  const layout = ['vertical', 'horizontal', 'grid'].includes(settings.direction)
    ? settings.direction
    : ['vertical', 'horizontal', 'grid'].includes(block.layout) ? block.layout : 'vertical';
  const legacyGap = block.groupGap === 'compact' ? 16 : block.groupGap === 'spacious' ? 64 : 40;
  const gap = groupNumber(settings.gap, legacyGap, 0, 160);
  const alignment = ['left', 'center', 'right'].includes(settings.alignment) ? settings.alignment : 'left';
  const position = ['top', 'center', 'bottom', 'space-between'].includes(settings.position) ? settings.position : 'top';
  const colorSchemeValue = settings.colorScheme || 'inherit';
  const schemeSelection = resolveColorSchemeSelection(colorSchemeValue, 'scheme1');
  const legacyGroupSchemes = ['ivory', 'paper', 'olive', 'mulberry'];
  const colorScheme = colorSchemeValue === 'inherit'
    ? 'inherit'
    : legacyGroupSchemes.includes(schemeSelection.legacyValue)
      ? schemeSelection.legacyValue
      : `scheme${schemeSelection.number}`;
  const isThemeScheme = colorScheme.startsWith('scheme');
  const borderStyle = settings.borderStyle === 'solid' ? 'solid' : 'none';
  const mediaMode = ['image', 'video'].includes(settings.backgroundMedia) ? settings.backgroundMedia : 'none';
  const backgroundImage = mediaMode === 'image' ? safeGroupMediaSource(settings.backgroundImage) : '';
  const backgroundVideo = mediaMode === 'video' ? safeGroupMediaSource(settings.backgroundVideo) : '';
  const overlayOpacity = groupNumber(settings.overlayOpacity, 0, 0, 100) / 100;
  const groupHref = preview ? '' : safeGroupHref(settings.link);
  const openInNewTab = Boolean(settings.openInNewTab && groupHref);
  const style = {
    '--block-group-gap': `${gap}px`,
    '--block-group-width': groupSize(settings.widthMode, settings.widthCustom, 'fill', 2400),
    '--block-group-mobile-width': groupSize(settings.mobileWidthMode, settings.mobileWidthCustom, 'fill', 1200),
    '--block-group-height': groupSize(settings.heightMode, settings.heightCustom, 'fit', 2400) === 'fit-content' ? 'auto' : groupSize(settings.heightMode, settings.heightCustom, 'fit', 2400),
    '--block-group-radius': `${groupNumber(settings.cornerRadius, 0, 0, 200)}px`,
    '--block-group-padding-top': `${groupNumber(settings.paddingTop, 0, 0, 200)}px`,
    '--block-group-padding-right': `${groupNumber(settings.paddingRight, 0, 0, 200)}px`,
    '--block-group-padding-bottom': `${groupNumber(settings.paddingBottom, 0, 0, 200)}px`,
    '--block-group-padding-left': `${groupNumber(settings.paddingLeft, 0, 0, 200)}px`,
    '--block-group-overlay-opacity': overlayOpacity,
    ...(backgroundImage ? { backgroundImage: `url("${backgroundImage.replace(/["\\\n\r]/g, '\\$&')}")` } : {}),
    ...(backgroundImage && settings.backgroundImagePosition ? { backgroundPosition: settings.backgroundImagePosition } : {}),
    ...(isThemeScheme ? sectionSchemeStyle(schemeSelection.number, 'block-group-scheme') : {}),
  };
  const groupClassName = [
    'block-group',
    className,
    `block-group--${layout}`,
    `block-group--align-${alignment}`,
    `block-group--position-${position}`,
    isThemeScheme ? 'block-group--theme-scheme' : `block-group--scheme-${colorScheme}`,
    `block-group--border-${borderStyle}`,
    backgroundVideo ? 'block-group--has-video' : '',
    groupHref ? 'block-group--linked' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClassName} style={style} {...anchorProps}>
      {backgroundVideo ? <video className="block-group__background-video" src={backgroundVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /> : null}
      {overlayOpacity > 0 && (backgroundImage || backgroundVideo) ? <span className="block-group__overlay" aria-hidden="true" /> : null}
      {groupHref ? <a className="block-group__link" href={groupHref} aria-label="Open grouped content" {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} /> : null}
      <div className="block-group__content">{children}</div>
    </div>
  );
}

const RENDERERS = {
  heroVideo: HeroVideo,
  heroImage: HeroImage,
  pageHeader: PageHeader,
  centeredText: CenteredText,
  splitText: SplitText,
  splitImage: SplitImage,
  imageCompare: ImageCompareSection,
  comparisonSlider: ComparisonSlider,
  storyChapter: StoryChapter,
  letter: Letter,
  quoteBand: QuoteBand,
  cta: Cta,
  closingBand: ClosingBand,
  imageCards: ImageCards,
  valuesBand: ValuesBand,
  standardsBand: StandardsBand,
  stepsList: StepsList,
  processTimeline: ProcessTimeline,
  processVideos: ProcessVideos,
  testimonials: Testimonials,
  guidanceSplit: GuidanceSplit,
  editorialFeature: EditorialFeature,
  listingHeader: ListingHeader,
  productGrid: ProductGrid,
  productInformation: ProductInformation,
  productStory: ProductStory,
  relatedProducts: RelatedProducts,
  collectionHero: CollectionHero,
  collectionProductGrid: CollectionProductGrid,
  collectionListGrid: CollectionListGrid,
  collectionListSection: CollectionListSection,
  blogPosts: BlogPosts,
  blogTitle: BlogTitle,
  blogPost: BlogPost,
  blogPostTitle: BlogPostTitle,
  blogPostDetails: BlogPostDetails,
  blogPostDescription: BlogPostDescription,
  blogPostImage: BlogPostImage,
  blogArticle: BlogArticle,
  blogArticleTitle: BlogArticleTitle,
  blogArticleDetails: BlogArticleDetails,
  blogArticleImage: BlogArticleImage,
  blogArticleExcerpt: BlogArticleExcerpt,
  blogArticleBody: BlogArticleBody,
  searchHeader: SearchHeader,
  searchResults: SearchResults,
  collectionBespokeBand: CollectionBespokeBand,
  divider: Divider,
  customBand: CustomBand,
  customHtml: CustomHtml,
  customLiquid: CustomLiquid,
  group: GroupBlock,
  featuredCollectionGroup: GroupBlock,
  proposalsGallery: ({ block, proposals }) => <ProposalsGallery proposals={proposals} tone={block.tone || 'paper'} eyebrow={block.eyebrow} title={block.heading} subtitle={block.body} />,
  featuredProducts: FeaturedProducts,
  featuredProduct: FeaturedProduct,
  inquiryForm: InquiryFormBlock,
  emailSignup: EmailSignup,
  passwordSection: PasswordSection,
  passwordLogo: PasswordLogo,
  passwordText: PasswordText,
  passwordFooter: PasswordFooter,
  appointmentForm: AppointmentForm,
  instagram: Instagram,
  notFound: NotFoundSection,
  featuredCollection: FeaturedCollection,
  heading: NotFoundHeading,
  text: NotFoundText,
  button: NotFoundButton,
};

export default function BlockRenderer({ blocks = [], products = [], collections = [], instagram = null, proposals = null, testimonials = null, blogPosts = null, catalog = null, preview = false, resourceType = '', resource = null, relatedProducts = [], productInfo = {}, contactEmail = '', focalPointBySource = {} }) {
  const safeFocalPointBySource = Object.fromEntries(Object.entries(focalPointBySource).flatMap(([source, point]) => {
    const focalPoint = normalizeMediaFocalPoint(point);
    return focalPoint ? [[source, focalPoint]] : [];
  }));
  return <RenderedBlocks blocks={applyMediaFocalPoints(blocks, safeFocalPointBySource)} products={applyMediaFocalPoints(products, safeFocalPointBySource)} collections={applyMediaFocalPoints(collections, safeFocalPointBySource)} instagram={applyMediaFocalPoints(instagram, safeFocalPointBySource)} proposals={applyMediaFocalPoints(proposals, safeFocalPointBySource)} testimonials={applyMediaFocalPoints(testimonials, safeFocalPointBySource)} blogPosts={applyMediaFocalPoints(blogPosts, safeFocalPointBySource)} catalog={applyMediaFocalPoints(catalog, safeFocalPointBySource)} preview={preview} resourceType={resourceType} resource={applyMediaFocalPoints(resource, safeFocalPointBySource)} relatedProducts={applyMediaFocalPoints(relatedProducts, safeFocalPointBySource)} productInfo={productInfo} contactEmail={contactEmail} />;
}

function RenderedBlocks({ blocks = [], products, collections, instagram, proposals, testimonials, blogPosts, catalog, preview, resourceType, resource, relatedProducts, productInfo, contactEmail, nestedLevel = 0 }) {
  return blocks.filter((block) => block.enabled !== false).map((block, index) => {
    const Renderer = RENDERERS[block.type];
    if (!Renderer) return null;
    const renderedBlock = blockSupportsResourceFieldSources(block, resourceType)
      ? blockWithResolvedDynamicFields(block, resource, resourceType)
      : block;
    const isFeaturedCollection = block.type === 'featuredCollection';
    const featureSettings = block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
    const hasCurrentFeaturedCollectionSchema = Number(featureSettings.blockSchemaVersion) >= 1;
    const featuredCollectionBlocks = Array.isArray(block.blocks) && (block.blocks.length > 0 || hasCurrentFeaturedCollectionSchema)
      ? block.blocks
      : FEATURED_COLLECTION_DEFAULT_BLOCKS;
    const canonicalHeroContent = (block.type === 'heroVideo' || block.type === 'heroImage') && heroContentSchemaIsCurrent(block);
    const renderedNestedBlocks = canonicalHeroContent
      ? (block.blocks || []).filter((childBlock) => !HERO_CONTENT_BLOCK_TYPES.has(childBlock?.type))
      : block.blocks;
    const blogSectionSettings = block.type === 'blogPosts' && block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {};
    const blogArticles = Array.isArray(resource?.articles) ? resource.articles : Array.isArray(blogPosts) ? blogPosts : [];
    const blogPostLimit = blogSectionSettings.postCount === undefined
      ? blogArticles.length
      : Math.min(12, Math.max(1, Number(blogSectionSettings.postCount) || 3));
    const blogLayout = ['grid', 'carousel', 'editorial'].includes(blogSectionSettings.layout) ? blogSectionSettings.layout : 'legacy-grid';
    const blockResource = block.type === 'blogPosts'
      ? {
        ...(resource || {}),
        handle: resource?.handle || 'news',
        previewMode: resource?.previewMode ?? preview,
        blogPostsLayout: blogLayout,
        articles: blogArticles.slice(0, blogPostLimit),
      }
      : resource;
    const nestedBlocks = !isFeaturedCollection && renderedNestedBlocks?.length
      ? <RenderedBlocks blocks={renderedNestedBlocks} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} blogPosts={blogPosts} catalog={catalog} preview={preview} resourceType={resourceType} resource={blockResource} relatedProducts={relatedProducts} productInfo={productInfo} contactEmail={contactEmail} nestedLevel={nestedLevel + 1} />
      : null;
    const repeatedArticleBlocks = block.type === 'blogPost' && Array.isArray(resource?.articles)
      ? resource.articles.map((article, articleIndex) => <article className={`blog-post-card${resource.blogPostsLayout !== 'legacy-grid' ? ' blog-post-card--image-first' : ''}${resource.blogPostsLayout === 'editorial' ? ` blog-post-card--editorial-${articleIndex % 3 === 0 ? 'left' : articleIndex % 3 === 1 ? 'right' : 'wide'}` : ''}`} key={article.id || article.handle || articleIndex}>
        <RenderedBlocks blocks={block.blocks || []} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} catalog={catalog} preview={preview} resourceType={resourceType} resource={{ ...resource, article }} relatedProducts={relatedProducts} productInfo={productInfo} contactEmail={contactEmail} nestedLevel={nestedLevel + 1} />
      </article>)
      : null;
    const renderedContent = isFeaturedCollection
      ? <Renderer block={renderedBlock} products={products} preview={preview} blocks={featuredCollectionBlocks} />
      : block.type === 'collectionListSection'
        ? <Renderer block={renderedBlock} collections={collections} preview={preview} />
      : block.type === 'blogPost'
        ? <Renderer block={renderedBlock} preview={preview} resource={resource}>{repeatedArticleBlocks}</Renderer>
      : block.type === 'imageCompare' || block.type === 'group' || block.type === 'featuredCollectionGroup' || block.type === 'notFound' || block.type === 'blogPosts' || block.type === 'blogArticle' || block.type === 'passwordSection'
        ? <Renderer block={renderedBlock} preview={preview} resource={blockResource} showEmptyState={block.type === 'blogPosts' && Array.isArray(blogPosts)}>{nestedBlocks}</Renderer>
      : canonicalHeroContent
        ? <><Renderer block={renderedBlock} products={products} instagram={instagram} proposals={proposals} testimonials={testimonials} catalog={catalog} first={index === 0} resourceType={resourceType} resource={resource} relatedProducts={relatedProducts} productInfo={productInfo} contactEmail={contactEmail} preview={preview} />{nestedBlocks}</>
      : <><Renderer block={renderedBlock} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} catalog={catalog} first={index === 0} resourceType={resourceType} resource={resource} relatedProducts={relatedProducts} productInfo={productInfo} contactEmail={contactEmail} preview={preview} isRootSection={nestedLevel === 0} />{nestedBlocks}</>;
    const hasRootSectionCss = nestedLevel === 0 && resourceType !== 'checkout' && block.type !== 'checkout';
    const sectionScope = hasRootSectionCss ? sectionCssScope(block.id) : '';
    const scopedSectionCss = hasRootSectionCss ? compileSectionCss(block.settings?.customCss, sectionScope) : '';
    return (
      <BlockSlot key={block.id} id={block.id} block={renderedBlock} preview={preview}>
        {hasRootSectionCss ? <>
          {scopedSectionCss ? <style>{scopedSectionCss}</style> : null}
          <div className={sectionScope} style={{ display: 'contents' }}>{renderedContent}</div>
        </> : renderedContent}
      </BlockSlot>
    );
  });
}

function BlockSlot({ id, block, preview, children, anchorOnContent = false }) {
  const design = block?.design || {};
  const maxWidths = { narrow: '44rem', standard: '68rem', wide: '84rem', full: '100%' };
  const verticalSpacing = { compact: '2.5rem', standard: '4rem', spacious: '6rem' };
  const backgrounds = { ivory: 'var(--ivory)', paper: 'var(--paper)', olive: 'var(--ink)', mulberry: 'var(--mulberry-dark)' };
  const hasCustomDesign = Object.entries(design).some(([key, value]) => value && value !== 'default');
  if (!hasCustomDesign && !preview) return children;
  if (!hasCustomDesign && preview && anchorOnContent) return children ? cloneElement(children, { 'data-block-anchor': id }) : null;
  if (!hasCustomDesign && preview) return <><span className="block-anchor" data-block-anchor={id} />{children}</>;
  return (
    <div className="block-slot" data-block-anchor={preview ? id : undefined} style={{ maxWidth: design.width === 'default' ? undefined : maxWidths[design.width], marginInline: design.width === 'default' ? undefined : 'auto', paddingBlock: design.spacing === 'default' ? undefined : verticalSpacing[design.spacing], textAlign: design.align === 'default' ? undefined : design.align, background: backgrounds[design.background] || undefined, '--content-heading-scale': design.headingSize === 'small' ? '.85' : design.headingSize === 'large' ? '1.2' : '1' }}>
      {children}
    </div>
  );
}
