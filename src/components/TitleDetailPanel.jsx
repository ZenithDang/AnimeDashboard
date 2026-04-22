import { useEffect, useRef } from 'react';
import InfoTooltip from './InfoTooltip';
import { getGenreColour } from '../utils/colours';
import { seasonLabel } from '../utils/transforms';
import { useAnimeStatistics } from '../hooks/useAnimeStatistics';
import { formatMembers } from '../utils/format';

const FUNNEL_SEGMENTS = [
  { key: 'watching',      label: 'Watching',      colour: '#60a5fa' },
  { key: 'completed',     label: 'Completed',     colour: '#34d399' },
  { key: 'on_hold',       label: 'On Hold',       colour: '#fbbf24' },
  { key: 'dropped',       label: 'Dropped',       colour: '#f87171' },
  { key: 'plan_to_watch', label: 'Plan to Watch', colour: '#a78bfa' },
];

function CompletionFunnel({ titleId }) {
  const { stats, isLoading } = useAnimeStatistics(titleId);

  if (isLoading) {
    return (
      <div
        style={{
          height: '58px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid var(--border)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    );
  }

  if (!stats || stats.total === 0) return null;

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Viewership Breakdown</p>

      {/* Segmented bar */}
      <div
        className="flex rounded-full overflow-hidden mb-2.5"
        style={{ height: '10px' }}
      >
        {FUNNEL_SEGMENTS.map(({ key, colour }) => {
          const pct = (stats[key] / stats.total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={key}
              style={{
                width: `${pct}%`,
                background: colour,
                minWidth: '3px',
                borderRight: '1.5px solid rgba(0,0,0,0.25)',
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {FUNNEL_SEGMENTS.map(({ key, label, colour }) => {
          const count = stats[key];
          if (!count) return null;
          return (
            <div key={key} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colour }}
              />
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {formatMembers(count)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TitleDetailPanel({ title, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!title) return;

    const panel = panelRef.current;
    if (!panel) return;

    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => !el.disabled);

    // Move focus into the panel on open
    const focusable = getFocusable();
    if (focusable.length) focusable[0].focus();

    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const els = getFocusable();
      if (!els.length) return;
      const first = els[0];
      const last  = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [title, onClose]);

  if (!title) return null;

  const synopsis = title.synopsis
    ? title.synopsis.slice(0, 300) + (title.synopsis.length > 300 ? '…' : '')
    : 'No synopsis available.';

  return (
    <>
      {/* Dimmed overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title.title}
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(400px, 100vw)',
          background: 'var(--bg-card)',
          borderLeft: '0.5px solid var(--border)',
          animation: 'slideIn 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Header image area */}
        <div
          className="relative flex-shrink-0"
          style={{
            height: '180px',
            background: title.imageLarge
              ? `url(${title.imageLarge}) center/cover no-repeat`
              : `linear-gradient(135deg, ${getGenreColour(title.genres?.[0] || '')}33, var(--bg-base))`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg-card))' }}
          />
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '0.5px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          {/* Title */}
          <h2
            className="text-base font-semibold leading-snug"
            style={{ color: 'var(--text-primary)', margin: 0 }}
          >
            {title.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {title.studio && <span>{title.studio}</span>}
            {title.season && title.year && (
              <>
                <span>·</span>
                <span>{seasonLabel(title.season, title.year)}</span>
              </>
            )}
            {title.type && (
              <>
                <span>·</span>
                <span>{title.type}</span>
              </>
            )}
            {title.episodes && (
              <>
                <span>·</span>
                <span>{title.episodes} ep{title.episodes !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Score + Members */}
          <div className="flex gap-3">
            {title.score && (
              <div
                className="flex-1 p-3 text-center rounded-lg"
                style={{ background: 'rgba(167,139,250,0.08)', border: '0.5px solid rgba(167,139,250,0.2)' }}
              >
                <p className="text-xl font-bold" style={{ color: 'var(--accent-violet)' }}>
                  {title.score.toFixed(2)}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>AniList Score</p>
              </div>
            )}
            {title.members > 0 && (
              <div
                className="flex-1 p-3 text-center rounded-lg"
                style={{ background: 'rgba(52,211,153,0.08)', border: '0.5px solid rgba(52,211,153,0.2)' }}
              >
                <p className="text-xl font-bold" style={{ color: 'var(--accent-teal)' }}>
                  {formatMembers(title.members)}
                </p>
                <p className="text-[11px] mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  Popularity
                  <InfoTooltip text="Number of AniList users who have this title in their list" />
                </p>
              </div>
            )}
          </div>

          {/* Completion funnel */}
          <CompletionFunnel titleId={title.anilistId} />

          {/* Genres */}
          {title.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {title.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${getGenreColour(genre)} 12%, transparent)`,
                    color: getGenreColour(genre),
                    border: `0.5px solid color-mix(in srgb, ${getGenreColour(genre)} 30%, transparent)`,
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Synopsis</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: '1.65' }}>
              {synopsis}
            </p>
          </div>

          {title.anilistUrl && (
            <a
              href={title.anilistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 text-xs font-medium transition-colors mt-auto"
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: '0.5px solid rgba(167,139,250,0.3)',
                borderRadius: '8px',
                color: 'var(--accent-violet)',
                textDecoration: 'none',
              }}
            >
              View on AniList ↗
            </a>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
