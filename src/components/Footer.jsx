import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../pages.css/footer.css';
import logo from '../assets/images/logo.png';

function Footer() {
  return (
    <footer className="footer">
      <Container className="p-0">
        <Row className="g-4">
          <Col lg={4}>
            <div className="footer-brand  brand">
              <img src={logo} alt="logo" />
              {/* <h4>syrup</h4> */}
            </div>
            <p>
              Contemporary dining inspired by honest ingredients, open-fire cooking and
              generous hospitality.
            </p>
          </Col>
          <Col sm={6} lg={2}>
            <h5>Explore</h5>
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/story">Our Story</Link>
            <Link to="/contact">Contact</Link>
          </Col>
          <Col sm={6} lg={3}>
            <h5>Opening Hours</h5>
            <p>
              Monday – Thursday
              <br />
              11:00 AM – 11:30 PM
            </p>
            <p>
              Friday – Sunday
              <br />
              12:00 PM – 1:00 AM
            </p>
          </Col>
          <Col lg={3}>
            <h5>Follow our kitchen</h5>
            <div className="socials">
              <a href="#" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="#" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>
          </Col>
        </Row>
        <div className="footer-bottom">© 2026 Syrup by MOhamed alkhatib.</div>
      </Container>
    </footer>
  );
}
export default Footer;
