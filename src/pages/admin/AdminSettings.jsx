import { useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';

import { fetchSettings, updateSettings } from '../../api/settings';
import DataState from '../../components/DataState';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useResource from '../../hooks/useResource';
import useToast from '../../hooks/useToast';

function AdminSettings() {
  useDocumentTitle('Settings');

  const { notify } = useToast();
  const resource = useResource((options) => fetchSettings(options), []);

  const [edits, setEdits] = useState(null);
  const [saving, setSaving] = useState(false);

  // النموذج مشتق: ما لم يعدّل المستخدم شيئًا فهو انعكاس مباشر لما
  // وصل من الخادم. هذا يغني عن effect يزامن الحالتين.
  const draft = edits ?? resource.data;

  const patch = (changes) =>
    setEdits((current) => ({ ...(current ?? resource.data), ...changes }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await updateSettings({
        deliveryFee: Number(draft.deliveryFee),
        minimumOrder: Number(draft.minimumOrder),
        estimatedDeliveryMinutes: draft.estimatedDeliveryMinutes.map(Number),
        estimatedPickupMinutes: draft.estimatedPickupMinutes.map(Number),
        isAcceptingOrders: draft.isAcceptingOrders,
      });

      setEdits(saved);
      notify({
        title: 'Settings saved',
        body: 'New orders use these values.',
        variant: 'success',
      });
    } catch (error) {
      notify({ title: 'Could not save', body: error.message, variant: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  const field = (name) => (event) => patch({ [name]: event.target.value });

  const range = (name, index) => (event) => {
    const next = draft[name].map((value, i) =>
      i === index ? event.target.value : value
    );
    patch({ [name]: next });
  };

  return (
    <DataState
      isLoading={resource.isLoading || !draft}
      error={resource.error}
      onRetry={resource.reload}
    >
      {draft ? (
        <Form className="admin-panel" onSubmit={save}>
          <h2>Ordering</h2>

          <Form.Check
            type="switch"
            id="accepting-orders"
            label="Accepting orders"
            checked={draft.isAcceptingOrders}
            onChange={(event) => patch({ isAcceptingOrders: event.target.checked })}
          />
          <p className="admin-hint">
            Turn this off and the site stops taking new orders immediately. Orders already
            placed are unaffected.
          </p>

          <hr />

          <h2>Charges</h2>

          <Row className="g-3">
            <Form.Group as={Col} md={6} controlId="delivery-fee">
              <Form.Label>Delivery fee ({draft.currency})</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.5"
                value={draft.deliveryFee}
                onChange={field('deliveryFee')}
              />
              <Form.Text>
                Applied to delivery orders only. Pick-up is always free.
              </Form.Text>
            </Form.Group>

            <Form.Group as={Col} md={6} controlId="minimum-order">
              <Form.Label>Minimum order ({draft.currency})</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={draft.minimumOrder}
                onChange={field('minimumOrder')}
              />
              <Form.Text>Zero means no minimum.</Form.Text>
            </Form.Group>
          </Row>

          <hr />

          <h2>Wait times</h2>

          <Row className="g-3">
            <Form.Group as={Col} sm={6} md={3} controlId="delivery-min">
              <Form.Label>Delivery from</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={draft.estimatedDeliveryMinutes[0]}
                onChange={range('estimatedDeliveryMinutes', 0)}
              />
            </Form.Group>

            <Form.Group as={Col} sm={6} md={3} controlId="delivery-max">
              <Form.Label>Delivery to (min)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={draft.estimatedDeliveryMinutes[1]}
                onChange={range('estimatedDeliveryMinutes', 1)}
              />
            </Form.Group>

            <Form.Group as={Col} sm={6} md={3} controlId="pickup-min">
              <Form.Label>Pick up from</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={draft.estimatedPickupMinutes[0]}
                onChange={range('estimatedPickupMinutes', 0)}
              />
            </Form.Group>

            <Form.Group as={Col} sm={6} md={3} controlId="pickup-max">
              <Form.Label>Pick up to (min)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={draft.estimatedPickupMinutes[1]}
                onChange={range('estimatedPickupMinutes', 1)}
              />
            </Form.Group>
          </Row>

          <button type="submit" className="admin-save" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </Form>
      ) : null}
    </DataState>
  );
}

export default AdminSettings;
