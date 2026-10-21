'use client';

import { useEffect } from 'react';
import { useCart } from '@/components/CartProvider';

/** Empties the bag once an order is confirmed (card payments return here from Stripe). */
export default function ClearBag() {
  const { loaded, clear } = useCart();
  useEffect(() => {
    if (!loaded) return;
    clear();
    try {
      window.sessionStorage.removeItem('byshreen-checkout-pending');
    } catch {
      // Nothing to clean up.
    }
  }, [loaded, clear]);
  return null;
}
