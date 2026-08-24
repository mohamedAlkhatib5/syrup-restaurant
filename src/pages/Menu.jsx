import { useMemo, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';

import { fetchCategories, fetchMenuItems } from '../api/menu';
import DataState from '../components/DataState';
import MenuCard from '../components/MenuCard';
import MenuCardSkeleton from '../components/MenuCardSkeleton';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useResource from '../hooks/useResource';
import '../pages.css/menu.css';

function MenuSkeletonGrid() {
  return (
    <Row className="g-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Col md={6} lg={4} xl={3} key={index}>
          <MenuCardSkeleton />
        </Col>
      ))}
    </Row>
  );
}

function Menu() {
  useDocumentTitle('Menu');

  const [activeCategory, setActiveCategory] = useState('All');

  const categoriesResource = useResource((options) => fetchCategories(options), []);
  const itemsResource = useResource(
    (options) => fetchMenuItems({ category: activeCategory, ...options }),
    [activeCategory]
  );

  const categories = useMemo(
    () => ['All', ...(categoriesResource.data ?? []).map((category) => category.name)],
    [categoriesResource.data]
  );

  const items = itemsResource.data ?? [];

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
          {categoriesResource.data ? (
            <div className="menu-filters" data-aos="fade-up">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? 'active' : ''}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          <DataState
            isLoading={itemsResource.isLoading}
            error={itemsResource.error}
            isEmpty={items.length === 0}
            onRetry={itemsResource.reload}
            skeleton={<MenuSkeletonGrid />}
            emptyTitle="No dishes in this category"
            emptyBody="Try another part of the menu."
          >
            <Row className="g-4">
              {items.map((item) => (
                <Col md={6} lg={4} xl={3} key={item.id}>
                  <MenuCard item={item} />
                </Col>
              ))}
            </Row>
          </DataState>
        </Container>
      </section>
    </>
  );
}

export default Menu;
