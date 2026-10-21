'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'byshreen-bag-v2';
const MAX_QTY = 10;

export function cartKey(item) {
  return [item.slug, item.variantId || 'default', item.size || ''].join(':');
}

function loadItems() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item?.slug && item.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Restored after mount so the server-rendered bag count matches the first client render.
    setItems(loadItems());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable (private mode); the bag still works for this visit.
    }
  }, [items, loaded]);

  const add = useCallback((product) => {
    const key = cartKey(product);
    const requestedQuantity = Math.max(1, Math.min(MAX_QTY, Number(product.qty) || 1));
    setItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => (item.key === key ? { ...item, qty: Math.min(MAX_QTY, item.qty + requestedQuantity) } : item));
      return [...current, { ...product, key, qty: requestedQuantity }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((key) => setItems((current) => current.filter((item) => item.key !== key)), []);
  const setQty = useCallback((key, qty) => setItems((current) => current.map((item) => (item.key === key ? { ...item, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : item))), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const value = useMemo(() => ({ items, open, setOpen, add, remove, setQty, clear, count, total, loaded }), [items, open, add, remove, setQty, clear, count, total, loaded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
