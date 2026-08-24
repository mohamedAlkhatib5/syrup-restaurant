import { useMemo, useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import {
  FaCreditCard,
  FaLock,
  FaMoneyBillWave,
  FaMotorcycle,
  FaStore,
} from 'react-icons/fa';
import { Navigate, useNavigate } from 'react-router-dom';

import { DEFAULT_SETTINGS, RESTAURANT } from '../api/config';
import { createOrder } from '../api/orders';
import { authorizeCard, detectCardBrand } from '../api/payments';
import AddressMap from '../components/AddressMap';
import useCart from '../hooks/useCart';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useToast from '../hooks/useToast';
import { formatPrice } from '../utils/currency';
import '../pages.css/checkout.css';

const TIME_SLOTS = [
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
];

const FULFILMENT_OPTIONS = [
  { id: 'delivery', icon: FaMotorcycle, title: 'Delivery' },
  { id: 'pickup', icon: FaStore, title: 'Pick up' },
];

const PAYMENT_OPTIONS = [
  { id: 'cash', icon: FaMoneyBillWave, title: 'Cash' },
  { id: 'card', icon: FaCreditCard, title: 'Card' },
];

function groupCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : digits.slice(0, 2) + '/' + digits.slice(2);
}

function Checkout() {
  useDocumentTitle('Checkout');

  const { cart, totalPrice, clearCart } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [fulfilment, setFulfilment] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [timing, setTiming] = useState('asap');
  const [position, setPosition] = useState(RESTAURANT.location);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine: '',
    addressNotes: '',
    slot: TIME_SLOTS[0],
    notes: '',
    cardHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const isDelivery = fulfilment === 'delivery';
  const deliveryFee = isDelivery ? DEFAULT_SETTINGS.deliveryFee : 0;
  const total = totalPrice + deliveryFee;
  const cardBrand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber]);

  const waitRange = isDelivery
    ? DEFAULT_SETTINGS.estimatedDeliveryMinutes
    : DEFAULT_SETTINGS.estimatedPickupMinutes;

  const setField = (name) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const setCardField = (name, transform) => (event) => {
    const value = transform(event.target.value);
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const next = {};

    if (!form.fullName.trim()) {
      next.fullName = 'Please tell us your name.';
    }

    if (!/^\+?[\d\s-]{7,}$/.test(form.phone.trim())) {
      next.phone = 'Enter a reachable phone number.';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'That email address is not valid.';
    }

    if (isDelivery && form.addressLine.trim().length < 6) {
      next.addressLine = 'Add your building, street and area.';
    }

    if (paymentMethod === 'card') {
      if (!form.cardHolder.trim()) next.cardHolder = 'Enter the name on the card.';
      if (!form.cardNumber.trim()) next.cardNumber = 'Enter your card number.';
      if (!form.cardExpiry.trim()) next.cardExpiry = 'Enter the expiry date.';
      if (!form.cardCvc.trim()) next.cardCvc = 'Enter the security code.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      notify({
        title: 'Please check the form',
        body: 'Some details are still missing.',
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);

    try {
      let payment = null;

      if (paymentMethod === 'card') {
        payment = await authorizeCard({
          number: form.cardNumber,
          expiry: form.cardExpiry,
          cvc: form.cardCvc,
          holder: form.cardHolder,
        });
      }

      const order = await createOrder({
        items: cart,
        fulfilment,
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
        },
        address: isDelivery
          ? {
              line: form.addressLine.trim(),
              notes: form.addressNotes.trim(),
              lat: position.lat,
              lng: position.lng,
            }
          : null,
        paymentMethod,
        payment,
        scheduledFor: timing === 'asap' ? 'asap' : form.slot,
        notes: form.notes.trim(),
      });

      // تُرفع قبل تفريغ السلة حتى لا يسبق حارسُ السلة الفارغة
      // الانتقالَ إلى صفحة التأكيد.
      setPlaced(true);
      clearCart();
      notify({
        title: 'Order placed',
        body: 'Reference ' + order.orderNumber,
        variant: 'success',
      });
      navigate('/order/' + order.orderNumber, { replace: true });
    } catch (error) {
      notify({
        title: 'We could not place your order',
        body: error.message,
        variant: 'warning',
        duration: 6000,
      });
      setSubmitting(false);
    }
  };

  // لا معنى لصفحة دفع بسلة فارغة، إلا أثناء إرسال الطلب أو بعد نجاحه:
  // عندها تكون السلة فارغة عمدًا والانتقال إلى صفحة التأكيد جارٍ.
  if (cart.length === 0 && !submitting && !placed) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <>
      <section className="page-header">
        <div className="page-header-overlay" />
        <div className="container position-relative">
          <h1>Checkout</h1>
          <p>Two minutes and dinner is on its way.</p>
        </div>
      </section>

      <section className="section-padding">
        <Container>
          <Form noValidate onSubmit={handleSubmit}>
            <Row className="g-4 g-lg-5">
              <Col lg={7} xl={8}>
                <fieldset className="checkout-card">
                  <legend>
                    <span className="checkout-step">1</span> How would you like it?
                  </legend>

                  <div className="choice-grid">
                    {FULFILMENT_OPTIONS.map(({ id, icon: Icon, title }) => (
                      <label
                        key={id}
                        className={'choice' + (fulfilment === id ? ' is-active' : '')}
                      >
                        <input
                          type="radio"
                          name="fulfilment"
                          value={id}
                          checked={fulfilment === id}
                          onChange={() => setFulfilment(id)}
                        />
                        <Icon aria-hidden="true" />
                        <span className="choice-title">{title}</span>
                        <span className="choice-note">
                          {id === 'delivery'
                            ? formatPrice(DEFAULT_SETTINGS.deliveryFee) +
                              ' · ' +
                              DEFAULT_SETTINGS.estimatedDeliveryMinutes.join('–') +
                              ' min'
                            : 'Free · ' +
                              DEFAULT_SETTINGS.estimatedPickupMinutes.join('–') +
                              ' min'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {!isDelivery && (
                    <p className="checkout-hint">
                      Collect from <strong>{RESTAURANT.addressLine}</strong>
                    </p>
                  )}
                </fieldset>

                <fieldset className="checkout-card">
                  <legend>
                    <span className="checkout-step">2</span> Your details
                  </legend>

                  <Row className="g-3">
                    <Form.Group as={Col} md={6} controlId="checkout-name">
                      <Form.Label>Full name</Form.Label>
                      <Form.Control
                        value={form.fullName}
                        onChange={setField('fullName')}
                        autoComplete="name"
                        isInvalid={Boolean(errors.fullName)}
                        placeholder="Your name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.fullName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Col} md={6} controlId="checkout-phone">
                      <Form.Label>Phone number</Form.Label>
                      <Form.Control
                        type="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={setField('phone')}
                        autoComplete="tel"
                        isInvalid={Boolean(errors.phone)}
                        placeholder="+971 50 123 4567"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group as={Col} xs={12} controlId="checkout-email">
                      <Form.Label>
                        Email <span className="label-optional">(for your receipt)</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={form.email}
                        onChange={setField('email')}
                        autoComplete="email"
                        isInvalid={Boolean(errors.email)}
                        placeholder="name@example.com"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Row>
                </fieldset>

                {isDelivery && (
                  <fieldset className="checkout-card">
                    <legend>
                      <span className="checkout-step">3</span> Where should we bring it?
                    </legend>

                    <AddressMap position={position} onChange={setPosition} />

                    <Row className="g-3 mt-1">
                      <Form.Group as={Col} xs={12} controlId="checkout-address">
                        <Form.Label>Building, street and area</Form.Label>
                        <Form.Control
                          value={form.addressLine}
                          onChange={setField('addressLine')}
                          autoComplete="street-address"
                          isInvalid={Boolean(errors.addressLine)}
                          placeholder="Al Majaz Tower 2, Al Khan Street, Sharjah"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.addressLine}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group as={Col} xs={12} controlId="checkout-address-notes">
                        <Form.Label>
                          Directions <span className="label-optional">(optional)</span>
                        </Form.Label>
                        <Form.Control
                          value={form.addressNotes}
                          onChange={setField('addressNotes')}
                          placeholder="Flat 1204, please call on arrival"
                        />
                      </Form.Group>
                    </Row>
                  </fieldset>
                )}

                <fieldset className="checkout-card">
                  <legend>
                    <span className="checkout-step">{isDelivery ? 4 : 3}</span> When?
                  </legend>

                  <div className="choice-grid">
                    <label className={'choice' + (timing === 'asap' ? ' is-active' : '')}>
                      <input
                        type="radio"
                        name="timing"
                        checked={timing === 'asap'}
                        onChange={() => setTiming('asap')}
                      />
                      <span className="choice-title">As soon as possible</span>
                      <span className="choice-note">{waitRange.join('–')} minutes</span>
                    </label>

                    <label
                      className={'choice' + (timing === 'later' ? ' is-active' : '')}
                    >
                      <input
                        type="radio"
                        name="timing"
                        checked={timing === 'later'}
                        onChange={() => setTiming('later')}
                      />
                      <span className="choice-title">Schedule a time</span>
                      <span className="choice-note">Choose a slot today</span>
                    </label>
                  </div>

                  {timing === 'later' && (
                    <Form.Group controlId="checkout-slot" className="mt-3">
                      <Form.Label>Preferred time</Form.Label>
                      <Form.Select value={form.slot} onChange={setField('slot')}>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </fieldset>

                <fieldset className="checkout-card">
                  <legend>
                    <span className="checkout-step">{isDelivery ? 5 : 4}</span> Payment
                  </legend>

                  <div className="choice-grid">
                    {PAYMENT_OPTIONS.map(({ id, icon: Icon, title }) => (
                      <label
                        key={id}
                        className={'choice' + (paymentMethod === id ? ' is-active' : '')}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={id}
                          checked={paymentMethod === id}
                          onChange={() => setPaymentMethod(id)}
                        />
                        <Icon aria-hidden="true" />
                        <span className="choice-title">{title}</span>
                        <span className="choice-note">
                          {id === 'cash'
                            ? 'Pay on ' + (isDelivery ? 'delivery' : 'collection')
                            : 'Pay now, securely'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="card-fields">
                      <p className="card-fields-badge">
                        <FaLock aria-hidden="true" /> Development gateway — try 4242 4242
                        4242 4242
                      </p>

                      <Row className="g-3">
                        <Form.Group as={Col} xs={12} controlId="card-holder">
                          <Form.Label>Name on card</Form.Label>
                          <Form.Control
                            value={form.cardHolder}
                            onChange={setField('cardHolder')}
                            autoComplete="cc-name"
                            isInvalid={Boolean(errors.cardHolder)}
                            placeholder="MOHAMED ALKHATIB"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cardHolder}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group as={Col} xs={12} controlId="card-number">
                          <Form.Label>Card number</Form.Label>
                          <div className="card-number-wrap">
                            <Form.Control
                              value={form.cardNumber}
                              onChange={setCardField('cardNumber', groupCardNumber)}
                              inputMode="numeric"
                              autoComplete="cc-number"
                              isInvalid={Boolean(errors.cardNumber)}
                              placeholder="4242 4242 4242 4242"
                            />
                            {cardBrand && <span className="card-brand">{cardBrand}</span>}
                          </div>
                          <Form.Control.Feedback type="invalid" className="d-block">
                            {errors.cardNumber}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group as={Col} xs={6} controlId="card-expiry">
                          <Form.Label>Expiry</Form.Label>
                          <Form.Control
                            value={form.cardExpiry}
                            onChange={setCardField('cardExpiry', formatExpiry)}
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            isInvalid={Boolean(errors.cardExpiry)}
                            placeholder="MM/YY"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cardExpiry}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group as={Col} xs={6} controlId="card-cvc">
                          <Form.Label>Security code</Form.Label>
                          <Form.Control
                            value={form.cardCvc}
                            onChange={setCardField('cardCvc', (v) =>
                              v.replace(/\D/g, '').slice(0, 4)
                            )}
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            isInvalid={Boolean(errors.cardCvc)}
                            placeholder="123"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cardCvc}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Row>
                    </div>
                  )}

                  <Form.Group controlId="checkout-notes" className="mt-4">
                    <Form.Label>
                      Notes for the kitchen{' '}
                      <span className="label-optional">(optional)</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={form.notes}
                      onChange={setField('notes')}
                      placeholder="No onions, please."
                    />
                  </Form.Group>
                </fieldset>
              </Col>

              <Col lg={5} xl={4}>
                <aside className="checkout-summary">
                  <h2>Order summary</h2>

                  <ul>
                    {cart.map((item) => (
                      <li key={item.id}>
                        <span className="summary-qty">{item.quantity}&times;</span>
                        <span className="summary-name">{item.name}</span>
                        <span className="summary-price">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="summary-line">
                    <span>Subtotal</span>
                    <strong>{formatPrice(totalPrice)}</strong>
                  </div>

                  <div className="summary-line">
                    <span>{isDelivery ? 'Delivery' : 'Pick up'}</span>
                    <strong>
                      {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                    </strong>
                  </div>

                  <hr />

                  <div className="summary-line summary-total">
                    <span>Total</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>

                  <button type="submit" className="checkout-submit" disabled={submitting}>
                    {submitting
                      ? 'Placing your order…'
                      : 'Place order · ' + formatPrice(total)}
                  </button>

                  <p className="checkout-secure">
                    <FaLock aria-hidden="true" /> Your details are only used for this
                    order.
                  </p>
                </aside>
              </Col>
            </Row>
          </Form>
        </Container>
      </section>
    </>
  );
}

export default Checkout;
