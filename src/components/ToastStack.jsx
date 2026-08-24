import { FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

import useToast from '../hooks/useToast';

const ICONS = {
  success: FaCheck,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

/** يعرض الإشعارات النشطة. يُركّب مرة واحدة في App. */
function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map(({ id, title, body, variant }) => {
        const Icon = ICONS[variant] ?? FaInfoCircle;

        return (
          <div
            key={id}
            className={`toast-item toast-${variant}`}
            role="status"
            aria-live="polite"
          >
            <span className="toast-icon" aria-hidden="true">
              <Icon />
            </span>

            <div className="toast-body">
              <strong>{title}</strong>
              {body ? <span>{body}</span> : null}
            </div>

            <button
              type="button"
              onClick={() => dismiss(id)}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastStack;
