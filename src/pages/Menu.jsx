import { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

import MenuCard from '../components/MenuCard';
import { menuItems } from '../data/menu';
import '../pages.css/menu.css';
import useDocumentTitle from '../hooks/useDocumentTitle';

function Menu() {
  useDocumentTitle('Menu');
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered =
    activeCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);
  return (
    <>
      <section className="page-header">
        <div className="page-header-overlay" />
        <div className="container position-relative">
          <h1>Our Menu</h1>
          <p>Seasonal ingredients, generous plates and flavours made for sharing.</p>
        </div>
      </section>
      <section className="section-padding">
        <Container>
          <div className="menu-filters" data-aos="fade-up">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <Row className="g-4">
            {filtered.map((item) => (
              <Col md={6} lg={4} xl={3} key={item.id}>
                <MenuCard item={item} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
}
export default Menu;
