import { useEffect, useState } from 'react';

import { Link, NavLink, useLocation } from 'react-router-dom';
// icon
import { FaUtensils, FaShoppingBag } from 'react-icons/fa';
// css
import {
  Button,
  Container,
  Nav,
  Navbar as BootstrapNavbar,
  Offcanvas,
} from 'react-bootstrap';

import '../pages.css/Navbar.css';
import useCart from '../hooks/useCart';
import useCartUI from '../hooks/useCartUI';

import logo from '../assets/images/logo.webp';
/* =====================================================
                  HEADER COMPONENT
===================================================== */

/**
 * الصفحات التي تبدأ بقسم داكن كبير خلف النافبار.
 * على غيرها يكون النافbar شفافًا فوق خلفية بيضاء، فتختفي روابطه
 * البيضاء — لذلك نجعله معتمًا مباشرةً هناك.
 */
const ROUTES_WITH_HERO = ['/', '/menu', '/story', '/contact', '/cart', '/checkout'];

function Header() {
  /* حالة فتح وإغلاق قائمة Offcanvas */

  const [showMenu, setShowMenu] = useState(false);

  /* حالة تغيير شكل النافبار عند النزول */

  const [isScrolled, setIsScrolled] = useState(false);

  const { totalItems } = useCart();
  const { openDrawer } = useCartUI();
  const { pathname } = useLocation();

  const hasHero = ROUTES_WITH_HERO.includes(pathname);
  const isSolid = isScrolled || !hasHero;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    /* تنظيف الحدث عند إغلاق المكوّن */

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* فتح قائمة Offcanvas */

  const handleShowMenu = () => {
    setShowMenu(true);
  };

  /* إغلاق قائمة Offcanvas */

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  return (
    <BootstrapNavbar
      expand="lg"
      fixed="top"
      expanded={showMenu}
      onToggle={setShowMenu}
      className={`
                navbar-custom
                ${isSolid ? 'navbar-scrolled' : ''}
            `}
    >
      <Container>
        {/* =========================================
                                LOGO
                ========================================= */}

        <BootstrapNavbar.Brand
          as={Link}
          to="/"
          className="brand"
          onClick={handleCloseMenu}
        >
          <img src={logo} alt="logo" width={320} height={347} />
        </BootstrapNavbar.Brand>

        {/* =========================================
                          MOBILE TOGGLE BUTTON
                ========================================= */}

        <BootstrapNavbar.Toggle
          aria-controls="restaurant-offcanvas"
          onClick={handleShowMenu}
        />

        {/* =========================================
                           OFFCANVAS MENU
                ========================================= */}

        <BootstrapNavbar.Offcanvas
          id="restaurant-offcanvas"
          aria-labelledby="restaurant-offcanvas-title"
          placement="end"
          show={showMenu}
          onHide={handleCloseMenu}
        >
          {/* رأس قائمة الهاتف */}

          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="restaurant-offcanvas-title" className="offcanvas-title">
              <FaUtensils className="me-2" aria-hidden="true" />
              <span className="visually-hidden">Syrup menu</span>
            </Offcanvas.Title>
          </Offcanvas.Header>

          {/* محتوى قائمة الهاتف والكمبيوتر */}

          <Offcanvas.Body>
            {/* روابط التنقل */}

            <Nav className="mx-auto navbar-links">
              <Nav.Link as={NavLink} to="/" end onClick={handleCloseMenu}>
                Home
              </Nav.Link>

              <Nav.Link as={NavLink} to="/story" onClick={handleCloseMenu}>
                Our Story
              </Nav.Link>

              <Nav.Link as={NavLink} to="/menu" onClick={handleCloseMenu}>
                Menu
              </Nav.Link>

              <Nav.Link as={NavLink} to="/contact" onClick={handleCloseMenu}>
                Contact
              </Nav.Link>
            </Nav>

            {/* زر الطلب */}

            <Button
              type="button"
              variant="dark"
              className="order-button"
              onClick={() => {
                handleCloseMenu();
                openDrawer();
              }}
              aria-label={
                totalItems === 1
                  ? 'Open your basket, 1 item'
                  : `Open your basket, ${totalItems} items`
              }
            >
              <FaShoppingBag className="me-2" aria-hidden="true" />
              Order Now
              <b aria-hidden="true">{totalItems}</b>
            </Button>
          </Offcanvas.Body>
        </BootstrapNavbar.Offcanvas>
      </Container>
    </BootstrapNavbar>
  );
}

export default Header;
