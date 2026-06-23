export default function Loading() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero skeleton */}
      <div style={{ background: 'var(--gradient-hero)', padding: '80px 0 60px' }}>
        <div className="container">
          <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 20, marginBottom: 20 }} />
          <div className="skeleton" style={{ width: '55%', height: 48, borderRadius: 10, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '40%', height: 20, borderRadius: 6, marginBottom: 36 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 8 }} />
          </div>
        </div>
      </div>
      {/* Games grid skeleton */}
      <div className="container section">
        <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 28, borderRadius: 8 }} />
        <div className="grid-games">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 10 }} />
              <div style={{ padding: '8px 0' }}>
                <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 6, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '50%', height: 12, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
