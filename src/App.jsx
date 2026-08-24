import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AOS from 'aos';
import 'aos/dist/aos.css';

import CartDrawer from './components/CartDrawer';
import DemoBanner from './components/DemoBanner';
import Footer from './components/Footer';
import MobileCartBar from './components/MobileCartBar';
import Header from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RouteFallback from './components/RouteFallback';
import ScrollToTop from './components/ScrollToTop';
import ToastStack from './components/ToastStack';

// الصفحة الرئيسية تُحمّل مباشرة لأنها نقطة الدخول الأكثر زيارة،
// وبقية الصفحات تُحمّل عند الطلب لتقليل حجم الحزمة الأولى.
import Home from './pages/Home';

const Story = lazy(() => import('./pages/Story'));
const Menu = lazy(() => import('./pages/Menu'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MyOrders = lazy(() => import('./pages/account/MyOrders'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  useEffect(() => {
    AOS.init({ duration: 900, once: true, offset: 80 });
  }, []);

  return (
    <>
      <ScrollToTop />
      <Header />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmation />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<Navigate to="/account/orders" replace />} />
            <Route path="/account/orders" element={<MyOrders />} />
          </Route>

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/orders" replace />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* المسار القديم قبل إعادة التسمية. */}
          <Route path="/order" element={<Navigate to="/cart" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <ToastStack />
      <DemoBanner />
    </>
  );
}

export default App;
