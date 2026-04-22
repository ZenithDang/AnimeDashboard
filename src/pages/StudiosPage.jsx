import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeasonData }         from '../hooks/useSeasonData';
import { useGenreTrendsContext } from '../contexts/GenreTrendsContext';
import useFilterStore     from '../store/filterStore';
import StudioTable        from '../components/StudioTable';
import StudioGenreMatrix  from '../components/StudioGenreMatrix';
import { ChartSkeleton }  from '../components/SkeletonLoader';
import { buildStudioTableData } from '../utils/transforms';

import { formatMembers } from '../utils/format';

export default function StudiosPage() {
  const navigate = useNavigate();
  const { entries, isLoading, seasonRange } = useSeasonData();
  const { selectedGenres } = useFilterStore();
  const { studioGenreData } = useGenreTrendsContext();

  const showSkeleton = isLoading && entries.length === 0;

  const totalStudios = useMemo(() => {
    const seen = new Set();
    for (const e of entries) {
      if (e.studio && e.studio !== 'Unknown Studio') seen.add(e.studio);
    }
    return seen.size;
  }, [entries]);

  // Recompute studio table data scoped to the selected genres so the table
  // and stat tiles reflect the same genre filter as the matrix.
  const filteredStudioTableData = useMemo(() => {
    const genreFiltered = selectedGenres.length
      ? entries.filter((e) => e.genres.some((g) => selectedGenres.includes(g)))
      : entries;
    return buildStudioTableData(genreFiltered, seasonRange);
  }, [entries, seasonRange, selectedGenres]);

  const topByScore      = filteredStudioTableData[0] ?? null;
  const topByPopularity = useMemo(
    () => [...filteredStudioTableData].sort((a, b) => (b.avgMembers ?? 0) - (a.avgMembers ?? 0))[0] ?? null,
    [filteredStudioTableData],
  );

  const statTiles = [
    {
      label: 'Studios Tracked',
      value: totalStudios ? totalStudios.toLocaleString() : '—',
      sub:   'with 2+ titles',
      c:     'var(--accent-violet)',
      onClick: null,
    },
    {
      label: 'Top by Score',
      value: topByScore?.studio ?? '—',
      sub:   topByScore ? `${topByScore.avgScore?.toFixed(2)} avg · ${topByScore.titleCount} titles` : null,
      c:     '#fbbf24',
      onClick: topByScore ? () => navigate(`/studios/${encodeURIComponent(topByScore.studio)}`) : null,
    },
    {
      label: 'Top by Popularity',
      value: topByPopularity?.studio ?? '—',
      sub:   topByPopularity ? `${formatMembers(topByPopularity.avgMembers)} avg · ${topByPopularity.titleCount} titles` : null,
      c:     '#f472b6',
      onClick: topByPopularity ? () => navigate(`/studios/${encodeURIComponent(topByPopularity.studio)}`) : null,
    },
  ];

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {/* Page header */}
      <div>
        <h1 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>Studios</h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>Compare studios by score, popularity, and genre output across the selected season range</p>
      </div>

      {/* Stat tiles */}
      {!showSkeleton && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {statTiles.map(({ label, value, sub, c, onClick }) => (
            <div
              key={label}
              className="p-3"
              style={{
                background:   'var(--bg-card)',
                border:       '0.5px solid var(--border)',
                borderRadius: '12px',
                cursor:       onClick ? 'pointer' : 'default',
              }}
              onClick={onClick ?? undefined}
            >
              <span className="text-[11px] block mb-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <p className="text-base font-semibold leading-tight truncate" style={{ color: c }}>{value}</p>
              {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Studio table — primary view */}
      {showSkeleton ? (
        <ChartSkeleton height={360} />
      ) : (
        <StudioTable studioTableData={filteredStudioTableData} />
      )}

      {/* Studio × Genre matrix — secondary view for genre overlap */}
      {showSkeleton ? (
        <ChartSkeleton height={300} />
      ) : (
        <StudioGenreMatrix
          studioGenreData={studioGenreData}
          selectedGenres={selectedGenres}
          totalStudios={totalStudios}
        />
      )}
    </main>
  );
}
