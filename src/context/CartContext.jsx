import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zuparo_cart') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('zuparo_cart', JSON.stringify(cart)); }, [cart]);

  const add = (item) => setCart((prev) => {
    const idx = prev.findIndex((c) => c.id === item.id);
    if (idx >= 0) { const copy = [...prev]; copy[idx].qty += 1; return copy; }
    return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
  });
  const setQty = (id, qty) => setCart((prev) => prev.map((c) => c.id === id ? { ...c, qty: Math.max(1, qty) } : c));
  const remove = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const clear = () => setCart([]);
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  return <CartContext.Provider value={{ cart, add, setQty, remove, clear, subtotal, count }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
