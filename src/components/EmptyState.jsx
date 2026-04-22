export default function EmptyState({ heading, suggestion }) {
  return (
    <div
      className="p-8 flex flex-col items-center justify-center gap-2 text-center"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
    >
      <span style={{ fontSize: '28px', opacity: 0.4 }}>◌</span>
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{heading}</p>
      {suggestion && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{suggestion}</p>
      )}
    </div>
  );
}
