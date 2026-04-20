export function LoadingBar({ visible }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'var(--accent-violet)',
          animation: 'loadingBar 1.4s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes loadingBar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function SkeletonBlock({ height = 16, width = '100%', className = '' }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{
        height,
        width,
        background: 'rgba(255,255,255,0.06)',
      }}
    />
  );
}

export function ChartSkeleton({ height = 300 }) {
  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div className="flex justify-between mb-4">
        <SkeletonBlock height={14} width={140} />
        <SkeletonBlock height={14} width={100} />
      </div>
      <div className="flex items-end gap-1" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t animate-pulse"
            style={{
              height: `${40 + Math.sin(i) * 30 + 30}%`,
              background: 'rgba(255,255,255,0.06)',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="p-3"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2 items-start">
            <SkeletonBlock height={40} width={4} />
            <div className="flex-1 flex flex-col gap-1.5">
              <SkeletonBlock height={12} width="80%" />
              <SkeletonBlock height={10} width="50%" />
              <div className="flex gap-1">
                <SkeletonBlock height={18} width={50} />
                <SkeletonBlock height={18} width={50} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-3"
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          <SkeletonBlock height={10} width={60} className="mb-2" />
          <SkeletonBlock height={24} width={80} />
        </div>
      ))}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="flex items-center justify-between p-3 text-xs"
      style={{
        background: 'rgba(248,113,113,0.08)',
        border: '0.5px solid rgba(248,113,113,0.3)',
        borderRadius: '8px',
        color: 'var(--accent-rose)',
      }}
    >
      <span>⚠ {message || 'Failed to load data from Anilist API.'}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-3 px-2.5 py-1 rounded transition-colors"
          style={{
            background: 'rgba(248,113,113,0.15)',
            border: '0.5px solid rgba(248,113,113,0.4)',
            color: 'var(--accent-rose)',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default SkeletonBlock;
