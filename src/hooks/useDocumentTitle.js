import { useEffect } from 'react';

const SITE_NAME = 'Syrup';

/**
 * يضبط عنوان تبويب المتصفح للصفحة الحالية.
 *
 * مستقل عن حالة السلة عمدًا: عنوان الصفحة ليس من مسؤوليات السلة،
 * وربطهما كان يجبر كل صفحة على الاشتراك في CartContext بلا داعٍ.
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${SITE_NAME} | ${title}` : SITE_NAME;

    return () => {
      document.title = previous;
    };
  }, [title]);
}
