import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import { useSeasonData } from '../hooks/useSeasonData';
import { getGenreColour } from '../utils/colours';
import { seasonLabel } from '../utils/transforms';
import { formatMembers } from '../utils/format';

function GemTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div
      className="p-3 text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: '220px',
        pointerEvents: 'none',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
      <p style={{ color: 'var(--text-muted)' }}>{d.studio} · {d.season}</p>
      <div className="flex gap-3 mt-1.5">
        <span style={{ color: '#fbbf24' }}>★ {d.y?.toFixed(1)}</span>
        <span style={{ color: 'var(--text-muted)' }}>{formatMembers(d.xRaw)} members</span>
      </div>
    </div>
  );
}

function GemCard({ entry, idx, popularityDeficit, onTitleClick }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => onTitleClick?.(entry)}
      className="w-full text-left p-2.5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid var(--border)',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] flex-shrink-0 pt-0.5" style={{ color: 'var(--text-muted)', minWidth: '16px' }}>
          #{idx + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <span className="text-xs font-medium leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {entry.title}
            </span>
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.3)' }}
            >
              ★ {entry.score?.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>{formatMembers(entry.members)} members</span>
            <span>·</span>
            <span className="flex-shrink-0">{seasonLabel(entry.season, entry.year)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {(entry.genres || []).slice(0, 2).map((g) => (
              <button
                key={g}
                onClick={(e) => { e.stopPropagation(); navigate(`/genres/${g}`); }}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${getGenreColour(g)} 12%, transparent)`,
                  color: getGenreColour(g),
                  border: `0.5px solid color-mix(in srgb, ${getGenreColour(g)} 30%, transparent)`,
                  cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
            {popularityDeficit > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0"
                style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--accent-teal)', border: '0.5px solid rgba(52,211,153,0.25)' }}
              >
                {popularityDeficit}% below avg
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const SCORE_THRESHOLDS = [7.0, 7.5, 8.0];
const OBSCURITY_PRESETS = [
  { pct: 25, label: 'High'   },
  { pct: 50, label: 'Medium' },
  { pct: 75, label: 'Low'    },
];

export default function DiscoverPage({ onTitleClick }) {
  const { entries, isLoading } = useSeasonData();
  const [minScore,   setMinScore]   = useState(7.5);
  const [popularity, setPopularity] = useState(50);

  // Percentile-based member cutoff for the "hidden" threshold
  const membersCutoff = useMemo(() => {
    const sorted = entries
      .filter((e) => e.members > 0)
      .map((e) => e.members)
      .sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.min(Math.floor(sorted.length * (popularity / 100)), sorted.length - 1)];
  }, [entries, popularity]);

  // Log-transform helpers — applied to X so Recharts plots on a pseudo-log scale
  const toLog  = (v) => Math.log10(Math.max(v, 1));
  const fromLog = (v) => Math.round(10 ** v);

  // X-axis log domain — start at actual data minimum, cap at 97th percentile
  const { xMinLog, xMaxLog } = useMemo(() => {
    const vals = entries.filter((e) => e.members > 0).map((e) => e.members).sort((a, b) => a - b);
    if (!vals.length) return { xMinLog: 0, xMaxLog: toLog(500_000) };
    const cap = vals[Math.floor(vals.length * 0.97)] ?? 500_000;
    return { xMinLog: toLog(vals[0]), xMaxLog: toLog(cap) };
  }, [entries]);

  const scatterData = useMemo(() =>
    entries
      .filter((e) => e.score > 0 && e.members > 0)
      .map((e) => ({
        x:      toLog(e.members),   // log-transformed for even axis distribution
        xRaw:   e.members,          // used in tooltip display
        y:      e.score,
        name:   e.title,
        studio: e.studio,
        season: seasonLabel(e.season, e.year),
        genre:  e.genres?.[0] || '',
        isGem:  e.score >= minScore && e.members <= membersCutoff,
        entry:  e,
      })),
    [entries, minScore, membersCutoff],
  );

  const avgMembers = useMemo(() => {
    const vals = entries.filter((e) => e.members > 0).map((e) => e.members);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  }, [entries]);

  const { gems, totalGemCount } = useMemo(() => {
    const qualifying = scatterData
      .filter((d) => d.isGem)
      .map((d) => ({
        ...d,
        // Composite: high score is primary, low popularity breaks ties (up to 0.5pt bonus)
        gemScore:          d.y - (d.xRaw / membersCutoff) * 0.5,
        popularityDeficit: avgMembers > 0 ? Math.max(0, Math.round((1 - d.xRaw / avgMembers) * 100)) : 0,
      }))
      .sort((a, b) => b.gemScore - a.gemScore);
    return { gems: qualifying.slice(0, 10), totalGemCount: qualifying.length };
  }, [scatterData, membersCutoff, avgMembers]);

  const dotShape = useCallback((props) => {
    const { cx, cy, isGem, entry } = props;
    const fill = isGem ? 'var(--accent-violet)' : 'rgba(255,255,255,0.18)';
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isGem ? 5 : 2.5}
        fill={fill}
        fillOpacity={isGem ? 0.85 : 1}
        style={{ cursor: isGem ? 'pointer' : 'default' }}
        onClick={() => isGem && onTitleClick?.(entry)}
      />
    );
  }, [onTitleClick]);

  const isEmpty = !isLoading && entries.length === 0;

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>
          Hidden Gem Finder
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Titles with high scores but low viewership — critically appreciated, under-watched.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Min score</span>
          <div
            className="flex gap-0.5 p-0.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', borderRadius: '8px' }}
          >
            {SCORE_THRESHOLDS.map((s) => (
              <button
                key={s}
                onClick={() => setMinScore(s)}
                className="text-xs px-3 py-1 rounded transition-all"
                style={{
                  background: minScore === s ? 'var(--accent-violet)' : 'transparent',
                  color:      minScore === s ? '#fff' : 'var(--text-muted)',
                  border:     'none',
                  cursor:     'pointer',
                  fontWeight: minScore === s ? 600 : 400,
                }}
              >
                {s.toFixed(1)}+
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Obscurity</span>
            <span className="text-[10px] block" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              How unknown must a gem be?
            </span>
          </div>
          <div
            className="flex gap-0.5 p-0.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid var(--border)', borderRadius: '8px' }}
          >
            {OBSCURITY_PRESETS.map(({ pct, label }) => (
              <button
                key={pct}
                onClick={() => setPopularity(pct)}
                className="text-xs px-3 py-1 rounded transition-all"
                style={{
                  background: popularity === pct ? 'var(--accent-violet)' : 'transparent',
                  color:      popularity === pct ? '#fff' : 'var(--text-muted)',
                  border:     'none',
                  cursor:     'pointer',
                  fontWeight: popularity === pct ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {totalGemCount} gem{totalGemCount !== 1 ? 's' : ''} found
          {totalGemCount > 10 && ' · top 10 in grid'}
          {membersCutoff > 0 && ` · ≤ ${formatMembers(membersCutoff)} members`}
        </span>
      </div>

      {/* Body */}
      {isEmpty ? (
        <div
          className="p-8 flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data loaded yet.</p>
        </div>
      ) : (
        <>
          {/* Scatter chart — full width */}
          <div
            className="p-4"
            style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Score vs Popularity
              </h2>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-violet)' }} />
                  Gem
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  Other
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 10, right: 10, left: -5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Members"
                  domain={[xMinLog, xMaxLog]}
                  tickFormatter={(v) => formatMembers(fromLog(v))}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  tickLine={false}
                  label={{
                    value: 'AniList members (log scale)',
                    position: 'insideBottom',
                    offset: -12,
                    fill: 'var(--text-muted)',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Score"
                  domain={['auto', 'auto']}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Score',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    fill: 'var(--text-muted)',
                    fontSize: 10,
                  }}
                />
                {membersCutoff > 0 && (
                  <ReferenceArea
                    x1={xMinLog}
                    x2={toLog(membersCutoff)}
                    y1={minScore}
                    y2={10}
                    fill="rgba(167,139,250,0.07)"
                    stroke="none"
                  />
                )}
                <ReferenceLine
                  y={minScore}
                  stroke="rgba(167,139,250,0.35)"
                  strokeDasharray="4 3"
                  label={{ value: `≥ ${minScore}`, position: 'insideTopLeft', fill: 'rgba(167,139,250,0.6)', fontSize: 10 }}
                />
                {membersCutoff > 0 && (
                  <ReferenceLine
                    x={toLog(membersCutoff)}
                    stroke="rgba(167,139,250,0.35)"
                    strokeDasharray="4 3"
                    label={{ value: `≤ ${formatMembers(membersCutoff)}`, position: 'insideTopRight', fill: 'rgba(167,139,250,0.6)', fontSize: 10 }}
                  />
                )}
                <Tooltip content={<GemTooltip />} wrapperStyle={{ zIndex: 30 }} />
                <Scatter data={scatterData} shape={dotShape} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Gem grid — below chart, responsive columns */}
          {gems.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
              No gems found. Try lowering the score threshold or increasing the popularity cutoff.
            </p>
          ) : (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                Top gems · ranked by score and obscurity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                {gems.map((d, idx) => (
                  <GemCard
                    key={d.entry.id}
                    entry={d.entry}
                    idx={idx}
                    popularityDeficit={d.popularityDeficit}
                    onTitleClick={onTitleClick}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
