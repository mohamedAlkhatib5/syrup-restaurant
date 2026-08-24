import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * يعيد التمرير إلى أعلى الصفحة عند تغيير المسار.
 *
 * بدونه ينتقل الزبون من أسفل القائمة إلى منتصف صفحة الدفع.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
