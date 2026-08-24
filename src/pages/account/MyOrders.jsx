import { Container } from 'react-bootstrap';
import { FaMotorcycle, FaStore } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { fetchMyOrders } from '../../api/orders';
import DataState from '../../components/DataState';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useResource from '../../hooks/useResource';
import useToast from '../../hooks/useToast';
import { formatPrice } from '../../utils/currency';
import '../../pages.css/account.css';

const OPEN_STATUSES = new Set([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivering',
]);

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MyOrders() {
  useDocumentTitle('My orders');

  const { user, signOut } = useAuth();
  const { addToCart } = useCart();
  const { notify } = useToast();

  const resource = useResource((options) => fetchMyOrders(options), []);
  const orders = resource.data ?? [];

  /** إعادة الطلب: أقوى سبب يجعل زبون مطعم ينشئ حسابًا أصلًا. */
  const reorder = (order) => {
    const available = order.items.filter((item) => item.menuItemId);

    if (available.length === 0) {
      notify({
        title: 'Those dishes are no longer on the menu',
        variant: 'warning',
      });
      return;
    }

    available.forEach((item) => {
      for (let index = 0; index < item.quantity; index += 1) {
        addToCart({
          id: item.menuItemId,
          name: item.name,
          price: item.unitPrice,
          image: item.image ?? '',
        });
      }
    });

    notify({
      title: 'Added to your basket',
      body: `${available.length} dish${available.length > 1 ? 'es' : ''} from ${order.orderNumber}`,
      variant: 'success',
    });
  };

  return (
    <section className="account-page">
      <Container>
        <header className="account-header">
          <div>
            <span className="eyebrow dark">Your account</span>
            <h1 className="display-title">Hello, {user?.fullName.split(' ')[0]}</h1>
            <p className="account-contact">
              {user?.email} · {user?.phone}
            </p>
          </div>

          <button type="button" className="account-signout" onClick={signOut}>
            Sign out
          </button>
        </header>

        <DataState
          isLoading={resource.isLoading}
          error={resource.error}
          isEmpty={orders.length === 0}
          onRetry={resource.reload}
          emptyTitle="No orders yet"
          emptyBody="Once you place an order it will appear here, ready to repeat."
        >
          <div className="account-orders">
            {orders.map((order) => (
              <article key={order.orderNumber} className="account-order">
                <header>
                  <div>
                    <Link
                      to={`/order/${order.orderNumber}`}
                      className="account-order-ref"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="account-order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <span className={`status-pill status-${order.status}`}>
                    {OPEN_STATUSES.has(order.status) ? 'In progress' : order.status}
                  </span>
                </header>

                <ul>
                  {order.items.map((item) => (
                    <li key={item.name}>
                      <span className="qty">{item.quantity}&times;</span>
                      <span>{item.name}</span>
                      <b>{formatPrice(item.lineTotal)}</b>
                    </li>
                  ))}
                </ul>

                <footer>
                  <span className="account-order-mode">
                    {order.fulfilment === 'delivery' ? (
                      <>
                        <FaMotorcycle aria-hidden="true" /> Delivery
                      </>
                    ) : (
                      <>
                        <FaStore aria-hidden="true" /> Pick up
                      </>
                    )}
                  </span>

                  <strong>{formatPrice(order.total)}</strong>

                  <button
                    type="button"
                    className="account-reorder"
                    onClick={() => reorder(order)}
                  >
                    Order again
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </DataState>
      </Container>
    </section>
  );
}

export default MyOrders;
