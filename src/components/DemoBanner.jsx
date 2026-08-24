import { useState } from 'react';
import { FaChevronDown, FaFlask, FaRedo } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { IS_DEMO } from '../api/client';
import { DEMO_ADMIN, resetDemo } from '../api/demo-backend';

/**
 * شريط يظهر في النسخة التجريبية العامة فقط.
 *
 * يوضّح للزائر أنها تجربة، ويعطيه بيانات الدخول للوحة الإدارة، وزرًا
 * لإعادة كل شيء إلى حالته الأولى. لا يُركّب إطلاقًا في التشغيل الحقيقي.
 */
function DemoBanner() {
  const [open, setOpen] = useState(false);

  if (!IS_DEMO) return null;

  const reset = () => {
    resetDemo();
    window.localStorage.removeItem('syrup.cart.v1');
    window.localStorage.removeItem('syrup.session');
    window.location.href = '/';
  };

  return (
    <aside className={`demo-banner ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="demo-banner-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <FaFlask aria-hidden="true" />
        <span>Live demo — try everything</span>
        <FaChevronDown className="demo-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div className="demo-banner-body">
          <p>
            This is a working demo. Everything you do is stored in{' '}
            <strong>your browser only</strong> — no server, no account, nothing shared.
          </p>

          <dl className="demo-credentials">
            <div>
              <dt>Dashboard</dt>
              <dd>
                <Link to="/login">/login</Link>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <code>{DEMO_ADMIN.email}</code>
              </dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>
                <code>{DEMO_ADMIN.password}</code>
              </dd>
            </div>
          </dl>

          <p className="demo-hint">
            Order something first, then sign in to watch it arrive on the kitchen board.
          </p>

          <button type="button" className="demo-reset" onClick={reset}>
            <FaRedo aria-hidden="true" /> Reset the demo
          </button>
        </div>
      ) : null}
    </aside>
  );
}

export default DemoBanner;
