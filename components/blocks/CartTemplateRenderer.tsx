'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { isPurchasable } from '@/lib/product-variants';
import { applyMediaFocalPoints, canonicalManagedImageSource, mediaFocalPointObjectPosition } from '@/lib/media-focal-points';
import BlockRenderer from './BlockRenderer';
import useCartMediaFocalPoints from '@/components/useCartMediaFocalPoints';
import styles from './CartTemplateRenderer.module.css';

const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function cartImageStyle(item, focalPointBySource) {
  const objectPosition = item.imagePosition
    || mediaFocalPointObjectPosition(focalPointBySource[canonicalManagedImageSource(item.image)]);
  return objectPosition ? { objectPosition } : undefined;
}

function CartItemsSection({ section, focalPointBySource }) {
  const { items, loaded, remove, setQty } = useCart();
  const itemCount = items.reduce((count, item) => count + item.qty, 0);

  return (
    <section className={`${styles.section} ${styles.items}`}>
      <div className={styles.sectionHeading}>
        <div>
          <h1>{section.heading || 'Your bag.'}</h1>
          {section.body ? <p>{section.body}</p> : null}
        </div>
        {loaded && items.length ? <span className={styles.count}>{itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</span> : null}
      </div>
      {!loaded ? <p className={styles.loading} role="status">Loading your bag…</p> : items.length ? (
        <ul className={styles.itemList}>
          {items.map((item) => (
            <li className={styles.item} key={item.key}>
              <Link className={styles.itemImage} href={`/shop/${item.slug}`} aria-label={`View ${item.shortTitle || item.title}`}>
                {item.image ? <Image src={item.image} alt="" fill sizes="96px" unoptimized style={cartImageStyle(item, focalPointBySource)} /> : <span aria-hidden="true">byShreen</span>}
              </Link>
              <div className={styles.itemDetails}>
                <Link className={styles.itemTitle} href={`/shop/${item.slug}`}>{item.shortTitle || item.title}</Link>
                {[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).length ? (
                  <p className={styles.itemMeta}>{[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · ')}</p>
                ) : null}
                <div className={styles.itemActions}>
                  <div className={styles.quantity} role="group" aria-label={`Quantity for ${item.shortTitle || item.title}`}>
                    <button type="button" aria-label={`Decrease quantity of ${item.shortTitle || item.title}`} onClick={() => setQty(item.key, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                    <span aria-live="polite">{item.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${item.shortTitle || item.title}`} onClick={() => setQty(item.key, item.qty + 1)} disabled={item.qty >= 10}>+</button>
                  </div>
                  <button className={styles.remove} type="button" onClick={() => remove(item.key)}>Remove</button>
                </div>
              </div>
              <strong className={styles.lineTotal}>{money(item.price * item.qty)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true">✳</span>
          <h2>Your bag is waiting.</h2>
          <p>Discover pieces designed to become part of your story.</p>
          <Link className={styles.textLink} href={section.linkHref || '/shop'}>{section.linkLabel || 'Explore the collection'} <span aria-hidden="true">→</span></Link>
        </div>
      )}
      {loaded && items.length && section.linkLabel ? <Link className={styles.continueLink} href={section.linkHref || '/shop'}>← {section.linkLabel}</Link> : null}
    </section>
  );
}

function CartSummarySection({ section }) {
  const { items, loaded, total } = useCart();
  const itemCount = items.reduce((count, item) => count + item.qty, 0);

  return (
    <aside className={`${styles.section} ${styles.summary}`} aria-label="Order summary">
      <h2>{section.heading || 'Order summary'}</h2>
      <div className={styles.subtotal}><span>Subtotal · {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</span><strong>{money(total)}</strong></div>
      {section.body ? <p className={styles.summaryNote}>{section.body}</p> : null}
      {loaded && items.length ? (
        <Link className={styles.checkoutButton} href={section.linkHref || '/checkout'}>{section.linkLabel || 'Checkout'} <span aria-hidden="true">→</span></Link>
      ) : (
        <button className={styles.checkoutButton} type="button" disabled>{section.linkLabel || 'Checkout'}</button>
      )}
      <p className={styles.secureNote}>Your order is prepared with care. Payment and delivery details are confirmed at checkout.</p>
    </aside>
  );
}

function RecommendationCard({ product }) {
  const { add } = useCart();
  const variant = (product.variants || []).find((option) => option.active !== false);
  const canAddDirectly = !product.sizeOption?.enabled && isPurchasable(product, variant);
  const productTitle = product.shortTitle || product.title;

  function addToBag() {
    if (!canAddDirectly) return;
    add({
      productId: product.id || product.slug,
      slug: product.slug,
      title: product.title,
      shortTitle: productTitle,
      image: product.images?.[0] || '',
      variantId: variant.id,
      variantTitle: variant.title,
      size: '',
      imagePosition: product.imagePositions?.[0] || '',
      price: variant.price,
      qty: 1,
    });
  }

  return (
    <article className={styles.recommendation}>
      <Link className={styles.recommendationImage} href={`/shop/${product.slug}`}>
        {product.images?.[0] ? <Image src={product.images[0]} alt={productTitle} fill sizes="(max-width: 640px) 50vw, 25vw" unoptimized style={product.imagePositions?.[0] ? { objectPosition: product.imagePositions[0] } : undefined} /> : null}
        <span>View piece</span>
      </Link>
      <div className={styles.recommendationDetails}>
        <div><Link className={styles.recommendationTitle} href={`/shop/${product.slug}`}>{productTitle}</Link><span>{product.metal}</span></div>
        <strong>{product.saleMode === 'enquire' ? 'Enquire' : money(variant?.price ?? product.price)}</strong>
      </div>
      {canAddDirectly ? <button className={styles.addButton} type="button" onClick={addToBag}>Add to bag</button> : <Link className={styles.addButton} href={`/shop/${product.slug}`}>{product.sizeOption?.enabled ? 'Choose a size' : 'View piece'}</Link>}
    </article>
  );
}

function CartRecommendationsSection({ section, products, items }) {
  const cartSlugs = new Set(items.map((item) => item.slug));
  const recommendations = products
    .filter((product) => (!product.status || product.status === 'published') && product.saleMode !== 'enquire' && !cartSlugs.has(product.slug))
    .slice(0, Math.max(1, Number(section.count) || 3));

  return (
    <section className={`${styles.section} ${styles.recommendations}`}>
      <div className={styles.recommendationHeading}>
        <div>{section.eyebrow ? <span>{section.eyebrow}</span> : null}<h2>{section.heading || 'You may also like.'}</h2></div>
      </div>
      {recommendations.length ? <div className={styles.recommendationGrid}>{recommendations.map((product) => <RecommendationCard key={product.slug} product={product} />)}</div> : <p className={styles.noRecommendations}>More considered pieces will be here soon.</p>}
    </section>
  );
}

export default function CartTemplateRenderer({ sections = [], products = [], preview = false, focalPointBySource: initialFocalPointBySource = {} }) {
  const { items } = useCart();
  const cartFocalPointBySource = useCartMediaFocalPoints(items);
  const focalPointBySource = { ...cartFocalPointBySource, ...initialFocalPointBySource };
  const focusedProducts = applyMediaFocalPoints(products, focalPointBySource);
  const enabledSections = sections.filter((section) => section.enabled !== false && section.type);

  return (
    <div className={styles.template}>
      <div className={styles.layout}>
        {enabledSections.map((section) => {
          const anchorProps = preview ? { 'data-block-anchor': section.id } : {};
          if (section.type === 'cartItems') return <div className={styles.itemsSlot} key={section.id} {...anchorProps}><CartItemsSection section={section} focalPointBySource={focalPointBySource} /></div>;
          if (section.type === 'cartSummary') return <div className={styles.summarySlot} key={section.id} {...anchorProps}><CartSummarySection section={section} /></div>;
          if (section.type === 'cartRecommendations') return <div className={styles.recommendationsSlot} key={section.id} {...anchorProps}><CartRecommendationsSection section={section} products={focusedProducts} items={items} /></div>;
          return <div className={styles.genericSlot} key={section.id} {...anchorProps}><BlockRenderer blocks={[section]} focalPointBySource={focalPointBySource} preview={preview} /></div>;
        })}
      </div>
    </div>
  );
}
