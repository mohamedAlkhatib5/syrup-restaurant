import { api } from './client';

export async function sendContactMessage(message) {
  return api.post('/contact-messages', message, { auth: false });
}

export async function fetchContactMessages({ isRead, page = 1, signal } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (isRead !== undefined) params.set('isRead', String(isRead));

  return api.get(`/contact-messages?${params}`, { signal });
}

export async function markMessageRead(id, isRead = true) {
  const payload = await api.patch(`/contact-messages/${id}`, { isRead });
  return payload.data;
}
