import { Container } from 'react-bootstrap';
import { FaClipboardList, FaCog, FaEnvelope, FaUtensils } from 'react-icons/fa';
import { NavLink, Outlet } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import '../../pages.css/admin.css';

const TABS = [
  { to: '/admin/orders', label: 'Orders', icon: FaClipboardList },
  { to: '/admin/menu', label: 'Menu', icon: FaUtensils },
  { to: '/admin/messages', label: 'Messages', icon: FaEnvelope },
  { to: '/admin/settings', label: 'Settings', icon: FaCog },
];

function AdminLayout() {
  const { user } = useAuth();

  return (
    <section className="admin-shell">
      <Container fluid="xl">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">Dashboard</span>
            <h1>Syrup kitchen</h1>
          </div>

          <p className="admin-who">
            Signed in as <strong>{user?.fullName}</strong>
          </p>
        </header>

        <nav className="admin-tabs" aria-label="Dashboard sections">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </Container>
    </section>
  );
}

export default AdminLayout;
