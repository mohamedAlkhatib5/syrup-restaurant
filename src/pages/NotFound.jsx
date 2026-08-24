import { Link } from 'react-router-dom';

import '../pages.css/NotFound.css';
import useDocumentTitle from '../hooks/useDocumentTitle';

function NotFound() {
  useDocumentTitle('NotFound 404');
  return (
    <section className="not-found">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary-custom">
        Back to home
      </Link>
    </section>
  );
}
export default NotFound;
