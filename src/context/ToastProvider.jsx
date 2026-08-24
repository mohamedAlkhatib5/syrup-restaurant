import { useCallback, useMemo, useRef, useState } from 'react';

import { ToastContext } from './toast-context';

const DEFAULT_DURATION = 3200;

/**
 * إشعارات قصيرة أعلى الشاشة.
 *
 * تحلّ محل alert() الذي كان يوقف الصفحة ولا يمكن تنسيقه ولا اختباره.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, body, variant = 'success', duration = DEFAULT_DURATION }) => {
      const id = ++nextId.current;

      setToasts((current) => [...current.slice(-2), { id, title, body, variant }]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
