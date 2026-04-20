import { useMemo } from 'react';
import { useSeasonData } from './useSeasonData';
import { seasonLabel, computeBaselineByKey } from '../utils/transforms';

export function useStudioDrillDown(studio) {
  const { entries, isLoading, seasonRange } = useSeasonData();

  const studioEntries = useMemo(
    () => entries.filter((e) => e.studio === studio),
    [entries, studio],
  );

  const seasonStats = useMemo(() => {
    const map = {};
    for (const e of studioEntries) {
      const key = `${e.season}-${e.year}`;
      if (!map[key]) map[key] = { scores: [], members: [], all: [], season: e.season, year: e.year };
      if (e.score > 0) map[key].scores.push(e.score);
      if (e.members > 0) map[key].members.push(e.members);
      map[key].all.push(e);
    }
    const order = new Map(seasonRange.map(({ season, year }, i) => [`${season}-${year}`, i]));
    return Object.entries(map)
      .map(([key, { scores, members, all, season, year }]) => ({
        key,
        season,
        year,
        label: seasonLabel(season, year),
        avgScore: scores.length
          ? parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2))
          : null,
        avgMembers: members.length
          ? Math.round(members.reduce((s, v) => s + v, 0) / members.length)
          : null,
        count: all.length,
      }))
      .sort((a, b) => (order.get(a.key) ?? 999) - (order.get(b.key) ?? 999));
  }, [studioEntries, seasonRange]);

  const baselineByKey = useMemo(() => computeBaselineByKey(entries), [entries]);

  const trendData = useMemo(
    () => seasonStats.map(({ key, label, avgScore, avgMembers, count }) => ({
      season:           label,
      score:            avgScore,
      members:          avgMembers,
      count,
      _baseline:        baselineByKey.score[key]   ?? null,
      _membersBaseline: baselineByKey.members[key] ?? null,
    })),
    [seasonStats, baselineByKey],
  );

  const genreData = useMemo(() => {
    const map = {};
    for (const e of studioEntries) {
      for (const g of (e.genres || [])) {
        map[g] = (map[g] || 0) + 1;
      }
    }
    return Object.entries(map)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [studioEntries]);

  const topByScore = useMemo(
    () => [...studioEntries].filter((e) => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 8),
    [studioEntries],
  );

  const topByPopularity = useMemo(
    () => [...studioEntries].filter((e) => e.members > 0).sort((a, b) => b.members - a.members).slice(0, 8),
    [studioEntries],
  );

  const stats = useMemo(() => {
    const scored  = studioEntries.filter((e) => e.score > 0);
    const withMem = studioEntries.filter((e) => e.members > 0);
    return {
      totalTitles:  studioEntries.length,
      seasonsCount: seasonStats.length,
      avgScore:     scored.length ? parseFloat((scored.reduce((s, e) => s + e.score, 0) / scored.length).toFixed(2)) : null,
      avgMembers:   withMem.length ? Math.round(withMem.reduce((s, e) => s + e.members, 0) / withMem.length) : null,
      topGenre:     genreData[0]?.genre ?? null,
    };
  }, [studioEntries, seasonStats, genreData]);

  return { trendData, genreData, topByScore, topByPopularity, stats, isLoading };
}
