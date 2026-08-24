import { FaExclamationTriangle, FaInbox } from 'react-icons/fa';

/**
 * حالات التحميل والخطأ والفراغ في مكوّن واحد.
 *
 * وجودها في مكان واحد يضمن أن كل صفحة تتعامل مع الثلاث حالات بنفس
 * الشكل، بدل أن تنسى صفحة إحداها.
 */
function DataState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  emptyTitle,
  emptyBody,
  children,
}) {
  if (isLoading) {
    return (
      skeleton ?? (
        <div
          className="data-state data-state-loading"
          aria-busy="true"
          aria-live="polite"
        />
      )
    );
  }

  if (error) {
    return (
      <div className="data-state" role="alert">
        <FaExclamationTriangle
          className="data-state-icon data-state-icon-warning"
          aria-hidden="true"
        />
        <h3>We could not load this</h3>
        <p>{error.message}</p>
        {onRetry ? (
          <button type="button" className="btn-primary-custom border-0" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="data-state">
        <FaInbox className="data-state-icon" aria-hidden="true" />
        <h3>{emptyTitle ?? 'Nothing here yet'}</h3>
        {emptyBody ? <p>{emptyBody}</p> : null}
      </div>
    );
  }

  return children;
}

export default DataState;
