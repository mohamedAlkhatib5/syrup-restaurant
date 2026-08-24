import { useCallback, useMemo, useState } from 'react';

import { CartUIContext } from './cart-ui-context';

/**
 * حالة واجهة السلة (فتح/إغلاق الدرج).
 *
 * منفصلة عن CartProvider عمدًا: تبديل الدرج لا يجب أن يُعيد رسم
 * كل بطاقة طبق تشترك في بيانات السلة.
 */
export function CartUIProvider({ children }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({ isDrawerOpen, openDrawer, closeDrawer }),
    [isDrawerOpen, openDrawer, closeDrawer]
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}
