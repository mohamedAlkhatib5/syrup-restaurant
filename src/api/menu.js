import { api } from './client';

/** أطباق القائمة. category اختياري ('All' يعني الكل). */
export async function fetchMenuItems({ category, signal } = {}) {
  const query =
    category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const payload = await api.get(`/menu-items${query}`, { auth: false, signal });
  return payload.data;
}

export async function fetchCategories({ signal } = {}) {
  const payload = await api.get('/categories', { auth: false, signal });
  return payload.data;
}
