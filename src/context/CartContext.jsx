import { useCallback, useEffect, useMemo, useState } from 'react';

import { CartContext } from './cart-context';

/**
 * حالة السلة على مستوى التطبيق.
 *
 * السلة تُحفظ في localStorage حتى لا تضيع عند تحديث الصفحة،
 * وتتزامن بين تبويبات المتصفح المفتوحة على نفس الموقع.
 */

const STORAGE_KEY = 'syrup.cart.v1';

/** يقرأ السلة المحفوظة ويتجاهل أي بيانات تالفة بدل أن ينهار التطبيق. */
function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        item.id != null &&
        Number.isFinite(Number(item.price)) &&
        Number(item.quantity) > 0
    );
  } catch {
    // JSON تالف، أو localStorage محجوب (وضع التصفح الخاص) — نبدأ بسلة فارغة.
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readStoredCart);

  // حفظ السلة عند أي تغيير.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // الحصة ممتلئة أو التخزين محجوب — السلة تبقى في الذاكرة فقط.
    }
  }, [cart]);

  // مزامنة السلة بين التبويبات المفتوحة.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setCart(readStoredCart());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /** يضيف طبقًا، أو يزيد كميته إذا كان موجودًا في السلة. */
  const addToCart = useCallback((item) => {
    setCart((current) => {
      const existing = current.find((product) => product.id === item.id);

      if (existing) {
        return current.map((product) =>
          product.id === item.id
            ? { ...product, quantity: product.quantity + 1 }
            : product
        );
      }

      return [...current, { ...item, quantity: 1 }];
    });
  }, []);

  /** ينقص كمية طبق، ويحذفه إذا وصلت الكمية إلى صفر. */
  const decrease = useCallback((id) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      decrease,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [cart, addToCart, decrease, removeFromCart, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
