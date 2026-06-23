export default function Loading() {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Category header skeleton */}
      <div style={{
        background: 'linear-gradient(180deg, #eef2ff 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '48px 0 32px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
            <div>
              <div className="skeleton" style={{ width: 220, height: 28, marginBottom: 8, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 140, height: 16, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="container section">
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
