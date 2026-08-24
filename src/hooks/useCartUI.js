import { useContext } from 'react';

import { CartUIContext } from '../context/cart-ui-context';

export default function useCartUI() {
  const context = useContext(CartUIContext);

  if (context === null) {
    throw new Error('useCartUI must be used inside a <CartUIProvider>.');
  }

  return context;
}
