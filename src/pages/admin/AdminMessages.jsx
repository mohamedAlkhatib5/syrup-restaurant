import { useState } from 'react';

import { fetchContactMessages, markMessageRead } from '../../api/contact';
import DataState from '../../components/DataState';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useResource from '../../hooks/useResource';
import useToast from '../../hooks/useToast';

const SUBJECTS = {
  table_reservation: 'Table reservation',
  private_event: 'Private event',
  large_order: 'Large order',
  general_enquiry: 'General enquiry',
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminMessages() {
  useDocumentTitle('Messages');

  const { notify } = useToast();
  const [showRead, setShowRead] = useState(false);

  const resource = useResource(
    (options) =>
      fetchContactMessages({ isRead: showRead ? undefined : false, ...options }),
    [showRead]
  );

  const messages = resource.data?.data ?? [];

  const toggleRead = async (message) => {
    try {
      await markMessageRead(message.id, !message.isRead);
      resource.reload();
    } catch (error) {
      notify({ title: 'Could not update', body: error.message, variant: 'warning' });
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-filters" role="group" aria-label="Filter messages">
          <button
            type="button"
            className={!showRead ? 'is-active' : ''}
            onClick={() => setShowRead(false)}
            aria-pressed={!showRead}
          >
            Unread
          </button>

          <button
            type="button"
            className={showRead ? 'is-active' : ''}
            onClick={() => setShowRead(true)}
            aria-pressed={showRead}
          >
            All
          </button>
        </div>

        <span className="admin-count">{resource.data?.meta?.total ?? 0} messages</span>
      </div>

      <DataState
        isLoading={resource.isLoading}
        error={resource.error}
        isEmpty={messages.length === 0}
        onRetry={resource.reload}
        emptyTitle="No messages"
        emptyBody="Enquiries from the contact page land here."
      >
        <div className="message-list">
          {messages.map((message) => (
            <article key={message.id} className={message.isRead ? 'is-read' : ''}>
              <header>
                <div>
                  <strong>{message.fullName}</strong>
                  <span className="message-subject">
                    {SUBJECTS[message.subject] ?? message.subject}
                  </span>
                </div>

                <button type="button" onClick={() => toggleRead(message)}>
                  {message.isRead ? 'Mark unread' : 'Mark read'}
                </button>
              </header>

              <p className="message-body">{message.message}</p>

              <footer>
                <a href={`mailto:${message.email}`}>{message.email}</a>
                {message.phone ? (
                  <a href={`tel:${message.phone}`}>{message.phone}</a>
                ) : null}
                <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
              </footer>
            </article>
          ))}
        </div>
      </DataState>
    </>
  );
}

export default AdminMessages;
