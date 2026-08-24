import { useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import { FaUserPlus } from 'react-icons/fa';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import useAuth from '../hooks/useAuth';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useToast from '../hooks/useToast';
import '../pages.css/auth.css';

function Register() {
  useDocumentTitle('Create an account');

  const { signUp, isAuthenticated, isLoading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const next = {};

    if (form.fullName.trim().length < 2) next.fullName = 'Please tell us your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Enter a valid email.';
    if (!/^\+?[\d\s-]{7,20}$/.test(form.phone.trim()))
      next.phone = 'Enter a reachable phone number.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');

    try {
      const user = await signUp({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      notify({ title: `Welcome, ${user.fullName.split(' ')[0]}`, variant: 'success' });
      navigate('/account/orders', { replace: true });
    } catch (caught) {
      // الخادم يعيد الحقل المخالف عند خطأ تحقق.
      if (caught instanceof ApiError && Array.isArray(caught.details)) {
        setErrors(
          Object.fromEntries(
            caught.details.map((i) => [i.field.replace('body.', ''), i.message])
          )
        );
      }

      setFormError(caught.message);
      setSubmitting(false);
    }
  };

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/account/orders" replace />;

  return (
    <section className="auth-page">
      <Container>
        <div className="auth-card auth-card-wide">
          <span className="auth-badge" aria-hidden="true">
            <FaUserPlus />
          </span>

          <h1>Create an account</h1>
          <p className="auth-lead">Save your details so your next order takes seconds.</p>

          <Form noValidate onSubmit={handleSubmit}>
            {formError ? (
              <div className="auth-error" role="alert">
                {formError}
              </div>
            ) : null}

            <Row className="g-3">
              <Form.Group as={Col} md={6} controlId="register-name">
                <Form.Label>Full name</Form.Label>
                <Form.Control
                  value={form.fullName}
                  onChange={setField('fullName')}
                  autoComplete="name"
                  isInvalid={Boolean(errors.fullName)}
                  placeholder="Your name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fullName}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} md={6} controlId="register-phone">
                <Form.Label>Phone number</Form.Label>
                <Form.Control
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  autoComplete="tel"
                  isInvalid={Boolean(errors.phone)}
                  placeholder="+971 50 123 4567"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} xs={12} controlId="register-email">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  value={form.email}
                  onChange={setField('email')}
                  autoComplete="email"
                  isInvalid={Boolean(errors.email)}
                  placeholder="name@example.com"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group as={Col} xs={12} controlId="register-password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  autoComplete="new-password"
                  isInvalid={Boolean(errors.password)}
                  placeholder="At least 8 characters"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <button type="submit" className="auth-submit mt-4" disabled={submitting}>
              {submitting ? 'Creating your account…' : 'Create account'}
            </button>
          </Form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

export default Register;
