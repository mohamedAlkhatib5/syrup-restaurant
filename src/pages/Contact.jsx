import { Container, Row, Col, Form } from 'react-bootstrap'
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaClock } from 'react-icons/fa'

import '../pages.css/Contact.css';
// title
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'

function Contact() {


  // title
  const { setPageTitle } = useCart()
  useEffect(() => {
    setPageTitle('Contact')
  }, [setPageTitle])
  // *************
  // منع تحديث الصفحة وعرض رسالة نجاح عند إرسال النموذج.
  const handleSubmit = event => { event.preventDefault(); alert('Thank you! Your message has been sent.'); event.currentTarget.reset() }
  const details = [
    [<FaMapMarkerAlt />, 'Visit us', 'Al Majaz Waterfront, Sharjah, UAE'],
    [<FaPhoneAlt />, 'Call us', '+971 50 123 4567'],
    [<FaEnvelope />, 'Email us', 'syrup@gmail.com'],
    [<FaClock />, 'Opening hours', 'Daily, 11:00 AM – 1:00 AM']]
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
                <p>For reservations, private dining and large orders, contact our team or send us a message.</p>
                {details.map(([icon, title, text]) =>
                  <div className="contact-item" key={title}>
                    <div className='icon-item'>{icon}</div>
                    <div className='item'>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </div>)}</div>
            </Col>
            <Col lg={7}>
              <Form className="contact-form" onSubmit={handleSubmit} data-aos="fade-left">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Full name</Form.Label>
                    <Form.Control required placeholder="Your name" />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Email address</Form.Label>
                    <Form.Control required type="email" placeholder="name@example.com" /></Col>
                  <Col md={6}><Form.Label>Phone number</Form.Label><Form.Control placeholder="+971" /></Col>
                  <Col md={6}><Form.Label>Subject</Form.Label><Form.Select>
                    <option>Table reservation</option>
                    <option>Private event</option>
                    <option>Large order</option>
                    <option>General enquiry</option>
                  </Form.Select>
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Message</Form.Label>
                    <Form.Control as="textarea" rows={6} required placeholder="How can we help?" /></Col>
                  <Col xs={12}>
                    <button className="btn-primary-custom border-0" type="submit">Send message</button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}
export default Contact
