/** يُعرض أثناء تحميل حزمة الصفحة المطلوبة. */
function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback-spinner" aria-hidden="true" />
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

export default RouteFallback;
