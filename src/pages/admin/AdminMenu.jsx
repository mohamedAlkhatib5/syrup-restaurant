import { useState } from 'react';
import { Form } from 'react-bootstrap';

import { api } from '../../api/client';
import { fetchCategories } from '../../api/menu';
import DataState from '../../components/DataState';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useResource from '../../hooks/useResource';
import useToast from '../../hooks/useToast';
import { formatPrice } from '../../utils/currency';

const EMPTY_DRAFT = {
  name: '',
  categoryId: '',
  price: '',
  description: '',
  image: '',
  isAvailable: true,
};

function AdminMenu() {
  useDocumentTitle('Menu');

  const { notify } = useToast();
  const [draft, setDraft] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = useResource((options) => fetchCategories(options), []);
  // الإدارة ترى الأطباق المخفية أيضًا، بخلاف الواجهة العامة.
  const items = useResource(
    (options) => api.get('/menu-items?includeUnavailable=true', options),
    []
  );

  const dishes = items.data?.data ?? [];

  const field = (name) => (event) =>
    setDraft((current) => ({ ...current, [name]: event.target.value }));

  const startNew = () =>
    setDraft({ ...EMPTY_DRAFT, categoryId: String(categories.data?.[0]?.id ?? '') });

  const startEdit = (dish) =>
    setDraft({
      id: dish.id,
      name: dish.name,
      categoryId: String(
        categories.data?.find((category) => category.name === dish.category)?.id ?? ''
      ),
      price: String(dish.price),
      description: dish.description,
      image: dish.image,
      isAvailable: dish.isAvailable,
    });

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: draft.name.trim(),
      categoryId: Number(draft.categoryId),
      price: Number(draft.price),
      description: draft.description.trim(),
      image: draft.image.trim(),
      isAvailable: draft.isAvailable,
    };

    try {
      if (draft.id) {
        await api.patch(`/menu-items/${draft.id}`, payload);
        notify({ title: 'Dish updated', variant: 'success' });
      } else {
        await api.post('/menu-items', payload);
        notify({ title: 'Dish added', variant: 'success' });
      }

      setDraft(null);
      items.reload();
    } catch (error) {
      notify({
        title: 'Could not save the dish',
        body: error.message,
        variant: 'warning',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (dish) => {
    setBusyId(dish.id);

    try {
      await api.patch(`/menu-items/${dish.id}`, { isAvailable: !dish.isAvailable });
      items.reload();
    } catch (error) {
      notify({ title: 'Could not update', body: error.message, variant: 'warning' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-count">{dishes.length} dishes</span>

        <button type="button" className="admin-save admin-save-inline" onClick={startNew}>
          Add a dish
        </button>
      </div>

      {draft ? (
        <Form className="admin-panel" onSubmit={save}>
          <h2>{draft.id ? 'Edit dish' : 'New dish'}</h2>

          <Form.Group controlId="dish-name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control value={draft.name} onChange={field('name')} required />
          </Form.Group>

          <div className="admin-grid-2">
            <Form.Group controlId="dish-category">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={draft.categoryId}
                onChange={field('categoryId')}
                required
              >
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="dish-price">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.5"
                value={draft.price}
                onChange={field('price')}
                required
              />
            </Form.Group>
          </div>

          <Form.Group controlId="dish-description" className="mt-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={draft.description}
              onChange={field('description')}
              required
            />
          </Form.Group>

          <Form.Group controlId="dish-image" className="mt-3 mb-3">
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="url"
              value={draft.image}
              onChange={field('image')}
              required
              placeholder="https://…"
            />
          </Form.Group>

          <Form.Check
            type="switch"
            id="dish-available"
            label="Available to order"
            checked={draft.isAvailable}
            onChange={(event) =>
              setDraft((current) => ({ ...current, isAvailable: event.target.checked }))
            }
          />

          <div className="admin-panel-actions">
            <button type="submit" className="admin-save" disabled={saving}>
              {saving ? 'Saving…' : 'Save dish'}
            </button>

            <button type="button" className="btn-cancel" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </Form>
      ) : null}

      <DataState
        isLoading={items.isLoading}
        error={items.error}
        isEmpty={dishes.length === 0}
        onRetry={items.reload}
        emptyTitle="The menu is empty"
        emptyBody="Add your first dish to get started."
      >
        <div className="dish-table" role="table">
          {dishes.map((dish) => (
            <div className="dish-row" role="row" key={dish.id}>
              <img src={dish.image} alt="" width={52} height={52} loading="lazy" />

              <div className="dish-row-main">
                <strong>{dish.name}</strong>
                <span>{dish.category}</span>
              </div>

              <span className="dish-row-price">{formatPrice(dish.price)}</span>

              <span className={`availability ${dish.isAvailable ? 'is-on' : 'is-off'}`}>
                {dish.isAvailable ? 'Available' : 'Hidden'}
              </span>

              <div className="dish-row-actions">
                <button type="button" onClick={() => startEdit(dish)}>
                  Edit
                </button>

                <button
                  type="button"
                  disabled={busyId === dish.id}
                  onClick={() => toggleAvailability(dish)}
                >
                  {dish.isAvailable ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DataState>
    </>
  );
}

export default AdminMenu;
