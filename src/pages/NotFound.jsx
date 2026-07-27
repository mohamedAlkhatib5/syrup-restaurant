import { Link } from 'react-router-dom'

import '../pages.css/NotFound.css';
// title
import { useCart } from '../context/CartContext'
import { useEffect } from 'react'

function NotFound() {

   // title
   const { setPageTitle } = useCart()
   useEffect(() => {
      setPageTitle('NotFound 404')
   }, [setPageTitle])
   // ****
   return (<section className="not-found">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary-custom">Back to home</Link>
   </section>)
}
export default NotFound
