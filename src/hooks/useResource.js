import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * جلب بيانات مع حالات التحميل والخطأ وإعادة المحاولة.
 *
 * يوجد هنا مرة واحدة بدل تكراره في كل صفحة، ويُلغي الطلب عند تفكيك
 * المكوّن أو تغيّر المدخلات حتى لا تصل نتيجة قديمة بعد الجديدة.
 *
 * لا يستدعي setState داخل جسم الـ effect: حالة التحميل مشتقّة من
 * مقارنة مفتاح الطلب الحالي بمفتاح آخر نتيجة وصلت.
 */
export default function useResource(loader, deps = [], { enabled = true } = {}) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  const key = `${JSON.stringify(deps)}::${reloadCount}`;
  const isSettled = result.key === key;

  const loaderRef = useRef(loader);

  // تحديث المرجع داخل effect لا أثناء الرسم. يسبق effect الجلب في
  // الترتيب، فيرى الجلب دائمًا أحدث دالة تحميل.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let active = true;

    loaderRef
      .current({ signal: controller.signal })
      .then((data) => {
        if (active) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return;
        setResult({ key, data: null, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [key, enabled]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    // نُبقي البيانات السابقة معروضة أثناء إعادة الجلب بدل إفراغ الشاشة.
    data: result.data,
    error: isSettled ? result.error : null,
    isLoading: enabled && !isSettled,
    reload,
  };
}
