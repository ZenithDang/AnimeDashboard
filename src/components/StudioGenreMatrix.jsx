import { useState, useMemo, Fragment, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMembers } from '../utils/format';

function cellColour(t, mode) {
  const opacity = 0.12 + t * 0.73;
  if (mode === 'score')   return `rgba(167, 139, 250, ${opacity.toFixed(2)})`;
  if (mode === 'members') return `rgba(45, 212, 191, ${opacity.toFixed(2)})`;
  return `rgba(251, 146, 60, ${opacity.toFixed(2)})`;
}

const StudioCell = memo(function StudioCell({ studio, genre, cell, mode, t }) {
  const [hover, setHover] = useState(false);

  if (!cell) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', height: '36px' }} />
    );
  }

  let displayValue, tooltipDetail, titles;

  if (mode === 'score') {
    displayValue  = cell.avgScore != null ? cell.avgScore.toFixed(1) : '—';
    tooltipDetail = cell.avgScore != null ? `Avg: ${cell.avgScore.toFixed(2)} · ${cell.count} title${cell.count !== 1 ? 's' : ''}` : `${cell.count} title${cell.count !== 1 ? 's' : ''} (unscored)`;
    titles        = cell.titlesScore;
  } else if (mode === 'members') {
    displayValue  = formatMembers(cell.avgMembers);
    tooltipDetail = `Avg: ${formatMembers(cell.avgMembers)} · ${cell.count} title${cell.count !== 1 ? 's' : ''}`;
    titles        = cell.titlesPopularity;
  } else {
    displayValue  = String(cell.count);
    tooltipDetail = `${cell.count} title${cell.count !== 1 ? 's' : ''}`;
    titles        = cell.titlesScore;
  }

  return (
    <div
      className="relative flex items-center justify-center text-xs font-medium cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: cellColour(t, mode),
        borderRadius: '6px',
        height: '36px',
        color: 'rgba(255,255,255,0.85)',
        transform: hover ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        zIndex: hover ? 2 : 1,
      }}
    >
      {displayValue}

      {hover && (
        <div
          className="absolute bottom-full left-1/2 mb-2 p-2 text-xs z-10"
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '8px',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            minWidth: '140px',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
            {studio} · {genre}
          </div>
          <div style={{ marginBottom: titles.length ? 4 : 0 }}>{tooltipDetail}</div>
          {titles.slice(0, 3).map((t) => (
            <div key={t.id} style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {t.title.length > 28 ? t.title.slice(0, 27) + '…' : t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function StudioGenreMatrix({ studioGenreData, selectedGenres, totalStudios }) {
  const [mode, setMode] = useState('score');
  const navigate = useNavigate();

  const { studios, matrix } = studioGenreData ?? {};

  const membersBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const studio of (studios ?? [])) {
      for (const genre of (selectedGenres ?? [])) {
        const val = matrix?.[studio]?.[genre]?.avgMembers;
        if (val) { min = Math.min(min, val); max = Math.max(max, val); }
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [matrix, studios, selectedGenres]);

  const countBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const studio of (studios ?? [])) {
      for (const genre of (selectedGenres ?? [])) {
        const val = matrix?.[studio]?.[genre]?.count;
        if (val) { min = Math.min(min, val); max = Math.max(max, val); }
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [matrix, studios, selectedGenres]);

  if (!studios?.length || !selectedGenres?.length) return null;

  const N = selectedGenres.length;

  const getT = (studio, genre) => {
    const cell = matrix[studio]?.[genre];
    if (!cell) return 0;
    if (mode === 'score') {
      return cell.avgScore != null ? Math.max(0, Math.min(1, (cell.avgScore - 6) / 3)) : 0;
    }
    if (mode === 'members') {
      const { min, max } = membersBounds;
      return max > min ? Math.max(0, Math.min(1, ((cell.avgMembers ?? 0) - min) / (max - min))) : 0;
    }
    const { min, max } = countBounds;
    return max > min ? Math.max(0, Math.min(1, (cell.count - min) / (max - min))) : 0;
  };

  const isMembers = mode === 'members';
  const isCount   = mode === 'titles';
  const gradientStyle = isMembers
    ? 'linear-gradient(to right, rgba(45,212,191,0.12), rgba(45,212,191,0.85))'
    : isCount
      ? 'linear-gradient(to right, rgba(251,146,60,0.12), rgba(251,146,60,0.85))'
      : 'linear-gradient(to right, rgba(167,139,250,0.12), rgba(167,139,250,0.85))';

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        overflowX: 'auto',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
            Studio × Genre Matrix
          </h2>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Top {studios.length}{totalStudios ? ` of ${totalStudios}` : ''} studios by title count in selected genres
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isMembers ? 'Avg AniList members per title' : isCount ? 'Total titles' : 'Avg score per title'}
          </span>

          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{isMembers ? formatMembers(membersBounds.min) : isCount ? countBounds.min : '6.0'}</span>
            <div className="h-2 rounded-full" style={{ width: '60px', background: gradientStyle }} />
            <span>{isMembers ? formatMembers(membersBounds.max) : isCount ? countBounds.max : '9.0'}</span>
          </div>

          <div
            className="flex gap-0.5 p-0.5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            {[
              { key: 'score',   label: 'Avg Score'   },
              { key: 'members', label: 'Avg Members' },
              { key: 'titles',  label: 'Title Count' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="text-xs px-3 py-1 rounded transition-all"
                style={{
                  background: mode === key ? 'var(--accent-violet)' : 'transparent',
                  color:      mode === key ? '#fff' : 'var(--text-muted)',
                  border:     'none',
                  cursor:     'pointer',
                  fontWeight: mode === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `120px repeat(${N}, minmax(44px, 1fr))` }}
      >
        {/* Header row */}
        <div />
        {selectedGenres.map((genre) => (
          <div
            key={genre}
            className="text-center text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {genre}
          </div>
        ))}

        {/* Studio rows */}
        {studios.map((studio) => (
          <Fragment key={studio}>
            <div
              className="flex items-center text-xs truncate pr-2"
              style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              title={studio}
              onClick={() => navigate(`/studios/${encodeURIComponent(studio)}`)}
            >
              {studio}
            </div>
            {selectedGenres.map((genre) => (
              <StudioCell
                key={genre}
                studio={studio}
                genre={genre}
                cell={matrix[studio]?.[genre] ?? null}
                mode={mode}
                t={getT(studio, genre)}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default memo(StudioGenreMatrix);
