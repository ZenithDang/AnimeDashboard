import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import RankedTitlesPanel  from '../components/RankedTitlesPanel';
import WelcomeBanner      from '../components/WelcomeBanner';
import { CardSkeleton } from '../components/SkeletonLoader';

import { useSeasonData }         from '../hooks/useSeasonData';
import { useGenreTrendsContext } from '../contexts/GenreTrendsContext';

function GenreMiniPreview({ momentumData }) {
  if (!momentumData?.length) return null;
  const rising  = momentumData.filter((d) => d.change > 0).slice(0, 2);
  const falling = [...momentumData].reverse().filter((d) => d.change < 0).slice(0, 2);
  const displayed = [...rising, ...falling];
  const maxAbs  = Math.max(...displayed.map((d) => Math.abs(d.change)), 1);
  return (
    <div className="flex flex-col gap-1.5 my-2">
      {displayed.map((d) => {
        const pct    = (Math.abs(d.change) / maxAbs) * 100;
        const colour = d.change >= 0 ? 'var(--accent-teal)' : 'var(--accent-amber)';
        return (
          <div key={d.genre} className="flex items-center gap-1.5">
            <span className="text-[9px] truncate flex-shrink-0" style={{ color: 'var(--text-muted)', width: 44 }}>
              {d.genre}
            </span>
            <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: colour, borderRadius: 9999, opacity: 0.8 }} />
            </div>
            <span className="text-[9px] flex-shrink-0 text-right" style={{ color: colour, width: 32 }}>
              {d.change > 0 ? '+' : ''}{d.change}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StudioMiniPreview({ studioTableData }) {
  if (!studioTableData?.length) return null;
  return (
    <div className="flex flex-col gap-1.5 my-2">
      {studioTableData.slice(0, 3).map((s, i) => (
        <div key={s.studio} className="flex items-center gap-1.5">
          <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-muted)', width: 12 }}>
            #{i + 1}
          </span>
          <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {s.studio}
          </span>
          <span
            className="text-[9px] px-1 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '0.5px solid rgba(251,191,36,0.2)' }}
          >
            ★ {s.avgScore?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiscoverMiniPreview({ gems }) {
  if (!gems?.length) return null;
  return (
    <div className="flex flex-col gap-1.5 my-2">
      {gems.map((t, i) => (
        <div key={t.id} className="flex items-center gap-1.5">
          <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--text-muted)', width: 12 }}>
            #{i + 1}
          </span>
          <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
            {t.title}
          </span>
          <span
            className="text-[9px] px-1 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--accent-teal)', border: '0.5px solid rgba(52,211,153,0.2)' }}
          >
            ★ {t.score?.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TabTeaser({ to, icon, label, accentColour, headline, sub, preview }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex-1 p-3 text-left transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        cursor: 'pointer',
        minWidth: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColour; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span style={{ color: accentColour, fontSize: 13 }}>{icon}</span>
          <span className="text-[11px] font-medium" style={{ color: accentColour }}>{label}</span>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>→</span>
      </div>
      {preview}
      <p className="text-xs font-semibold leading-tight truncate mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {headline}
      </p>
      <p className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </button>
  );
}

export default function SummaryPage({ onTitleClick }) {
  const { entries, isLoading } = useSeasonData();

  const {
    breakoutTitles,
    mostWatchedTitles,
    studioTableData,
    momentumData,
    stats,
  } = useGenreTrendsContext();

  const hiddenGems = useMemo(() => {
    if (!entries.length) return [];
    const sorted  = entries.filter((e) => e.members > 0).map((e) => e.members).sort((a, b) => a - b);
    const cutoff  = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    return entries
      .filter((e) => e.score >= 7.5 && e.members > 0 && e.members <= cutoff)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [entries]);

  const [highlightedId, setHighlightedId] = useState(null);

  const handleTitleClick = useCallback((title) => {
    setHighlightedId(title.id);
    onTitleClick(title);
  }, [onTitleClick]);

  const showSkeleton = isLoading && entries.length === 0;

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      <WelcomeBanner />

      {/* Tab teasers with mini previews */}
      {!showSkeleton && stats && (
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <TabTeaser
            to="/genres"
            icon="▲"
            label="Genres"
            accentColour="var(--accent-amber)"
            preview={<GenreMiniPreview momentumData={momentumData} />}
            headline={`#1 Genre: ${stats.topGenre}`}
            sub="Explore score trends, momentum, and genre overlap across every season."
          />
          <TabTeaser
            to="/studios"
            icon="◈"
            label="Studios"
            accentColour="var(--accent-violet)"
            preview={<StudioMiniPreview studioTableData={studioTableData} />}
            headline={studioTableData?.[0] ? `${studioTableData[0].studio} leads` : 'Studio rankings'}
            sub="See which studios are dominating and how their quality trends over time."
          />
          <TabTeaser
            to="/discover"
            icon="◎"
            label="Discover"
            accentColour="var(--accent-teal)"
            preview={<DiscoverMiniPreview gems={hiddenGems} />}
            headline="High scores, low spotlight"
            sub="Critically appreciated titles that flew under the radar — filter by score and obscurity."
          />
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
