import { useState } from 'react';
import { Container, Form } from 'react-bootstrap';
import { FaLock } from 'react-icons/fa';
import { Link, Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useToast from '../hooks/useToast';
import '../pages.css/auth.css';

function Login() {
  useDocumentTitle('Sign in');

  const { signIn, isAuthenticated, isLoading, user } = useAuth();
  const { notify } = useToast();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // بعد الدخول نعيده إلى حيث كان، لا إلى الصفحة الرئيسية.
  const requested = new URLSearchParams(location.search).get('redirect');

  // وجهة واحدة يحسبها الحارس وحده. حسابها في مكانين — الحارس ونداء
  // navigate بعد الدخول — يجعلهما يتسابقان، فيفوز الحارس ويهبط مدير
  // المطعم في صفحة الزبون بدل لوحة الإدارة.
  const destination =
    user?.role === 'admin' ? '/admin/orders' : (requested ?? '/account/orders');

  const setField = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const signed = await signIn(form);
      notify({
        title: `Welcome back, ${signed.fullName.split(' ')[0]}`,
        variant: 'success',
      });
      // لا نتنقّل هنا: الحارس أدناه يتولّى ذلك فور قيام الجلسة.
    } catch (caught) {
      setError(caught.message);
      setSubmitting(false);
    }
  };

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={destination} replace />;

  return (
    <section className="auth-page">
      <Container>
        <div className="auth-card">
          <span className="auth-badge" aria-hidden="true">
            <FaLock />
          </span>

          <h1>Welcome back</h1>
          <p className="auth-lead">Sign in to see your orders and saved details.</p>

          <Form noValidate onSubmit={handleSubmit}>
            {error ? (
              <div className="auth-error" role="alert">
                {error}
              </div>
            ) : null}

            <Form.Group controlId="login-email" className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={setField('email')}
                autoComplete="email"
                required
                placeholder="name@example.com"
              />
            </Form.Group>

            <Form.Group controlId="login-password" className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={setField('password')}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </Form.Group>

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </Form>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <p className="auth-note">
            You never need an account to order. Signing in just saves your details.
          </p>
        </div>
      </Container>
    </section>
  );
}

export default Login;
