import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getGenreColour } from '../utils/colours';
import { seasonLabel } from '../utils/transforms';
import { useStudioDrillDown } from '../hooks/useStudioDrillDown';
import { ChartSkeleton } from '../components/SkeletonLoader';
import { formatMembers } from '../utils/format';

function TrendTooltip({ active, payload, label, mode, studio }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-3 text-xs"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '8px' }}
    >
      <p className="mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((entry) => {
        if (entry.dataKey === '_baseline' || entry.dataKey === '_membersBaseline') {
          const val = entry.dataKey === '_baseline' ? entry.value?.toFixed(2) : formatMembers(entry.value);
          return (
            <p key={entry.dataKey} style={{ color: entry.stroke }}>
              All Studios Avg: <strong>{val}</strong>
            </p>
          );
        }
        const val = mode === 'score' ? entry.value?.toFixed(2) : mode === 'members' ? formatMembers(entry.value) : entry.value;
        return (
          <p key={entry.dataKey} style={{ color: entry.stroke }}>
            {mode === 'count' ? 'Titles' : studio}: <strong>{val}</strong>
          </p>
        );
      })}
    </div>
  );
}

function GenreBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { genre, count } = payload[0].payload;
  return (
    <div
      className="p-2.5 text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
      }}
    >
      <p className="font-medium" style={{ color: getGenreColour(genre) }}>{genre}</p>
      <p style={{ color: 'var(--text-muted)' }}>{count} title{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

function TitleCard({ title, idx, onTitleClick, metric }) {
  return (
    <button
      onClick={() => onTitleClick?.(title)}
      className="w-full text-left p-2.5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid var(--border)',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="text-[10px] flex-shrink-0 pt-0.5"
          style={{ color: 'var(--text-muted)', minWidth: '16px' }}
        >
          #{idx + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <span className="text-xs font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {title.title}
            </span>
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: metric === 'score' ? 'rgba(167,139,250,0.15)' : 'rgba(244,114,182,0.12)',
                color:      metric === 'score' ? 'var(--accent-violet)' : '#f472b6',
                border:     `0.5px solid ${metric === 'score' ? 'rgba(167,139,250,0.4)' : 'rgba(244,114,182,0.4)'}`,
              }}
            >
              {metric === 'score' ? title.score?.toFixed(1) : formatMembers(title.members)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex-shrink-0">{seasonLabel(title.season, title.year)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

const MODE_TOGGLE = [
  { key: 'score',   label: 'Avg Score'   },
  { key: 'members', label: 'Avg Members' },
  { key: 'count',   label: 'Title Count' },
];

const TITLE_TABS = [
  { key: 'score',   label: 'Top Rated'    },
  { key: 'members', label: 'Most Watched' },
];

export default function StudioDrillDownPage({ onTitleClick }) {
  const { studio: studioParam } = useParams();
  const studio  = decodeURIComponent(studioParam);
  const navigate = useNavigate();

  const [trendMode, setTrendMode] = useState('score');
  const [titlesTab, setTitlesTab] = useState('score');

  const { trendData, genreData, topByScore, topByPopularity, stats, isLoading } = useStudioDrillDown(studio);

  const showSkeleton  = isLoading && !trendData.length;
  const activeTitles  = titlesTab === 'score' ? topByScore : topByPopularity;
  const trendKey    = trendMode === 'count' ? 'count' : trendMode === 'members' ? 'members' : 'score';
  const trendColour = trendMode === 'count' ? 'var(--accent-amber)' : trendMode === 'members' ? 'var(--accent-teal)' : 'var(--accent-violet)';

  const handleTrendMode = useCallback((key) => setTrendMode(key), []);
  const handleTitlesTab = useCallback((key) => setTitlesTab(key), []);

  const statTiles = stats ? [
    { label: 'Titles',       value: stats.totalTitles?.toLocaleString() ?? '—', c: 'var(--accent-violet)' },
    { label: 'Seasons',      value: stats.seasonsCount ?? '—',                  c: 'var(--accent-teal)' },
    { label: 'Avg Score',    value: stats.avgScore?.toFixed(2) ?? '—',          c: '#fbbf24' },
    { label: 'Avg Members',  value: formatMembers(stats.avgMembers),            c: '#f472b6' },
    {
      label: 'Top Genre',
      value: stats.topGenre ?? '—',
      c: stats.topGenre ? getGenreColour(stats.topGenre) : 'var(--text-muted)',
      onClick: stats.topGenre ? () => navigate(`/genres/${stats.topGenre}`) : undefined,
    },
  ] : [];

  const isEmpty = !isLoading && trendData.length === 0;

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
          {studio}
        </h1>
      </div>

      {/* Stat tiles */}
      {!showSkeleton && statTiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {statTiles.map(({ label, value, c, onClick }) => (
            <div
              key={label}
              className="p-3"
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: '12px',
                cursor: onClick ? 'pointer' : 'default',
              }}
              onClick={onClick}
            >
              <span className="text-[10px] block mb-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <p className="text-lg font-semibold leading-none truncate" style={{ color: c }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          className="p-8 flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No data for <strong style={{ color: 'var(--text-secondary)' }}>{studio}</strong> in the selected season range.
          </p>
        </div>
      )}

      {/* Body: two-column */}
      {!isEmpty && (
        <div className="flex flex-col md:flex-row gap-4">

          {/* Left: charts */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Trend over time */}
            {showSkeleton ? (
              <ChartSkeleton height={260} />
            ) : (
              <div
                className="p-4"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
                    Trend Over Time
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trendMode === 'count' ? 'Total titles per season' : trendMode === 'members' ? 'Avg AniList members per title' : 'Avg score per title'}
                    </span>
                  <div
                    className="flex gap-0.5 p-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', borderRadius: '8px' }}
                  >
                    {MODE_TOGGLE.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleTrendMode(key)}
                        className="text-xs px-3 py-1 rounded transition-all"
                        style={{
                          background: trendMode === key ? 'var(--accent-violet)' : 'transparent',
                          color:      trendMode === key ? '#fff' : 'var(--text-muted)',
                          border:     'none',
                          cursor:     'pointer',
                          fontWeight: trendMode === key ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: trendMode === 'members' ? 10 : -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="season"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      allowDecimals={trendMode !== 'count'}
                      tickFormatter={trendMode === 'members' ? formatMembers : undefined}
                      width={trendMode === 'members' ? 45 : undefined}
                    />
                    <Tooltip
                      content={(props) => <TrendTooltip {...props} mode={trendMode} studio={studio} />}
                    />
                    <Line
                      type="monotone"
                      dataKey={trendKey}
                      stroke={trendColour}
                      strokeWidth={2}
                      dot={{ fill: trendColour, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                    {(trendMode === 'score' || trendMode === 'members') && (
                      <Line
                        type="monotone"
                        dataKey={trendMode === 'score' ? '_baseline' : '_membersBaseline'}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        dot={{ fill: 'rgba(255,255,255,0.35)', r: 2, strokeWidth: 0 }}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>

                {(trendMode === 'score' || trendMode === 'members') && (
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: trendColour }} />
                      {studio}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-flex items-center w-3" style={{ height: '2px', gap: '1px' }}>
                        <span className="inline-block h-px w-1.5" style={{ background: 'rgba(255,255,255,0.35)' }} />
                        <span className="inline-block h-px w-0.5" style={{ background: 'transparent' }} />
                        <span className="inline-block h-px w-0.5" style={{ background: 'rgba(255,255,255,0.35)' }} />
                      </span>
                      All Studios
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Genre breakdown */}
            {!showSkeleton && genreData.length > 0 && (
              <div
                className="p-4"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
              >
                <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)', margin: 0 }}>
                  Genre Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={Math.max(120, genreData.length * 28)} style={{ marginTop: '1rem' }}>
                  <BarChart
                    layout="vertical"
                    data={genreData}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="genre"
                      tick={<GenreTick navigate={navigate} />}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<GenreBarTooltip />} wrapperStyle={{ zIndex: 30 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} activeBar={{ fillOpacity: 1 }}>
                      {genreData.map(({ genre }) => (
                        <Cell key={genre} fill={getGenreColour(genre)} fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right: ranked titles */}
          <aside className="w-full md:w-72 md:flex-shrink-0">
            {!showSkeleton && activeTitles.length > 0 && (
              <div
                className="p-4"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex gap-0.5 p-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', borderRadius: '8px' }}
                  >
                    {TITLE_TABS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleTitlesTab(key)}
                        className="text-xs px-3 py-1 rounded transition-all"
                        style={{
                          background: titlesTab === key ? 'var(--accent-violet)' : 'transparent',
                          color:      titlesTab === key ? '#fff' : 'var(--text-muted)',
                          border:     'none',
                          cursor:     'pointer',
                          fontWeight: titlesTab === key ? 600 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {activeTitles.map((title, idx) => (
                    <TitleCard
                      key={title.id}
                      title={title}
                      idx={idx}
                      onTitleClick={onTitleClick}
                      metric={titlesTab}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function GenreTick({ x, y, payload, navigate }) {
  return (
    <text
      x={x} y={y} dy={4}
      textAnchor="end"
      fill={getGenreColour(payload.value)}
      fontSize={11}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/genres/${payload.value}`)}
    >
      {payload.value}
    </text>
  );
}
