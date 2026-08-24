import { Container, Row, Col } from 'react-bootstrap';
import { FaMinus, FaPlus, FaTrash, FaShoppingBasket } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../pages.css/order.css';
import useCart from '../hooks/useCart';
import { formatPrice } from '../utils/currency';

// رسوم ثابتة مؤقتًا. ستأتي من إعدادات المطعم عبر الـ API لاحقًا.
const DELIVERY_FEE = 10;
import useDocumentTitle from '../hooks/useDocumentTitle';

// صفحة السلة: تتيح تعديل الكميات وحذف الأطباق وإظهار إجمالي الطلب.
function Cart() {
  const { cart, addToCart, decrease, removeFromCart, clearCart, totalPrice } = useCart();

  useDocumentTitle('Your basket');
  //  إنهاء الطلب ثم تفريغ السلة.
  const finishOrder = () => {
    if (!cart.length) return;
    alert('Your order has been confirmed!');
    clearCart();
  };
  return (
    <>
      <section className="page-header">
        <div className="page-header-overlay" />
        <div className="container position-relative">
          <h1>Your Basket</h1>
          <p>Review your selections and complete your order.</p>
        </div>
      </section>

      <section className="section-padding">
        <Container>
          {!cart.length ? (
            <div className="empty-cart">
              <FaShoppingBasket className="empty-icon" />
              <h2>Your basket is empty</h2>
              <p>Discover the menu and choose something delicious.</p>
              <Link to="/menu" className="btn-primary-custom">
                Browse the menu
              </Link>
            </div>
          ) : (
            <Row className="g-4">
              <Col lg={8}>
                <div className="order-list">
                  {cart.map((item) => (
                    <div className="order-item" key={item.id}>
                      <img
                        src={item.image}
                        alt={item.name}
                        width={90}
                        height={75}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="order-info">
                        <h3>{item.name}</h3>
                        <p>{formatPrice(item.price)} each</p>
                      </div>
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
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove  from your order`}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </Col>
              <Col lg={4}>
                <div className="order-summary">
                  <h3>Order summary</h3>
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(totalPrice)}</strong>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <strong>{formatPrice(DELIVERY_FEE)}</strong>
                  </div>
                  <hr />
                  <div className="grand-total">
                    <span>Total</span>
                    <strong>{formatPrice(totalPrice + DELIVERY_FEE)}</strong>
                  </div>
                  <button onClick={finishOrder}>Confirm order</button>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </section>
    </>
  );
}
export default Cart;
