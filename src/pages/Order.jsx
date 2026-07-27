import { Container, Row, Col } from 'react-bootstrap'
import { FaMinus, FaPlus, FaTrash, FaShoppingBasket } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import '../pages.css/order.css';
// title
import { useCart } from '../context/CartContext'
import { useEffect } from 'react'


// صفحة السلة: تتيح تعديل الكميات وحذف الأطباق وإظهار إجمالي الطلب.
function Order() {
  const { cart, addToCart, decrease, removeFromCart, clearCart, totalPrice, setPageTitle } = useCart()

  // title
  useEffect(() => {
    setPageTitle('Order')
  }, [setPageTitle])
  // ***************
  //  إنهاء الطلب ثم تفريغ السلة.
  const finishOrder = () => { if (!cart.length) return; alert('Your order has been confirmed!'); clearCart() }
  return (<>

    <section className="page-header">
      <div className="page-header-overlay" />
      <div className="container position-relative">
        <h1>Your Order</h1>
        <p>Review your selections and complete your order.</p>
      </div>
    </section>




    <section className="section-padding">
      <Container>
        {!cart.length ?
          <div className="empty-cart">
            <FaShoppingBasket className="empty-icon" />
            <h2>Your basket is empty</h2>
            <p>Discover the menu and choose something delicious.</p>
            <Link to="/menu" className="btn-primary-custom">Browse the menu</Link>
          </div> : <Row className="g-4">
            <Col lg={8}>
              <div className="order-list">
                {cart.map(item => <div className="order-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="order-info">
                    <h3>{item.name}</h3>
                    <p>AED {item.price} each</p>
                  </div><div className="quantity">
                    <button onClick={() => decrease(item.id)}><FaMinus />
                    </button><span>{item.quantity}
                    </span><button onClick={() => addToCart(item)}>
                      <FaPlus />
                    </button>
                  </div>
                  <strong>AED {item.price * item.quantity}</strong>
                  <button className="delete-btn" onClick={() => removeFromCart(item.id)}>
                    <FaTrash />
                  </button>
                </div>)}</div>
            </Col>
            <Col lg={4}>
              <div className="order-summary">
                <h3>Order summary</h3>
                <div><span>Subtotal</span>
                  <strong>AED {totalPrice}</strong>
                </div>
                <div><span>Delivery</span><strong>AED 10</strong></div>
                <hr />
                <div className="grand-total">
                  <span>Total</span>
                  <strong>AED {totalPrice + 10}</strong>
                </div>
                <button onClick={finishOrder}>Confirm order</button>
              </div>
            </Col></Row>


        }
      </Container>
    </section>

  </>

  )
}
export default Order
