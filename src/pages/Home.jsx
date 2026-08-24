import Container from 'react-bootstrap/Container';
import { Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../pages.css/Home.css';
import { FaArrowRight, FaStar } from 'react-icons/fa';

import { FaFire, FaLeaf, FaClock, FaAward, FaQuoteLeft } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import MenuCard from '../components/MenuCard';
import { menuItems } from '../data/menu';
// img
import heroimg from '../assets/images/heroimg.webp';
import storysmall from '../assets/images/storysmall.webp';
import storymain from '../assets/images/storymain.webp';
import useDocumentTitle from '../hooks/useDocumentTitle';

const FEATURES = [
  {
    icon: FaFire,
    title: 'Open-fire cooking',
    text: 'Charred edges and deep flavour from our stone oven.',
  },
  {
    icon: FaLeaf,
    title: 'Market fresh',
    text: 'Seasonal produce selected every morning.',
  },
  {
    icon: FaClock,
    title: 'Made to order',
    text: 'Every plate is prepared fresh for you.',
  },
  {
    icon: FaAward,
    title: 'Craft & quality',
    text: 'Careful recipes, consistent standards.',
  },
];

function Home() {
  useDocumentTitle('Home');

  return (
    <main className="page">
      {/*hero*/}
      <section className="hero pt-lg-5">
        <div className="hero-overlay" />
        <Container className="position-relative">
          <Row className="align-items-center min-vh-100 py-5">
            <Col lg={6} className="pt-5 pt-lg-0">
              <div data-aos="fade-right">
                <span className="eyebrow d-block">Fresh ingredients. Bold flavours.</span>
                <h1>
                  Food made to <span>remember.</span>
                </h1>
                <p>
                  Modern comfort food, handcrafted pizzas and vibrant seasonal dishes,
                  served in a warm space made for sharing.
                </p>
                <div className="hero-actions">
                  <Link to="/menu" className="btn-primary-custom">
                    Explore our menu <FaArrowRight />
                  </Link>
                  <Link to="/contact" className="btn-outline-custom">
                    Book a table
                  </Link>
                </div>
                <div className="hero-stats">
                  <div>
                    <strong>12+</strong>
                    <span>Years of flavour</span>
                  </div>
                  <div>
                    <strong>40+</strong>
                    <span>Signature dishes</span>
                  </div>
                  <div>
                    <strong>15k+</strong>
                    <span>Happy guests</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center mt-5 mt-lg-0">
              <div className="hero-image-frame">
                <img
                  src={heroimg}
                  alt="Fresh artisan pizza"
                  className="hero-food-image"
                  width={1400}
                  height={933}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  data-aos="fade-up"
                />
                <div className="floating-card p-2">
                  <Badge bg="light" text="dark" className="hero-badge ">
                    <FaStar className="text-warning" /> 4.9 rated dining experience
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/*feature*/}
      <section className="feature-strip p-x-0">
        <Container>
          <Row className="g-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Col md={6} lg={3} key={title}>
                <div className="feature-box" data-aos="zoom-in">
                  <div>
                    <Icon />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/*swiper*/}
      <section className="favourites-section py-5">
        <Container>
          {/* عنوان السكشن */}
          <Row className="justify-content-center text-center mb-5">
            <Col xs={12} md={10} lg={7}>
              <p className="favourites-label text-uppercase fw-semibold mb-2">
                Guest Favourites
              </p>

              <h2 className="favourites-title display-5 fw-bold mb-3">
                The Dishes Everyone Talks About
              </h2>

              <p className="favourites-description lead mb-0">
                Discover a selection of our most popular dishes, prepared with premium
                ingredients and unforgettable flavours.
              </p>
            </Col>
          </Row>

          {/* السلايدر */}
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            slidesPerGroup={1}
            spaceBetween={20}
            speed={800}

            // لا تستخدم loop مع أربع شرائح فقط
            loop={false}

            // يعود لأول شريحة بعد الوصول للنهاية
            rewind={true}

            pagination={{
              clickable: true,
            }}

            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}

            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 15,
              },

              576: {
                slidesPerView: 1.4,
                spaceBetween: 18,
              },

              768: {
                slidesPerView: 2,
                spaceBetween: 20,
              },

              992: {
                slidesPerView: 2.5,
                spaceBetween: 24,
              },

              1200: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}

            className="favourites-swiper pb-5"
          >
            {menuItems.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <MenuCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* زر المنيو */}
          <Row className="mt-4">
            <Col xs={12} className="text-center">
              <Link to="/menu" className="btn-primary-custom px-4 py-3">
                View the Full Menu
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/*story*/}
      <section className="story-section section-padding">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6} data-aos="fade-right">
              <div className="story-grid">
                <img
                  className="story-main"
                  src={storymain}
                  alt="Restaurant interior"
                  width={1000}
                  height={667}
                  loading="lazy"
                  decoding="async"
                />
                <img
                  className="story-small"
                  src={storysmall}
                  alt="Professional chef"
                  width={700}
                  height={1078}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </Col>
            <Col lg={6} data-aos="fade-left">
              <span className="eyebrow dark">Our story</span>
              <h2 className="display-title">
                A neighbourhood table with a world of flavour.
              </h2>
              <p>
                Syrup began with one simple idea: exceptional food should feel welcoming,
                not complicated. We combine Mediterranean warmth, Italian craft and modern
                techniques.
              </p>
              <p>
                Our dough rests for 48 hours, sauces are prepared daily and every
                ingredient is chosen for flavour—not shortcuts.
              </p>
              <Link to="/story" className="text-link">
                Discover our story →
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/*testimonial*/}
      <section className="testimonial-section section-padding">
        <Container>
          <div className="testimonial-card" data-aos="fade-up">
            <FaQuoteLeft />
            <p>
              “Beautiful atmosphere, genuinely warm service and one of the best pizzas we
              have had in the city.”
            </p>
            <strong>— Maya R., Dubai</strong>
          </div>
        </Container>
      </section>

      {/**/}
      <section className="cta-section">
        <Container className="text-center position-relative">
          <span className="eyebrow">Dinner plans?</span>
          <h2>Bring the Syrup experience home.</h2>
          <p>Freshly prepared, carefully packed and delivered hot.</p>
          <Link to="/cart" className="btn-light-custom">
            Start your order
          </Link>
        </Container>
      </section>
    </main>
  );
}

export default Home;
