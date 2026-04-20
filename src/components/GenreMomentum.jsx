import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import useUiStore from '../store/uiStore';
import { formatMembers } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

function GenreTick({ x, y, payload }) {
  const navigate = useNavigate();
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="var(--text-secondary)"
      fontSize={11}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/genres/${payload.value}`)}
    >
      {payload.value}
    </text>
  );
}

function formatValue(value, mode) {
  if (value == null) return '—';
  if (mode === 'members') return formatMembers(value);
  if (mode === 'titles') return `${value} title${value !== 1 ? 's' : ''}`;
  return value.toFixed(2);
}

function MomentumTooltip({ active, payload, mode }) {
  if (!active || !payload?.[0]) return null;
  const { genre, change, first, last } = payload[0].payload;
  return (
    <div
      className="p-3 text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{genre}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        {formatValue(first, mode)} → {formatValue(last, mode)}
      </p>
      <p style={{ color: change >= 0 ? 'var(--accent-teal)' : 'var(--accent-amber)' }}>
        {change >= 0 ? '+' : ''}{change}%
      </p>
    </div>
  );
}

const MODES = [
  { key: 'score',   label: 'Avg Score'   },
  { key: 'members', label: 'Avg Members' },
  { key: 'titles',  label: 'Title Count' },
];

const SUBTITLES = {
  score:   'Score % change over period',
  members: 'AniList members % change over period',
  titles:  'Title count % change over period',
};

function GenreMomentum({ momentumData, viewershipMomentumData, countMomentumData }) {
  const { momentumMode: mode, setMomentumMode: setMode } = useUiStore();

  const activeData = mode === 'score' ? momentumData
    : mode === 'members' ? viewershipMomentumData
    : countMomentumData;

  if (!activeData?.length) return null;

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
          Genre Momentum
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {SUBTITLES[mode]}
          </span>

          <div
            className="flex gap-0.5 p-0.5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            {MODES.map(({ key, label }) => (
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

      <ResponsiveContainer width="100%" height={Math.max(200, activeData.length * 36)}>
        <BarChart
          layout="vertical"
          data={activeData}
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickLine={false}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
          />
          <YAxis
            type="category"
            dataKey="genre"
            tick={<GenreTick />}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={(props) => <MomentumTooltip {...props} mode={mode} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="change" radius={[0, 4, 4, 0]}>
            {activeData.map((entry) => (
              <Cell
                key={entry.genre}
                fill={entry.change >= 0 ? 'var(--accent-teal)' : 'var(--accent-amber)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'var(--accent-teal)' }} />
          Rising
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'var(--accent-amber)' }} />
          Declining
        </span>
      </div>
    </div>
  );
}

export default memo(GenreMomentum);
