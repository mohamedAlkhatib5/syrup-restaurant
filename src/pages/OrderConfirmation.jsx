import { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import {
  FaCheck,
  FaCreditCard,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaStore,
} from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';

import { RESTAURANT } from '../api/settings';
import { getOrderByNumber } from '../api/orders';
import RouteFallback from '../components/RouteFallback';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/currency';
import '../pages.css/checkout.css';

const STATUS_STEPS = [
  { id: 'pending', label: 'Received' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'completed', label: 'Delivered' },
];

function OrderConfirmation() {
  const { orderNumber } = useParams();
  useDocumentTitle('Order ' + orderNumber);

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getOrderByNumber(orderNumber)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch(() => {
        if (active) setError('We could not find an order with that reference.');
      });

    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (error) {
    return (
      <section className="section-padding">
        <Container className="text-center">
          <h1 className="display-title">Order not found</h1>
          <p className="text-muted">{error}</p>
          <Link to="/menu" className="btn-primary-custom">
            Browse the menu
          </Link>
        </Container>
      </section>
    );
  }

  if (!order) return <RouteFallback />;

  const isDelivery = order.fulfilment === 'delivery';
  const activeStep = STATUS_STEPS.findIndex((step) => step.id === order.status);
  const currentStep = activeStep === -1 ? 0 : activeStep;

  const steps = isDelivery
    ? STATUS_STEPS
    : STATUS_STEPS.map((step) =>
        step.id === 'on_the_way'
          ? { ...step, label: 'Ready' }
          : step.id === 'completed'
            ? { ...step, label: 'Collected' }
            : step
      );

  return (
    <section className="section-padding order-confirmation">
      <Container>
        <div className="confirmation-hero" data-aos="fade-up">
          <span className="confirmation-tick" aria-hidden="true">
            <FaCheck />
          </span>

          <h1>Thank you, {order.customer.fullName.split(' ')[0]}!</h1>
          <p>Your order is with our kitchen.</p>

          <p className="confirmation-reference">
            Reference <strong>{order.orderNumber}</strong>
          </p>

          {order.customer.email && (
            <p className="confirmation-email">
              A receipt is on its way to {order.customer.email}
            </p>
          )}
        </div>

        <ol className="order-progress" aria-label="Order progress">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={index <= currentStep ? 'is-done' : ''}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <span className="order-progress-dot" aria-hidden="true" />
              <span className="order-progress-label">{step.label}</span>
            </li>
          ))}
        </ol>

        <Row className="g-4 mt-2">
          <Col lg={7}>
            <div className="confirmation-card">
              <h2>Your items</h2>

              <ul className="confirmation-items">
                {order.items.map((item) => (
                  <li key={item.menuItemId}>
                    <img
                      src={item.image}
                      alt={item.name}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity} &times; {formatPrice(item.unitPrice)}
                      </span>
                    </div>
                    <b>{formatPrice(item.lineTotal)}</b>
                  </li>
                ))}
              </ul>

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(order.subtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>{isDelivery ? 'Delivery' : 'Pick up'}</span>
                <strong>
                  {order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}
                </strong>
              </div>

              <hr />

              <div className="summary-line summary-total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>

              {order.notes && (
                <p className="confirmation-notes">
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>
          </Col>

          <Col lg={5}>
            <div className="confirmation-card">
              <h2>{isDelivery ? 'Delivering to' : 'Collect from'}</h2>

              <p className="confirmation-detail">
                {isDelivery ? (
                  <FaMapMarkerAlt aria-hidden="true" />
                ) : (
                  <FaStore aria-hidden="true" />
                )}
                <span>{isDelivery ? order.address.line : RESTAURANT.addressLine}</span>
              </p>

              {isDelivery && order.address.notes && (
                <p className="confirmation-detail confirmation-detail-muted">
                  <span>{order.address.notes}</span>
                </p>
              )}

              <p className="confirmation-detail">
                <FaPhoneAlt aria-hidden="true" />
                <span>{order.customer.phone}</span>
              </p>

              <p className="confirmation-detail">
                {order.paymentMethod === 'card' ? (
                  <FaCreditCard aria-hidden="true" />
                ) : (
                  <FaMoneyBillWave aria-hidden="true" />
                )}
                <span>
                  {order.paymentMethod === 'card'
                    ? 'Paid by card'
                    : 'Cash on ' + (isDelivery ? 'delivery' : 'collection')}
                </span>
              </p>

              <p className="confirmation-detail">
                <span className="confirmation-when">
                  {order.scheduledFor === 'asap'
                    ? 'As soon as possible'
                    : 'Scheduled for ' + order.scheduledFor}
                </span>
              </p>

              <Link to="/menu" className="btn-primary-custom w-100 mt-3">
                Order something else
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default OrderConfirmation;
