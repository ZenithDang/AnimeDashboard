import { useMemo } from 'react';
import { useSeasonData } from './useSeasonData';
import { seasonLabel, computeBaselineByKey } from '../utils/transforms';

export function useGenreDrillDown(genre) {
  const { entries, isLoading, seasonRange } = useSeasonData();

  const genreEntries = useMemo(
    () => entries.filter((e) => e.genres.includes(genre)),
    [entries, genre],
  );

  const seasonStats = useMemo(() => {
    const map = {};
    for (const e of genreEntries) {
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
  }, [genreEntries, seasonRange]);

  const baselineByKey = useMemo(() => computeBaselineByKey(entries), [entries]);

  const trendData = useMemo(
    () => seasonStats.map(({ key, label, avgScore, avgMembers, count }) => ({
      season:          label,
      score:           avgScore,
      members:         avgMembers,
      count,
      _baseline:       baselineByKey.score[key]   ?? null,
      _membersBaseline: baselineByKey.members[key] ?? null,
    })),
    [seasonStats, baselineByKey],
  );

  const scoreBuckets = useMemo(() => {
    const buckets = {};
    for (const e of genreEntries) {
      if (!e.score) continue;
      const bucket = (Math.floor(e.score * 2) / 2).toFixed(1);
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    }
    return Object.entries(buckets)
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
  }, [genreEntries]);

  const topByScore = useMemo(
    () => [...genreEntries].filter((e) => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 8),
    [genreEntries],
  );

  const topByPopularity = useMemo(
    () => [...genreEntries].filter((e) => e.members > 0).sort((a, b) => b.members - a.members).slice(0, 8),
    [genreEntries],
  );

  const stats = useMemo(() => {
    const scored     = genreEntries.filter((e) => e.score > 0);
    const withMem    = genreEntries.filter((e) => e.members > 0);
    const bestSeason = [...seasonStats].filter((s) => s.avgScore != null).sort((a, b) => b.avgScore - a.avgScore)[0] ?? null;
    return {
      totalTitles:  genreEntries.length,
      seasonsCount: seasonStats.length,
      avgScore:     scored.length ? parseFloat((scored.reduce((s, e) => s + e.score, 0) / scored.length).toFixed(2)) : null,
      avgMembers:   withMem.length ? Math.round(withMem.reduce((s, e) => s + e.members, 0) / withMem.length) : null,
      bestSeason,
    };
  }, [genreEntries, seasonStats]);

  return { trendData, scoreBuckets, topByScore, topByPopularity, stats, isLoading };
}
