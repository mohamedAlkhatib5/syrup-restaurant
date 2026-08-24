import { useContext } from 'react';

import { CartContext } from '../context/cart-context';

/** الوصول إلى حالة السلة. يجب أن يكون المكوّن داخل <CartProvider>. */
export default function useCart() {
  const context = useContext(CartContext);

  if (context === null) {
    throw new Error('useCart must be used inside a <CartProvider>.');
  }

  return context;
}
