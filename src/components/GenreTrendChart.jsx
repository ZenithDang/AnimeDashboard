import { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import useFilterStore from '../store/filterStore';
import useUiStore from '../store/uiStore';
import { getGenreColour } from '../utils/colours';
import { formatMembers } from '../utils/format';

function TrendTooltip({
  active, payload, label,
  aggregated, viewershipAggregated, mode, onTitleClick,
}) {
  if (!active || !payload?.length) return null;

  const seasonKey = payload[0]?.payload?._key;
  const isMembers = mode === 'members';
  const isCount   = mode === 'titles';

  return (
    <div
      className="p-3 text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: '280px',
        pointerEvents: 'all',
      }}
    >
      <p
        className="font-medium mb-2 pb-2"
        style={{ color: 'var(--text-primary)', borderBottom: '0.5px solid var(--border)' }}
      >
        {label}
      </p>
      {payload.map((entry) => {
        if (!entry.value) return null;
        const genre = entry.dataKey;

        // "All Genres" baseline — label and format depend on the active mode
        if (genre === '_baseline') {
          const baselineLabel = isMembers
            ? `${formatMembers(entry.value)} avg`
            : isCount
              ? `${entry.value} title${entry.value !== 1 ? 's' : ''}`
              : entry.value?.toFixed(2);
          return (
            <div key="_baseline" className="mb-2 last:mb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: entry.color }}>All Genres</span>
                <span style={{ color: 'var(--text-secondary)' }}>{baselineLabel}</span>
              </div>
            </div>
          );
        }

        const titles = isMembers
          ? (viewershipAggregated[seasonKey]?.[genre]?.titles?.slice(0, 3) || [])
          : isCount ? [] : (aggregated[seasonKey]?.[genre]?.titles?.slice(0, 3) || []);

        return (
          <div key={genre} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium" style={{ color: entry.color }}>{genre}</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {isMembers
                  ? `${formatMembers(entry.value)} avg`
                  : isCount
                    ? `${entry.value} title${entry.value !== 1 ? 's' : ''}`
                    : entry.value?.toFixed(2)}
              </span>
            </div>
            {titles.map((title) => (
              <button
                key={title.id}
                className="w-full text-left py-0.5 px-1 rounded transition-colors hover:bg-white/5 flex justify-between"
                onClick={() => onTitleClick(title)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <span className="truncate max-w-[170px] inline-block">{title.title}</span>
                <span style={{ color: entry.color, flexShrink: 0 }}>
                  {isMembers ? formatMembers(title.members) : title.score?.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function GenreTrendChart({
  trendData, aggregated,
  viewershipTrendData, viewershipAggregated,
  countTrendData,
  onTitleClick,
}) {
  const { selectedGenres } = useFilterStore();
  const navigate = useNavigate();
  const { chartMode: mode, setChartMode: setMode } = useUiStore();
  const [hoveredGenre, setHoveredGenre] = useState(null);

  const clearHover = useCallback(() => setHoveredGenre(null), []);

  const activeData = mode === 'score' ? trendData : mode === 'members' ? viewershipTrendData : countTrendData;

  const tooltipContent = useCallback(
    (props) => (
      <TrendTooltip
        {...props}
        aggregated={aggregated}
        viewershipAggregated={viewershipAggregated}
        mode={mode}
        onTitleClick={onTitleClick}
      />
    ),
    [aggregated, viewershipAggregated, mode, onTitleClick],
  );

  const enterHandlers = useMemo(
    () => Object.fromEntries(
      [...selectedGenres, '_baseline'].map((g) => [g, () => setHoveredGenre(g)])
    ),
    [selectedGenres],
  );

  if (!activeData?.length) return null;

  const isMembers = mode === 'members';
  const isCount   = mode === 'titles';

  return (
    <div
      className="p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
      onMouseLeave={clearHover}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
          Genre Trends
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isMembers ? 'Avg AniList members per title' : isCount ? 'Total titles per season' : 'Avg score per title'}
          </span>

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
              onClick={() => { setMode(key); setHoveredGenre(null); }}
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

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={activeData} margin={{ top: 5, right: 10, left: isMembers ? 10 : -10, bottom: 5 }} onMouseLeave={clearHover}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="season"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickLine={false}
          />
          {isMembers ? (
            <YAxis
              tickFormatter={formatMembers}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
          ) : isCount ? (
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          ) : (
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          )}
          <Tooltip content={tooltipContent} wrapperStyle={{ zIndex: 30 }} />
          {selectedGenres.map((genre) => {
            const colour    = getGenreColour(genre);
            const isHovered = hoveredGenre === genre;
            const isDimmed  = hoveredGenre && !isHovered;

            return (
              <Line
                key={`${genre}-${mode}`}
                type="monotone"
                dataKey={genre}
                stroke={colour}
                strokeWidth={isHovered ? 2.5 : 1.5}
                dot={{ fill: colour, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
                opacity={isDimmed ? 0.2 : 1}
                onMouseEnter={enterHandlers[genre]}
                style={{ transition: 'opacity 0.2s' }}
              />
            );
          })}
          <Line
            key="_baseline"
            type="monotone"
            dataKey="_baseline"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={hoveredGenre === '_baseline' ? 2 : 1.5}
            strokeDasharray="5 3"
            dot={{ fill: 'rgba(255,255,255,0.4)', r: 2, strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
            opacity={hoveredGenre && hoveredGenre !== '_baseline' ? 0.2 : 1}
            onMouseEnter={enterHandlers['_baseline']}
            style={{ transition: 'opacity 0.2s' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-3">
        {selectedGenres.map((genre) => (
          <div
            key={genre}
            className="flex items-center gap-1.5 text-xs cursor-pointer"
            style={{ color: hoveredGenre === genre ? getGenreColour(genre) : 'var(--text-secondary)' }}
            onMouseEnter={enterHandlers[genre]}
            onMouseLeave={clearHover}
            onClick={() => navigate(`/genres/${genre}`)}
          >
            <span
              className="inline-block w-3 h-0.5 rounded-full"
              style={{ background: getGenreColour(genre) }}
            />
            {genre}
          </div>
        ))}
        <div
          className="flex items-center gap-1.5 text-xs cursor-pointer"
          style={{ color: hoveredGenre === '_baseline' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
          onMouseEnter={enterHandlers['_baseline']}
          onMouseLeave={clearHover}
        >
          {/* Dashed line indicator */}
          <span className="inline-flex items-center w-3" style={{ height: '2px', gap: '1px' }}>
            <span className="inline-block h-px w-1.5" style={{ background: 'rgba(255,255,255,0.4)' }} />
            <span className="inline-block h-px w-0.5" style={{ background: 'transparent' }} />
            <span className="inline-block h-px w-0.5" style={{ background: 'rgba(255,255,255,0.4)' }} />
          </span>
          All Genres
        </div>
      </div>
    </div>
  );
}

export default memo(GenreTrendChart);
