import { useState, useCallback } from 'react';

import StatTiles         from '../components/StatTiles';
import RankedTitlesPanel from '../components/RankedTitlesPanel';
import { StatTilesSkeleton, CardSkeleton } from '../components/SkeletonLoader';

import { useSeasonData }         from '../hooks/useSeasonData';
import { useGenreTrendsContext } from '../contexts/GenreTrendsContext';
import { formatMembers }         from '../utils/format';

function HighlightCard({ highlight, onTitleClick }) {
  return (
    <div
      className="p-3 flex flex-col gap-2.5 flex-shrink-0"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        minWidth: '200px',
        maxWidth: '240px',
      }}
    >
      <span className="text-[10px] font-medium" style={{ color: 'var(--accent-violet)' }}>
        {highlight.label}
      </span>

      {highlight.topScored && (
        <button
          onClick={() => onTitleClick?.(highlight.topScored)}
          className="text-left w-full"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Top Rated</div>
          <div className="flex items-start justify-between gap-1">
            <span
              className="text-xs leading-tight line-clamp-2 flex-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {highlight.topScored.title}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.3)' }}
            >
              ★ {highlight.topScored.score?.toFixed(1)}
            </span>
          </div>
        </button>
      )}

      {highlight.mostWatched && (
        <button
          onClick={() => onTitleClick?.(highlight.mostWatched)}
          className="text-left w-full"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Most Watched</div>
          <div className="flex items-start justify-between gap-1">
            <span
              className="text-xs leading-tight line-clamp-2 flex-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {highlight.mostWatched.title}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6', border: '0.5px solid rgba(244,114,182,0.3)' }}
            >
              {formatMembers(highlight.mostWatched.members)}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

export default function SummaryPage({ onTitleClick }) {
  const { entries, isLoading } = useSeasonData();

  const {
    breakoutTitles,
    mostWatchedTitles,
    seasonHighlights,
    stats,
  } = useGenreTrendsContext();

  const [highlightedId, setHighlightedId] = useState(null);

  const handleTitleClick = useCallback((title) => {
    setHighlightedId(title.id);
    onTitleClick(title);
  }, [onTitleClick]);

  const showSkeleton = isLoading && entries.length === 0;

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Stat tiles */}
      {showSkeleton ? <StatTilesSkeleton /> : <StatTiles stats={stats} />}

      {/* Season highlights */}
      {!showSkeleton && seasonHighlights.length > 0 && (
        <div
          className="p-4"
          style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '12px' }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)', margin: 0 }}>
              Season Highlights
            </h2>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Top rated and most watched per season
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {seasonHighlights.map((h) => (
              <HighlightCard key={h.key} highlight={h} onTitleClick={handleTitleClick} />
            ))}
          </div>
        </div>
      )}

      {/* Ranked titles */}
      {showSkeleton ? (
        <CardSkeleton />
      ) : (
        <RankedTitlesPanel
          breakoutTitles={breakoutTitles}
          mostWatchedTitles={mostWatchedTitles}
          highlightedId={highlightedId}
          onTitleClick={handleTitleClick}
        />
      )}

    </main>
  );
}
