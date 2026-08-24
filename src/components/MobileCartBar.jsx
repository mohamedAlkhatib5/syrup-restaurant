import { useLocation } from 'react-router-dom';

import useCart from '../hooks/useCart';
import useCartUI from '../hooks/useCartUI';
import { formatPrice } from '../utils/currency';

const HIDDEN_ON = ['/cart', '/checkout'];

/** شريط سفلي ثابت على الهاتف يعرض السلة ويفتح الدرج. */
function MobileCartBar() {
  const { totalItems, totalPrice } = useCart();
  const { openDrawer } = useCartUI();
  const { pathname } = useLocation();

  if (totalItems === 0) return null;
  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  return (
    <button type="button" className="mobile-cart-bar" onClick={openDrawer}>
      <span className="mobile-cart-count">{totalItems}</span>
      <span className="mobile-cart-label">
        {totalItems === 1 ? '1 item' : `${totalItems} items`} · {formatPrice(totalPrice)}
      </span>
      <span className="mobile-cart-cta">View basket</span>
    </button>
  );
}

export default MobileCartBar;
