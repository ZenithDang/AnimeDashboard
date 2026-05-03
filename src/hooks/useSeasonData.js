import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchAnilistSeason } from '../api/anilist';
import useFilterStore from '../store/filterStore';
import { matchesFormat } from '../utils/transforms';
import { useDebounce } from './useDebounce';

export function useSeasonData() {
  const { format, startSeason, startYear, endSeason, endYear, includeCurrentSeason, fullData, getSeasonRange } = useFilterStore();

  const dStartSeason = useDebounce(startSeason, 400);
  const dStartYear   = useDebounce(startYear,   400);
  const dEndSeason   = useDebounce(endSeason,   400);
  const dEndYear     = useDebounce(endYear,     400);

  // Memoised so downstream useMemo deps see a stable reference
  // and only recompute when the debounced range actually changes.
  const seasonRange = useMemo(
    () => getSeasonRange(dStartSeason, dStartYear, dEndSeason, dEndYear),
    // includeCurrentSeason is read inside getSeasonRange via get() — listing it
    // here ensures the memo recomputes when the toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dStartSeason, dStartYear, dEndSeason, dEndYear, includeCurrentSeason, getSeasonRange],
  );

  const seasonQueries = useQueries({
    queries: seasonRange.map(({ season, year }) => ({
      queryKey:  ['season', year, season, fullData ? 'full' : 'top50'],
      queryFn:   () => fetchAnilistSeason(year, season, fullData),
      staleTime: 10 * 60 * 1000,
      gcTime:    30 * 60 * 1000,
      retry:     2,
    })),
  });

  const isLoading   = seasonQueries.some((q) => q.isLoading);
  const isError     = seasonQueries.some((q) => q.isError);
  const errorDetail = seasonQueries.find((q) => q.isError)?.error?.message ?? null;

  // Derive a stable string from each query's last-updated timestamp.
  // Listing the seasonQueries array itself would fire on every render since
  // useQueries returns a new array reference each time.
  const queriesUpdatedAt = seasonQueries.map((q) => q.dataUpdatedAt).join(',');

  const allEntries = useMemo(
    () => seasonQueries.flatMap((q) => q.data || []).filter((entry) => matchesFormat(entry, format)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queriesUpdatedAt, format],
  );

  return { entries: allEntries, isLoading, isError, errorDetail, seasonRange };
}
