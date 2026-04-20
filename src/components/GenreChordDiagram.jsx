import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { chord } from 'd3-chord';
import { arc } from 'd3-shape';
import { ribbon } from 'd3-chord';
import { getGenreColour } from '../utils/colours';

const OUTER_R = 140;
const INNER_R = 118;
const LABEL_R = OUTER_R + 16;
const VIEW    = 340;

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const arcGen      = arc().innerRadius(INNER_R).outerRadius(OUTER_R);
const ribbonGen   = ribbon().radius(INNER_R);
const chordLayout = chord().padAngle(0.03).sortSubgroups((a, b) => b - a);

function textAnchor(midAngle) {
  const s = Math.sin(midAngle);
  return s > 0.1 ? 'start' : s < -0.1 ? 'end' : 'middle';
}

// hovered: null | { type: 'group', index } | { type: 'chord', si, ti }
function ribbonStyle(ch, hovered, color) {
  const si = ch.source.index;
  const ti = ch.target.index;

  if (!hovered) return { fill: hexToRgba(color, 0.45), stroke: hexToRgba(color, 0.65), strokeWidth: 0.5 };

  if (hovered.type === 'group') {
    const active = hovered.index === si || hovered.index === ti;
    return active
      ? { fill: hexToRgba(color, 0.6),  stroke: hexToRgba(color, 0.8), strokeWidth: 1 }
      : { fill: hexToRgba(color, 0.05), stroke: hexToRgba(color, 0.1), strokeWidth: 0.5 };
  }

  // chord hover
  const isThis    = (hovered.si === si && hovered.ti === ti) || (hovered.si === ti && hovered.ti === si);
  const isRelated = hovered.si === si || hovered.si === ti || hovered.ti === si || hovered.ti === ti;
  if (isThis)    return { fill: hexToRgba(color, 0.75), stroke: hexToRgba(color, 0.95), strokeWidth: 1.5 };
  if (isRelated) return { fill: hexToRgba(color, 0.2),  stroke: hexToRgba(color, 0.35), strokeWidth: 0.5 };
  return           { fill: hexToRgba(color, 0.04), stroke: hexToRgba(color, 0.08), strokeWidth: 0.5 };
}

function arcOpacity(index, hovered) {
  if (!hovered) return 0.9;
  if (hovered.type === 'group') return hovered.index === index ? 0.95 : 0.25;
  return (hovered.si === index || hovered.ti === index) ? 0.95 : 0.25;
}

function infoLine(hovered, genreOrder, matrix) {
  if (!hovered) return 'Hover an arc to highlight connections · Hover a ribbon to see a pair';
  if (hovered.type === 'group') {
    const genre = genreOrder[hovered.index];
    const total = matrix[genre]?.[genre]?.count ?? 0;
    return `${genre} — ${total} title${total !== 1 ? 's' : ''}`;
  }
  const a     = genreOrder[hovered.si];
  const b     = genreOrder[hovered.ti];
  const count = matrix[a]?.[b]?.count ?? 0;
  return `${a} × ${b} — ${count} shared title${count !== 1 ? 's' : ''}`;
}

function GenreChordDiagram({ cooccurrence }) {
  const { matrix, genreOrder } = cooccurrence ?? {};
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const { chords: chordData, groups } = useMemo(() => {
    if (!genreOrder?.length || genreOrder.length < 2) return { chords: [], groups: [] };

    const mat = genreOrder.map((a, i) =>
      genreOrder.map((b, j) => (i === j ? 0 : (matrix[a]?.[b]?.count ?? 0))),
    );

    const ch = chordLayout(mat);
    return { chords: ch, groups: ch.groups };
  }, [matrix, genreOrder]);

  if (!genreOrder?.length || genreOrder.length < 2) {
    return (
      <div
        className="p-4 flex items-center justify-center"
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px',
          minHeight: '80px',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        Select at least 2 genres to see co-occurrence
      </div>
    );
  }

  const half = VIEW / 2;

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
          Genre Co-occurrence
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Arc size = total titles · Ribbon width = shared titles
        </span>
      </div>

      <svg
        viewBox={`${-half} ${-half} ${VIEW} ${VIEW}`}
        style={{ width: '100%', maxHeight: '420px', display: 'block', overflow: 'visible' }}
      >
        {/* Ribbons — rendered before arcs so arcs sit on top */}
        <g>
          {chordData.map((ch, i) => {
            const si    = ch.source.index;
            const color = getGenreColour(genreOrder[si]);
            const s     = ribbonStyle(ch, hovered, color);
            return (
              <path
                key={i}
                d={ribbonGen(ch)}
                fill={s.fill}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                style={{ transition: 'fill 0.15s, stroke 0.15s, stroke-width 0.15s', cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ type: 'chord', si, ti: ch.target.index })}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </g>

        {/* Outer arcs + labels */}
        <g>
          {groups.map((group) => {
            const genre    = genreOrder[group.index];
            const color    = getGenreColour(genre);
            const opacity  = arcOpacity(group.index, hovered);
            const midAngle = (group.startAngle + group.endAngle) / 2;
            const lx       = LABEL_R * Math.sin(midAngle);
            const ly       = -LABEL_R * Math.cos(midAngle);
            const faded    = opacity < 0.5;

            return (
              <g
                key={group.index}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered({ type: 'group', index: group.index })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => navigate(`/genres/${genre}`)}
              >
                <path
                  d={arcGen(group)}
                  fill={hexToRgba(color, opacity)}
                  style={{ transition: 'fill 0.15s' }}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={textAnchor(midAngle)}
                  dominantBaseline="middle"
                  fontSize={10}
                  style={{
                    fill: faded ? 'var(--text-muted)' : 'var(--text-secondary)',
                    transition: 'fill 0.15s',
                    userSelect: 'none',
                  }}
                >
                  {genre}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)', minHeight: '16px' }}>
        {infoLine(hovered, genreOrder, matrix)}
      </p>
    </div>
  );
}

export default memo(GenreChordDiagram);
