import { Dropdown } from 'react-bootstrap';
import {
  FaClipboardList,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserCircle,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

/**
 * قسم الحساب في النافبار.
 *
 * أثناء التحقق من الجلسة يعرض هيكلًا رماديًا لا زر "تسجيل الدخول":
 * وميض الزر ثم تحوّله إلى اسم المستخدم يجعل المسجّل يظن أنه خرج.
 */
function AccountMenu({ onNavigate }) {
  const { isLoading, isAuthenticated, isAdmin, user, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  if (isLoading) {
    return <span className="account-chip-skeleton" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return (
      <Link to="/login" className="account-signin" onClick={onNavigate}>
        Sign in
      </Link>
    );
  }

  const handleSignOut = async () => {
    onNavigate?.();

    try {
      await signOut();
      notify({ title: 'Signed out', variant: 'info' });
      navigate('/');
    } catch {
      notify({ title: 'Could not sign you out', variant: 'warning' });
    }
  };

  const firstName = user.fullName.split(' ')[0];

  return (
    <Dropdown align="end" className="account-menu">
      <Dropdown.Toggle variant="link" id="account-menu" className="account-toggle">
        <FaUserCircle aria-hidden="true" />
        <span>{firstName}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>Signed in as {user.email}</Dropdown.Header>
        <Dropdown.Divider />

        <Dropdown.Item as={Link} to="/account/orders" onClick={onNavigate}>
          <FaClipboardList aria-hidden="true" /> My orders
        </Dropdown.Item>

        {isAdmin ? (
          <Dropdown.Item as={Link} to="/admin/orders" onClick={onNavigate}>
            <FaTachometerAlt aria-hidden="true" /> Dashboard
          </Dropdown.Item>
        ) : null}

        <Dropdown.Divider />

        <Dropdown.Item as="button" type="button" onClick={handleSignOut}>
          <FaSignOutAlt aria-hidden="true" /> Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default AccountMenu;
