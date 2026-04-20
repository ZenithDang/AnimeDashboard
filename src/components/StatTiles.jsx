import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMembers } from '../utils/format';

function StatTiles({ stats }) {
  const navigate = useNavigate();
  if (!stats) return null;

  const tiles = [
    {
      label: 'Titles Tracked',
      value: stats.totalTitles.toLocaleString(),
      icon: '◈',
      colour: 'var(--accent-violet)',
    },
    {
      label: 'Seasons Covered',
      value: stats.seasonsCount,
      icon: '◷',
      colour: 'var(--accent-teal)',
    },
    {
      label: 'Top Genre',
      value: stats.topGenre,
      icon: '▲',
      colour: 'var(--accent-amber)',
    },
    {
      label: 'Avg Score',
      value: stats.avgScore ? stats.avgScore.toFixed(2) : '—',
      icon: '★',
      colour: '#fbbf24',
    },
    {
      label: 'Most Watched Genre',
      value: stats.mostWatchedGenre || '—',
      icon: '◉',
      colour: '#f472b6',
    },
    {
      label: 'Avg Popularity / Title',
      value: formatMembers(stats.avgMembers),
      icon: '◎',
      colour: 'var(--accent-teal)',
    },
  ];

  const genreLabels = new Set(['Top Genre', 'Most Watched Genre']);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {tiles.map(({ label, value, icon, colour }) => {
        const isGenre = genreLabels.has(label) && value && value !== '—';
        return (
          <div
            key={label}
            className="p-3"
            onClick={isGenre ? () => navigate(`/genres/${value}`) : undefined}
            style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              borderRadius: '12px',
              cursor: isGenre ? 'pointer' : 'default',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm" style={{ color: colour }}>{icon}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <p
              className="text-lg font-semibold leading-none truncate"
              style={{
                color: 'var(--text-primary)',
                textDecoration: isGenre ? 'underline' : 'none',
                textDecorationColor: 'var(--text-muted)',
                textUnderlineOffset: '3px',
              }}
            >
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default memo(StatTiles);
