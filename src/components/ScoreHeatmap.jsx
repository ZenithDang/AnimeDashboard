import { useState, useMemo, Fragment, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { seasonLabel } from '../utils/transforms';
import { formatMembers } from '../utils/format';
import { getSeasonColour } from '../utils/colours';

/** Opacity-based cell colour — accent colour scales from 12% to 85% opacity */
function cellColour(t, mode) {
  const opacity = 0.12 + t * 0.73;
  if (mode === 'score')   return `rgba(167, 139, 250, ${opacity.toFixed(2)})`; // violet
  if (mode === 'members') return `rgba(45, 212, 191, ${opacity.toFixed(2)})`;  // teal
  return `rgba(251, 146, 60, ${opacity.toFixed(2)})`;                          // orange
}

const HeatCell = memo(function HeatCell({ genre, season, year, data, mode, membersBounds, countBounds }) {
  const [hover, setHover] = useState(false);

  if (!data) {
    return (
      <div
        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', height: '36px' }}
      />
    );
  }

  let t, displayValue, tooltipDetail;

  if (mode === 'score') {
    const { avg, count } = data;
    t             = Math.max(0, Math.min(1, (avg - 6) / 3));
    displayValue  = avg?.toFixed(1);
    tooltipDetail = `Avg: ${avg?.toFixed(2)} · ${count} title${count !== 1 ? 's' : ''}`;
  } else if (mode === 'members') {
    const { avgMembers, count } = data;
    const { min, max } = membersBounds;
    t             = max > min ? Math.max(0, Math.min(1, (avgMembers - min) / (max - min))) : 0;
    displayValue  = formatMembers(avgMembers);
    tooltipDetail = `Avg: ${formatMembers(avgMembers)} · ${count} title${count !== 1 ? 's' : ''}`;
  } else {
    const count = data;
    const { min, max } = countBounds;
    t             = max > min ? Math.max(0, Math.min(1, (count - min) / (max - min))) : 0;
    displayValue  = String(count);
    tooltipDetail = `${count} title${count !== 1 ? 's' : ''}`;
  }

  const bg = cellColour(t, mode);

  return (
    <div
      className="relative flex items-center justify-center text-xs font-medium cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: bg,
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
          className="absolute bottom-full left-1/2 mb-2 p-2 text-xs whitespace-nowrap z-10"
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '8px',
            transform: 'translateX(-50%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{genre}</span>
          {' · '}
          <span style={{ color: 'var(--text-secondary)' }}>{seasonLabel(season, year)}</span>
          <br />
          {tooltipDetail}
        </div>
      )}
    </div>
  );
});

function ScoreHeatmap({ aggregated, viewershipAggregated, countAggregated, seasonRange, selectedGenres }) {
  const [mode, setMode] = useState('score');
  const navigate = useNavigate();

  // Compute min/max across visible cells for relative members normalisation
  const membersBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const genre of selectedGenres) {
      for (const { season, year } of seasonRange) {
        const val = viewershipAggregated[`${season}-${year}`]?.[genre]?.avgMembers;
        if (val) { min = Math.min(min, val); max = Math.max(max, val); }
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [viewershipAggregated, selectedGenres, seasonRange]);

  const countBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const genre of selectedGenres) {
      for (const { season, year } of seasonRange) {
        const val = countAggregated[`${season}-${year}`]?.[genre];
        if (val) { min = Math.min(min, val); max = Math.max(max, val); }
      }
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [countAggregated, selectedGenres, seasonRange]);

  if (!aggregated || !seasonRange?.length || !selectedGenres?.length) return null;

  const isMembers        = mode === 'members';
  const isCount          = mode === 'titles';
  const activeAggregated = isCount ? countAggregated : isMembers ? viewershipAggregated : aggregated;
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
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
          Genre Heatmap
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isMembers ? 'Avg AniList members per title' : isCount ? 'Total titles per season' : 'Avg score per title'}
          </span>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              {isMembers ? formatMembers(membersBounds.min) : isCount ? countBounds.min : '6.0'}
            </span>
            <div className="h-2 rounded-full" style={{ width: '60px', background: gradientStyle }} />
            <span>
              {isMembers ? formatMembers(membersBounds.max) : isCount ? countBounds.max : '9.0'}
            </span>
          </div>

          {/* Tab toggle */}
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
        style={{ gridTemplateColumns: `80px repeat(${seasonRange.length}, minmax(44px, 1fr))` }}
      >
        {/* Header row */}
        <div />
        {seasonRange.map(({ season, year }) => (
          <div
            key={`${season}-${year}`}
            className="text-center text-[11px]"
            style={{ color: getSeasonColour(season) }}
          >
            {seasonLabel(season, year)}
          </div>
        ))}

        {/* Genre rows */}
        {selectedGenres.map((genre) => (
          <Fragment key={genre}>
            <div
              className="flex items-center text-xs truncate pr-2 cursor-pointer hover:underline"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => navigate(`/genres/${genre}`)}
            >
              {genre}
            </div>
            {seasonRange.map(({ season, year }) => {
              const key  = `${season}-${year}`;
              const data = activeAggregated[key]?.[genre] || null;
              return (
                <HeatCell
                  key={`${genre}-${key}`}
                  genre={genre}
                  season={season}
                  year={year}
                  data={data}
                  mode={mode}
                  membersBounds={membersBounds}
                  countBounds={countBounds}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default memo(ScoreHeatmap);
