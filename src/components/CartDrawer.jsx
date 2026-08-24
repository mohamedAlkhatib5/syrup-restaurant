import { Offcanvas } from 'react-bootstrap';
import { FaMinus, FaPlus, FaShoppingBasket, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import useCart from '../hooks/useCart';
import useCartUI from '../hooks/useCartUI';
import { formatPrice } from '../utils/currency';

/**
 * درج السلة الجانبي.
 *
 * يفتح فوق الصفحة الحالية حتى لا ينقطع تصفّح الزبون للقائمة.
 */
function CartDrawer() {
  const { cart, addToCart, decrease, removeFromCart, totalItems, totalPrice } = useCart();
  const { isDrawerOpen, closeDrawer } = useCartUI();

  return (
    <Offcanvas
      show={isDrawerOpen}
      onHide={closeDrawer}
      placement="end"
      className="cart-drawer"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          Your basket
          {totalItems > 0 ? (
            <span className="cart-drawer-count">{totalItems}</span>
          ) : null}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {cart.length === 0 ? (
          <div className="cart-drawer-empty">
            <FaShoppingBasket aria-hidden="true" />
            <p>Your basket is empty.</p>
            <Link to="/menu" className="btn-primary-custom" onClick={closeDrawer}>
              Browse the menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer-list">
              {cart.map((item) => (
                <li key={item.id} className="cart-drawer-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="cart-drawer-info">
                    <h3>{item.name}</h3>
                    <p>{formatPrice(item.price)}</p>
                  </div>

                  <div className="cart-drawer-actions">
                    <div className="quantity">
                      <button
                        type="button"
                        onClick={() => decrease(item.id)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <FaMinus aria-hidden="true" />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <FaPlus aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from your basket`}
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer-footer">
              <div className="cart-drawer-total">
                <span>Subtotal</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>

              <p className="cart-drawer-note">
                Delivery and totals are confirmed at checkout.
              </p>

              <Link to="/cart" className="btn-primary-custom w-100" onClick={closeDrawer}>
                Review order
              </Link>

              <Link to="/checkout" className="cart-drawer-link" onClick={closeDrawer}>
                Go straight to checkout →
              </Link>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default CartDrawer;
