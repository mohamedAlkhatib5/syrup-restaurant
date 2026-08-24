import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import AOS from 'aos';
import 'aos/dist/aos.css';

import Footer from './components/Footer';
import Header from './components/Navbar';
import RouteFallback from './components/RouteFallback';

// الصفحة الرئيسية تُحمّل مباشرة لأنها نقطة الدخول الأكثر زيارة،
// وبقية الصفحات تُحمّل عند الطلب لتقليل حجم الحزمة الأولى.
import Home from './pages/Home';

const Story = lazy(() => import('./pages/Story'));
const Menu = lazy(() => import('./pages/Menu'));
const Contact = lazy(() => import('./pages/Contact'));
const Order = lazy(() => import('./pages/Order'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 80 });
  }, []);

  return (
    <>
      <Header />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/order" element={<Order />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}

export default App;
