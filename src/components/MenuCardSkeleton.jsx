/** هيكل بطاقة الطبق أثناء التحميل — يحجز نفس المساحة فيمنع القفز. */
function MenuCardSkeleton() {
  return (
    <article className="dish-item h-100 dish-skeleton" aria-hidden="true">
      <div className="skeleton-block skeleton-image" />
      <div className="dish-content p-4">
        <div className="skeleton-block skeleton-line skeleton-title" />
        <div className="skeleton-block skeleton-line" />
        <div className="skeleton-block skeleton-line skeleton-short" />
        <div className="skeleton-block skeleton-button" />
      </div>
    </article>
  );
}

export default MenuCardSkeleton;
