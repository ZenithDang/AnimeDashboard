import { useCallback, lazy, Suspense } from 'react';

import ScoreHeatmap      from '../components/ScoreHeatmap';
import GenreChordDiagram from '../components/GenreChordDiagram';
import { ChartSkeleton } from '../components/SkeletonLoader';

import { useSeasonData }         from '../hooks/useSeasonData';
import { useGenreTrendsContext } from '../contexts/GenreTrendsContext';
import useFilterStore            from '../store/filterStore';

const GenreTrendChart = lazy(() => import('../components/GenreTrendChart'));
const GenreMomentum   = lazy(() => import('../components/GenreMomentum'));

export default function GenresPage({ onTitleClick }) {
  const { entries, isLoading, seasonRange } = useSeasonData();
  const { selectedGenres } = useFilterStore();

  const {
    aggregated,
    trendData,
    momentumData,
    viewershipMomentumData,
    countMomentumData,
    viewershipAggregated,
    viewershipTrendData,
    countAggregated,
    countTrendData,
    cooccurrence,
  } = useGenreTrendsContext();

  const handleTitleClick = useCallback((title) => {
    onTitleClick(title);
  }, [onTitleClick]);

  const showSkeleton = isLoading && entries.length === 0;

  return (
    <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>

      {showSkeleton ? (
        <ChartSkeleton height={300} />
      ) : (
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <GenreTrendChart
            trendData={trendData}
            aggregated={aggregated}
            viewershipTrendData={viewershipTrendData}
            viewershipAggregated={viewershipAggregated}
            countTrendData={countTrendData}
            onTitleClick={handleTitleClick}
          />
        </Suspense>
      )}

      {showSkeleton ? (
        <ChartSkeleton height={220} />
      ) : (
        <ScoreHeatmap
          aggregated={aggregated}
          viewershipAggregated={viewershipAggregated}
          countAggregated={countAggregated}
          seasonRange={seasonRange}
          selectedGenres={selectedGenres}
        />
      )}

      {showSkeleton ? (
        <ChartSkeleton height={220} />
      ) : (
        <Suspense fallback={<ChartSkeleton height={220} />}>
          <GenreMomentum
            momentumData={momentumData}
            viewershipMomentumData={viewershipMomentumData}
            countMomentumData={countMomentumData}
          />
        </Suspense>
      )}

      {showSkeleton ? (
        <ChartSkeleton height={220} />
      ) : (
        <GenreChordDiagram cooccurrence={cooccurrence} />
      )}

    </main>
  );
}
