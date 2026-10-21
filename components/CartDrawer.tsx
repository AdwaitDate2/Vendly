'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import useCartMediaFocalPoints from './useCartMediaFocalPoints';
import { canonicalManagedImageSource, mediaFocalPointObjectPosition } from '@/lib/media-focal-points';

const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function cartImageStyle(item, focalPointBySource) {
  const objectPosition = item.imagePosition
    || mediaFocalPointObjectPosition(focalPointBySource[canonicalManagedImageSource(item.image)]);
  return objectPosition ? { objectPosition } : undefined;
}

export default function CartDrawer() {
  const { open, setOpen, items, remove, setQty, total } = useCart();
  const focalPointBySource = useCartMediaFocalPoints(items);
  return (
    <>
      <button aria-label="Close cart overlay" className={`cart-overlay ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="cart-drawer__head">
          <span className="eyebrow">Your selection</span>
          <button className="icon-button" aria-label="Close cart" onClick={() => setOpen(false)}>×</button>
        </div>
        {items.length === 0 ? (
          <div className="cart-empty">
            <Image src="/icons/lotus-mulberry.svg" alt="" width={80} height={80} unoptimized />
            <h3>Your bag is waiting.</h3>
            <p>Discover pieces designed to become part of your story.</p>
          </div>
        ) : (
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={item.key}>
                <div className="cart-item__image">
                  {item.image ? <Image src={item.image} alt={item.shortTitle} fill sizes="96px" style={cartImageStyle(item, focalPointBySource)} /> : null}
                </div>
                <div>
                  <Link href={`/shop/${item.slug}`} onClick={() => setOpen(false)}>{item.shortTitle}</Link>
                  <p className="cart-item__meta">{[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · ')}</p>
                  <div className="cart-item__qty">
                    <button type="button" aria-label={`Decrease quantity of ${item.shortTitle}`} onClick={() => setQty(item.key, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                    <span aria-live="polite">{item.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${item.shortTitle}`} onClick={() => setQty(item.key, item.qty + 1)}>+</button>
                    <span className="cart-item__price">{money(item.price * item.qty)}</span>
                  </div>
                  <button type="button" onClick={() => remove(item.key)}>Remove</button>
                </div>
              </div>
            ))}
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <p className="cart-free-shipping">Free shipping on all orders</p>
            <Link href="/cart" className="button button--full" onClick={() => setOpen(false)}>View full bag</Link>
            <Link href="/checkout" className="button button--full" onClick={() => setOpen(false)}>Checkout</Link>
            <p className="cart-note">Taxes are calculated at checkout. Every piece is made to order in 5–7 weeks.</p>
          </div>
        )}
      </aside>
    </>
  );
}
