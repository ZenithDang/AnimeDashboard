import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGenreColour } from '../utils/colours';
import { seasonLabel } from '../utils/transforms';
import { formatMembers } from '../utils/format';

function TitleRow({ title, idx, mode, highlightedId, onTitleClick }) {
  const isHighlighted = highlightedId === title.id;
  const genreColour   = getGenreColour(title.comparedGenre || title.genres?.[0] || '');
  const isBreakout    = mode === 'breakout';
  const navigate      = useNavigate();

  const accentColour  = isBreakout ? 'rgba(167,139,250,' : 'rgba(244,114,182,';

  return (
    <button
      onClick={() => onTitleClick(title)}
      className="w-full text-left p-2.5 transition-all"
      style={{
        background: isHighlighted ? `${accentColour}0.08)` : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${isHighlighted ? `${accentColour}0.35)` : 'var(--border)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Rank + colour block */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
          <div className="w-1.5 h-8 rounded-full" style={{ background: genreColour, opacity: 0.7 }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span
              className="text-xs font-medium leading-tight line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {title.title}
            </span>

            {/* Primary badge — score (breakout) or members (most watched) */}
            {isBreakout ? (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${title.score >= 8 ? 'var(--accent-teal)' : title.score >= 7 ? 'var(--accent-violet)' : 'var(--text-muted)'} 15%, transparent)`,
                  border: `0.5px solid ${title.score >= 8 ? 'var(--accent-teal)' : title.score >= 7 ? 'var(--accent-violet)' : 'var(--text-muted)'}`,
                  color: title.score >= 8 ? 'var(--accent-teal)' : title.score >= 7 ? 'var(--accent-violet)' : 'var(--text-muted)',
                }}
              >
                {title.score?.toFixed(1)}
              </span>
            ) : (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: 'rgba(244,114,182,0.12)',
                  border: '0.5px solid rgba(244,114,182,0.4)',
                  color: '#f472b6',
                }}
              >
                {formatMembers(title.members)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>{title.studio}</span>
            <span>·</span>
            <span>{seasonLabel(title.season, title.year)}</span>
            {title.episodes && (
              <>
                <span>·</span>
                <span>{title.episodes} ep{title.episodes !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5">
            {(title.genres || []).slice(0, 3).map((genre) => (
              <button
                key={genre}
                onClick={(e) => { e.stopPropagation(); navigate(`/genres/${genre}`); }}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${getGenreColour(genre)} 12%, transparent)`,
                  color: getGenreColour(genre),
                  border: `0.5px solid color-mix(in srgb, ${getGenreColour(genre)} 30%, transparent)`,
                  cursor: 'pointer',
                }}
              >
                {genre}
              </button>
            ))}

            {/* Secondary badge */}
            {isBreakout && title.delta != null && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                style={{
                  color: 'var(--accent-teal)',
                  background: 'rgba(52,211,153,0.1)',
                  border: '0.5px solid rgba(52,211,153,0.3)',
                }}
              >
                +{title.delta?.toFixed(2)} vs avg
              </span>
            )}
            {!isBreakout && title.score && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                style={{
                  color: 'var(--accent-amber)',
                  background: 'rgba(251,191,36,0.1)',
                  border: '0.5px solid rgba(251,191,36,0.3)',
                }}
              >
                ★ {title.score.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const TABS = [
  { key: 'breakout',     label: 'Breakout',     subtitle: 'Above genre avg' },
  { key: 'mostWatched',  label: 'Most Watched',  subtitle: 'By AniList members'  },
];

function RankedTitlesPanel({ breakoutTitles, mostWatchedTitles, highlightedId, onTitleClick }) {
  const [tab, setTab] = useState('breakout');

  const titles   = tab === 'breakout' ? breakoutTitles : mostWatchedTitles;
  const subtitle = TABS.find((t) => t.key === tab)?.subtitle;

  if (!titles?.length) return null;

  return (
    <div
      className="p-4"
      style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex gap-0.5 p-0.5"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid var(--border)',
            borderRadius: '8px',
          }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-xs px-3 py-1 rounded transition-all"
              style={{
                background: tab === key ? 'var(--accent-violet)' : 'transparent',
                color:      tab === key ? '#fff' : 'var(--text-muted)',
                border:     'none',
                cursor:     'pointer',
                fontWeight: tab === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>

      <div className="flex flex-col gap-2">
        {titles.map((title, idx) => (
          <TitleRow
            key={title.id}
            title={title}
            idx={idx}
            mode={tab === 'breakout' ? 'breakout' : 'mostWatched'}
            highlightedId={highlightedId}
            onTitleClick={onTitleClick}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(RankedTitlesPanel);
