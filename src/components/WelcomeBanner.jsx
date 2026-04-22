import { useState } from 'react';

const STORAGE_KEY = 'animepulse_welcomed';

const FEATURES = [
  { colour: 'var(--accent-amber)',  icon: '▲', label: 'Genres',   desc: 'Track how genres trend in score, popularity, and momentum over time' },
  { colour: 'var(--accent-violet)', icon: '◈', label: 'Studios',  desc: 'Compare studios by output quality, popularity, and genre specialisation' },
  { colour: 'var(--accent-teal)',   icon: '◎', label: 'Discover', desc: 'Find critically-appreciated anime that flew under the radar' },
];

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEY),
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="w-full p-4 relative"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderLeft: '3px solid var(--accent-violet)',
        borderRadius: '12px',
      }}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
        className="absolute top-3 right-3 text-xs leading-none"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        ✕
      </button>

      <p
        className="text-sm font-semibold mb-1 pr-6"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        Welcome to AnimePulse
      </p>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        An analytics dashboard for seasonal anime trends — explore what's rising, what studios are dominating, and what's worth watching.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        {FEATURES.map(({ colour, icon, label, desc }) => (
          <div
            key={label}
            className="flex items-start gap-2 flex-1"
            style={{
              background: `color-mix(in srgb, ${colour} 6%, transparent)`,
              border: `0.5px solid color-mix(in srgb, ${colour} 20%, transparent)`,
              borderRadius: '8px',
              padding: '8px 10px',
            }}
          >
            <span style={{ color: colour, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: colour }}>{label}</p>
              <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
        Use the filter bar above to adjust the season range and genres. Click any title to see details.
      </p>
    </div>
  );
}
