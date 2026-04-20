import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGenreColour } from '../utils/colours';
import { formatMembers } from '../utils/format';

function TrendBadge({ trend }) {
  if (!trend) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (trend === 'up')   return <span style={{ color: '#34d399' }}>↑</span>;
  if (trend === 'down') return <span style={{ color: '#f87171' }}>↓</span>;
  return <span style={{ color: 'var(--text-muted)' }}>→</span>;
}

const COLUMNS = [
  { key: 'studio',     label: 'Studio',     align: 'left'  },
  { key: 'titleCount', label: 'Titles',     align: 'right' },
  { key: 'avgScore',   label: 'Avg Score',  align: 'right' },
  { key: 'avgMembers', label: 'Avg Members', align: 'right' },
  { key: 'topGenre',   label: 'Top Genre',  align: 'left'  },
  { key: 'trend',      label: 'Score Trend', align: 'center', title: 'Score trend: first half vs second half of selected seasons' },
];

function SortIcon({ dir }) {
  if (!dir) return <span style={{ color: 'var(--text-muted)', opacity: 0.35 }}>↕</span>;
  return <span style={{ color: 'var(--accent-violet)' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function StudioTable({ studioTableData }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('avgScore');
  const [sortDir, setSortDir] = useState('desc');

  if (!studioTableData?.length) return null;

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'studio' || key === 'topGenre' || key === 'trend' ? 'asc' : 'desc');
    }
  };

  const sorted = [...studioTableData].sort((a, b) => {
    let av = a[sortKey];
    let bv = b[sortKey];

    if (sortKey === 'trend') {
      const order = { up: 0, flat: 1, down: 2, null: 3 };
      av = order[av] ?? 3;
      bv = order[bv] ?? 3;
    } else if (typeof av === 'string' || typeof bv === 'string') {
      av = av ?? '';
      bv = bv ?? '';
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    } else {
      av = av ?? -Infinity;
      bv = bv ?? -Infinity;
    }

    return sortDir === 'asc' ? av - bv : bv - av;
  });

  return (
    <div
      className="p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px', overflowX: 'auto' }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
          All Studios
        </h2>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {studioTableData.length} studios · click a row to explore
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {COLUMNS.map(({ key, label, align, title }) => (
              <th
                key={key}
                title={title}
                onClick={() => handleSort(key)}
                style={{
                  textAlign: align,
                  padding: '6px 8px',
                  color: sortKey === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  fontSize: '11px',
                  borderBottom: '0.5px solid var(--border)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {label} <SortIcon dir={sortKey === key ? sortDir : null} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.studio}
              onClick={() => navigate(`/studios/${encodeURIComponent(row.studio)}`)}
              style={{
                cursor: 'pointer',
                borderBottom: i < sorted.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '8px 8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {row.studio}
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {row.titleCount}
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: row.avgScore ? '#fbbf24' : 'var(--text-muted)' }}>
                {row.avgScore?.toFixed(2) ?? '—'}
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {formatMembers(row.avgMembers)}
              </td>
              <td style={{ padding: '8px 8px' }}>
                {row.topGenre ? (
                  <span
                    onClick={(e) => { e.stopPropagation(); navigate(`/genres/${row.topGenre}`); }}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${getGenreColour(row.topGenre)} 12%, transparent)`,
                      color: getGenreColour(row.topGenre),
                      border: `0.5px solid color-mix(in srgb, ${getGenreColour(row.topGenre)} 30%, transparent)`,
                      cursor: 'pointer',
                    }}
                  >
                    {row.topGenre}
                  </span>
                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </td>
              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                <TrendBadge trend={row.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(StudioTable);
