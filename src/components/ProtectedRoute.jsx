import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import RouteFallback from './RouteFallback';

/**
 * حارس مسارات في الواجهة.
 *
 * غرضه تجربة المستخدم فقط: توجيهه إلى تسجيل الدخول بدل إظهار صفحة
 * فارغة. الحماية الحقيقية في الخادم — كل endpoint إداري يتحقق من
 * الدور بنفسه ولا يثق بأي إخفاء في المتصفح.
 */
function ProtectedRoute({ role }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteFallback />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}

export default ProtectedRoute;
