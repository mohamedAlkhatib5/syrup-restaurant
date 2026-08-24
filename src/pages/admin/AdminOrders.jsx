import { useState } from 'react';
import { FaMapMarkerAlt, FaMotorcycle, FaPhoneAlt, FaStore } from 'react-icons/fa';

import { fetchOrders, updateOrderStatus } from '../../api/orders';
import DataState from '../../components/DataState';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useResource from '../../hooks/useResource';
import useToast from '../../hooks/useToast';
import { formatPrice } from '../../utils/currency';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'New' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'delivering', label: 'On the way' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

/** الخطوة التالية المنطقية لكل حالة، حتى يعمل الموظف بضغطة واحدة. */
const NEXT_STEP = {
  pending: { status: 'preparing', label: 'Accept' },
  confirmed: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'delivering', label: 'Send out' },
  ready: { status: 'delivering', label: 'Send out' },
  delivering: { status: 'completed', label: 'Mark delivered' },
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminOrders() {
  useDocumentTitle('Orders');

  const { notify } = useToast();
  const [filter, setFilter] = useState('');
  const [busyRef, setBusyRef] = useState(null);

  const resource = useResource(
    (options) => fetchOrders({ status: filter || undefined, limit: 50, ...options }),
    [filter]
  );

  const orders = resource.data?.data ?? [];
  const total = resource.data?.meta?.total ?? 0;

  const advance = async (order, status, label) => {
    setBusyRef(order.orderNumber);

    try {
      await updateOrderStatus(order.orderNumber, status);
      notify({ title: `${order.orderNumber} → ${label}`, variant: 'success' });
      resource.reload();
    } catch (error) {
      notify({
        title: 'Could not update the order',
        body: error.message,
        variant: 'warning',
      });
    } finally {
      setBusyRef(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-filters" role="group" aria-label="Filter orders by status">
          {FILTERS.map(({ id, label }) => (
            <button
              type="button"
              key={id || 'all'}
              className={filter === id ? 'is-active' : ''}
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="admin-count">{total} orders</span>
      </div>

      <DataState
        isLoading={resource.isLoading}
        error={resource.error}
        isEmpty={orders.length === 0}
        onRetry={resource.reload}
        emptyTitle="No orders here"
        emptyBody="Orders will appear the moment a customer places one."
      >
        <div className="order-board">
          {orders.map((order) => {
            const next = NEXT_STEP[order.status];
            const isDelivery = order.fulfilment === 'delivery';

            return (
              <article
                key={order.orderNumber}
                className={`order-card status-${order.status}`}
              >
                <header>
                  <div>
                    <strong className="order-ref">{order.orderNumber}</strong>
                    <span className="order-time">{formatTime(order.createdAt)}</span>
                  </div>

                  <span className={`status-pill status-${order.status}`}>
                    {order.status}
                  </span>
                </header>

                <ul className="order-lines">
                  {order.items.map((item) => (
                    <li key={item.name}>
                      <span className="qty">{item.quantity}&times;</span>
                      <span>{item.name}</span>
                      <b>{formatPrice(item.lineTotal)}</b>
                    </li>
                  ))}
                </ul>

                {order.notes ? <p className="order-note">“{order.notes}”</p> : null}

                <dl className="order-meta">
                  <div>
                    <dt>{isDelivery ? <FaMotorcycle /> : <FaStore />}</dt>
                    <dd>{isDelivery ? 'Delivery' : 'Pick up'}</dd>
                  </div>

                  <div>
                    <dt>
                      <FaPhoneAlt />
                    </dt>
                    <dd>
                      {order.customer.fullName} · {order.customer.phone}
                    </dd>
                  </div>

                  {isDelivery && order.address?.line ? (
                    <div>
                      <dt>
                        <FaMapMarkerAlt />
                      </dt>
                      <dd>{order.address.line}</dd>
                    </div>
                  ) : null}
                </dl>

                <footer>
                  <div className="order-total">
                    <span>
                      {order.paymentMethod === 'card' ? 'Paid by card' : 'Cash'} ·{' '}
                      {order.scheduledFor === 'asap' ? 'ASAP' : order.scheduledFor}
                    </span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>

                  <div className="order-actions">
                    {next ? (
                      <button
                        type="button"
                        className="btn-advance"
                        disabled={busyRef === order.orderNumber}
                        onClick={() => advance(order, next.status, next.label)}
                      >
                        {busyRef === order.orderNumber ? 'Saving…' : next.label}
                      </button>
                    ) : null}

                    {order.status !== 'cancelled' && order.status !== 'completed' ? (
                      <button
                        type="button"
                        className="btn-cancel"
                        disabled={busyRef === order.orderNumber}
                        onClick={() => advance(order, 'cancelled', 'Cancelled')}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </DataState>
    </>
  );
}

export default AdminOrders;
