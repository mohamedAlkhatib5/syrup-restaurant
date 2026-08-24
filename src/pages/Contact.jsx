import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaClock } from 'react-icons/fa';

import '../pages.css/Contact.css';
import { sendContactMessage } from '../api/contact';
import { ApiError } from '../api/client';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useToast from '../hooks/useToast';

const DETAILS = [
  { icon: FaMapMarkerAlt, title: 'Visit us', text: 'Al Majaz Waterfront, Sharjah, UAE' },
  { icon: FaPhoneAlt, title: 'Call us', text: '+971 50 123 4567' },
  { icon: FaEnvelope, title: 'Email us', text: 'syrup@gmail.com' },
  { icon: FaClock, title: 'Opening hours', text: 'Daily, 11:00 AM – 1:00 AM' },
];

function Contact() {
  useDocumentTitle('Contact');
  // منع تحديث الصفحة وعرض رسالة نجاح عند إرسال النموذج.
  const { notify } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    setSubmitting(true);
    setFieldErrors({});

    try {
      await sendContactMessage({
        fullName: String(values.fullName ?? '').trim(),
        email: String(values.email ?? '').trim(),
        phone: String(values.phone ?? '').trim(),
        subject: String(values.subject ?? 'general_enquiry'),
        message: String(values.message ?? '').trim(),
      });

      notify({
        title: 'Message sent',
        body: 'We will be in touch shortly.',
        variant: 'success',
      });
      form.reset();
    } catch (error) {
      // الخادم يعيد الحقل المخالف، فنعرض الخطأ تحته مباشرة.
      if (error instanceof ApiError && Array.isArray(error.details)) {
        setFieldErrors(
          Object.fromEntries(error.details.map((issue) => [issue.field, issue.message]))
        );
      }

      notify({
        title: 'We could not send your message',
        body: error.message,
        variant: 'warning',
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <section className="page-header">
        <div className="page-header-overlay" />
        <div className="container position-relative">
          <h1>Contact & Reservations</h1>
          <p>Plan your table, ask a question or tell us about your next celebration.</p>
        </div>
      </section>
      <section className="section-padding">
        <Container>
          <Row className="g-5">
            <Col lg={5}>
              <div className="contact-info" data-aos="fade-right">
                <span className="eyebrow dark">We would love to hear from you</span>
                <h2 className="display-title">Your table is waiting.</h2>
                <p>
                  For reservations, private dining and large orders, contact our team or
                  send us a message.
                </p>
                {DETAILS.map(({ icon: Icon, title, text }) => (
                  <div className="contact-item" key={title}>
                    <div className="icon-item">
                      <Icon />
                    </div>
                    <div className="item">
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={7}>
              <Form className="contact-form" onSubmit={handleSubmit} data-aos="fade-left">
                <Row className="g-3">
                  <Form.Group as={Col} md={6} controlId="contact-full-name">
                    <Form.Label>Full name</Form.Label>
                    <Form.Control
                      name="fullName"
                      autoComplete="name"
                      required
                      placeholder="Your name"
                      isInvalid={Boolean(fieldErrors.fullName)}
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="contact-email">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      isInvalid={Boolean(fieldErrors.email)}
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="contact-phone">
                    <Form.Label>Phone number</Form.Label>
                    <Form.Control
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+971"
                      isInvalid={Boolean(fieldErrors.phone)}
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="contact-subject">
                    <Form.Label>Subject</Form.Label>
                    <Form.Select name="subject" defaultValue="table_reservation">
                      <option value="table_reservation">Table reservation</option>
                      <option value="private_event">Private event</option>
                      <option value="large_order">Large order</option>
                      <option value="general_enquiry">General enquiry</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} xs={12} controlId="contact-message">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      name="message"
                      as="textarea"
                      rows={6}
                      required
                      placeholder="How can we help?"
                      isInvalid={Boolean(fieldErrors.message)}
                    />
                  </Form.Group>
                  <Col xs={12}>
                    <button
                      className="btn-primary-custom border-0"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? 'Sending…' : 'Send message'}
                    </button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}
export default Contact;
