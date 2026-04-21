import { useMemo } from 'react';
import useFilterStore from '../store/filterStore';
import {
  aggregateByGenre,
  buildTrendChartData,
  buildMomentumData,
  buildBreakoutTitles,
  aggregateViewershipByGenre,
  buildViewershipTrendData,
  buildMostWatchedTitles,
  aggregateCountByGenre,
  buildCountChartData,
  computeGenreCooccurrence,
  aggregateByStudioAndGenre,
  buildStudioTableData,
} from '../utils/transforms';

/**
 * Derives all chart-ready data from normalised entries.
 * Accepts seasonRange from useSeasonData so it shares the same stable reference
 * rather than calling getSeasonRange() again and producing a new array.
 */
export function useGenreTrends(entries, seasonRange) {
  const { selectedGenres } = useFilterStore();

  const aggregated = useMemo(
    () => aggregateByGenre(entries),
    [entries],
  );

  // Per-season baseline values for the "All anime" reference line.
  // Defined early so trendData, viewershipTrendData, and countTrendData can all depend on it.
  const baselineBySeasonMap = useMemo(() => {
    const countMap   = {};
    const scoreMap   = {};
    const membersMap = {};

    for (const entry of entries) {
      const key = `${entry.season}-${entry.year}`;

      countMap[key] = (countMap[key] || 0) + 1;

      if (entry.score) {
        if (!scoreMap[key]) scoreMap[key] = { sum: 0, count: 0 };
        scoreMap[key].sum   += entry.score;
        scoreMap[key].count += 1;
      }

      if (entry.members) {
        if (!membersMap[key]) membersMap[key] = { sum: 0, count: 0 };
        membersMap[key].sum   += entry.members;
        membersMap[key].count += 1;
      }
    }

    return {
      count:   countMap,
      score:   Object.fromEntries(
        Object.entries(scoreMap).map(([k, v]) => [k, parseFloat((v.sum / v.count).toFixed(2))]),
      ),
      members: Object.fromEntries(
        Object.entries(membersMap).map(([k, v]) => [k, Math.round(v.sum / v.count)]),
      ),
    };
  }, [entries]);

  const trendData = useMemo(
    () => buildTrendChartData(aggregated, seasonRange, selectedGenres)
      .map((point) => ({ ...point, _baseline: baselineBySeasonMap.score[point._key] ?? null })),
    [aggregated, seasonRange, selectedGenres, baselineBySeasonMap],
  );

  const momentumData = useMemo(
    () => buildMomentumData(aggregated, seasonRange, selectedGenres),
    [aggregated, seasonRange, selectedGenres],
  );

  // Entries scoped to selected genres — used for title-level lists so they
  // reflect the active filter. Aggregated baselines still use all entries.
  const genreFilteredEntries = useMemo(
    () => selectedGenres.length
      ? entries.filter((e) => e.genres.some((g) => selectedGenres.includes(g)))
      : entries,
    [entries, selectedGenres],
  );

  const breakoutTitles = useMemo(
    () => buildBreakoutTitles(genreFilteredEntries, aggregated),
    [genreFilteredEntries, aggregated],
  );

  const viewershipAggregated = useMemo(
    () => aggregateViewershipByGenre(entries),
    [entries],
  );

  const viewershipTrendData = useMemo(
    () => buildViewershipTrendData(viewershipAggregated, seasonRange, selectedGenres)
      .map((point) => ({ ...point, _baseline: baselineBySeasonMap.members[point._key] ?? null })),
    [viewershipAggregated, seasonRange, selectedGenres, baselineBySeasonMap],
  );

  const viewershipMomentumData = useMemo(
    () => buildMomentumData(viewershipAggregated, seasonRange, selectedGenres, (d) => d?.avgMembers),
    [viewershipAggregated, seasonRange, selectedGenres],
  );

  const mostWatchedTitles = useMemo(
    () => buildMostWatchedTitles(genreFilteredEntries),
    [genreFilteredEntries],
  );

  const countAggregated = useMemo(
    () => aggregateCountByGenre(entries),
    [entries],
  );

  const countTrendData = useMemo(
    () => buildCountChartData(countAggregated, seasonRange, selectedGenres)
      .map((point) => ({ ...point, _baseline: baselineBySeasonMap.count[point._key] ?? 0 })),
    [countAggregated, seasonRange, selectedGenres, baselineBySeasonMap],
  );

  const countMomentumData = useMemo(
    () => buildMomentumData(countAggregated, seasonRange, selectedGenres, (d) => d),
    [countAggregated, seasonRange, selectedGenres],
  );

  const stats = useMemo(() => {
    const scored = entries.filter((e) => e.score);
    const genreCounts = {};
    for (const e of entries) {
      for (const g of e.genres) genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const avgScore = scored.length
      ? parseFloat((scored.reduce((s, e) => s + e.score, 0) / scored.length).toFixed(2))
      : 0;

    // Viewership stats
    const withMembers = entries.filter((e) => e.members > 0);
    const avgMembers = withMembers.length
      ? Math.round(withMembers.reduce((s, e) => s + e.members, 0) / withMembers.length)
      : 0;
    const peakMembers = withMembers.length
      ? Math.max(...withMembers.map((e) => e.members))
      : 0;
    const genreMembers = {};
    for (const e of entries) {
      if (!e.members) continue;
      for (const g of e.genres) genreMembers[g] = (genreMembers[g] || 0) + e.members;
    }
    const mostWatchedGenre = Object.entries(genreMembers).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      totalTitles:  entries.length,
      seasonsCount: seasonRange.length,
      topGenre,
      avgScore,
      avgMembers,
      peakMembers,
      mostWatchedGenre,
    };
  }, [entries, seasonRange]);

  const cooccurrence = useMemo(
    () => computeGenreCooccurrence(entries, selectedGenres),
    [entries, selectedGenres],
  );

  const studioGenreData = useMemo(
    () => aggregateByStudioAndGenre(entries, selectedGenres),
    [entries, selectedGenres],
  );

  const studioTableData = useMemo(
    () => buildStudioTableData(entries, seasonRange),
    [entries, seasonRange],
  );

  return {
    aggregated,
    trendData,
    momentumData,
    viewershipMomentumData,
    countMomentumData,
    breakoutTitles,
    stats,
    viewershipAggregated,
    viewershipTrendData,
    mostWatchedTitles,
    countAggregated,
    countTrendData,
    cooccurrence,
    studioGenreData,
    studioTableData,
  };
}
