const HTML_ENTITIES = {
  '&amp;':  '&',
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
  '&nbsp;': ' ',
};

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str.replace(/&(?:[a-z]{2,6}|#\d{1,6});/gi, (entity) => {
    if (entity in HTML_ENTITIES) return HTML_ENTITIES[entity];
    if (entity.startsWith('&#')) return String.fromCharCode(parseInt(entity.slice(2, -1), 10));
    return entity;
  });
}

/**
 * Normalise a raw AniList entry into the internal data model.
 */
export function normaliseAnilistEntry(entry) {
  const genres = (entry.genres || []).filter(Boolean);
  const season = (entry.season || '').toLowerCase();
  const year   = entry.seasonYear || null;

  return {
    id:        entry.idMal || entry.id,
    anilistId: entry.id,
    title:    entry.title?.english || entry.title?.romaji || 'Unknown Title',
    score:    entry.meanScore ? entry.meanScore / 10 : null,
    members:  entry.popularity ?? 0,
    genres,
    studio:   entry.studios?.nodes?.[0]?.name || 'Unknown Studio',
    season,
    year,
    episodes: entry.episodes ?? null,
    type:     entry.format || 'TV',
    image:      entry.coverImage?.large      || null,
    imageLarge: entry.coverImage?.extraLarge || entry.coverImage?.large || null,
    synopsis: decodeHtmlEntities(entry.description?.replace(/<[^>]*>/g, '') ?? ''),
    anilistUrl: `https://anilist.co/anime/${entry.id}`,
  };
}

/** Convert season string to a short display label, e.g. winter 2024 → 'W2024' */
export function seasonLabel(season, year) {
  const prefixes = { winter: 'W', spring: 'Sp', summer: 'Su', fall: 'F' };
  return `${prefixes[season] ?? season[0].toUpperCase()}${year}`;
}

/** Return true if an entry matches the format filter */
export function matchesFormat(entry, format) {
  if (!format || format === 'all') return true;
  return entry.type?.toLowerCase() === format.toLowerCase();
}

/**
 * Given a list of normalised entries, aggregate by genre per season.
 * Returns: { [seasonKey]: { [genre]: { avg, titles[] } } }
 */
export function aggregateByGenre(entries) {
  const map = {};

  for (const entry of entries) {
    if (!entry.score || entry.score <= 0) continue;
    const key = `${entry.season}-${entry.year}`;

    if (!map[key]) map[key] = {};

    for (const genre of entry.genres) {
      if (!map[key][genre]) map[key][genre] = { scores: [], titles: [] };
      map[key][genre].scores.push(entry.score);
      map[key][genre].titles.push(entry);
    }
  }

  // Flatten to { seasonKey, genre, avg, titles }
  const result = {};
  for (const [seasonKey, genres] of Object.entries(map)) {
    result[seasonKey] = {};
    for (const [genre, data] of Object.entries(genres)) {
      const avg = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
      result[seasonKey][genre] = {
        avg:    parseFloat(avg.toFixed(2)),
        count:  data.scores.length,
        titles: data.titles.sort((a, b) => b.score - a.score).slice(0, 10),
      };
    }
  }

  return result;
}

/**
 * Build chart-ready data for Recharts LineChart.
 * Returns array sorted by season order:
 * [{ season: 'W2024', Action: 7.2, Comedy: 6.8, ... }, ...]
 */
export function buildTrendChartData(aggregated, seasons, selectedGenres) {
  return seasons.map(({ season, year }) => {
    const key   = `${season}-${year}`;
    const label = seasonLabel(season, year);
    const point = { season: label, _key: key };

    for (const genre of selectedGenres) {
      point[genre] = aggregated[key]?.[genre]?.avg ?? null;
    }

    return point;
  });
}

/**
 * Build momentum data: % change in a metric per genre across the range.
 * getValue extracts the numeric value from an aggregated cell.
 * Defaults to score avg; pass different extractors for popularity or count.
 */
export function buildMomentumData(aggregated, seasons, selectedGenres, getValue = (d) => d?.avg) {
  if (seasons.length < 2) return [];

  const firstKey = `${seasons[0].season}-${seasons[0].year}`;
  const lastKey  = `${seasons[seasons.length - 1].season}-${seasons[seasons.length - 1].year}`;

  return selectedGenres
    .map((genre) => {
      const first = getValue(aggregated[firstKey]?.[genre]);
      const last  = getValue(aggregated[lastKey]?.[genre]);
      if (first == null || last == null) return null;
      const change = parseFloat(((last - first) / first * 100).toFixed(1));
      return { genre, change, first, last };
    })
    .filter(Boolean)
    .sort((a, b) => b.change - a.change);
}

/**
 * Aggregate entries by genre per season using members as the viewership metric.
 * Returns: { [seasonKey]: { [genre]: { avgMembers, totalMembers, count, titles[] } } }
 */
export function aggregateViewershipByGenre(entries) {
  const map = {};

  for (const entry of entries) {
    if (!entry.members || entry.members <= 0) continue;
    const key = `${entry.season}-${entry.year}`;

    if (!map[key]) map[key] = {};

    for (const genre of entry.genres) {
      if (!map[key][genre]) map[key][genre] = { members: [], titles: [] };
      map[key][genre].members.push(entry.members);
      map[key][genre].titles.push(entry);
    }
  }

  const result = {};
  for (const [seasonKey, genres] of Object.entries(map)) {
    result[seasonKey] = {};
    for (const [genre, data] of Object.entries(genres)) {
      const total = data.members.reduce((s, v) => s + v, 0);
      result[seasonKey][genre] = {
        avgMembers:   Math.round(total / data.members.length),
        totalMembers: total,
        count:        data.members.length,
        titles:       data.titles.sort((a, b) => b.members - a.members).slice(0, 10),
      };
    }
  }

  return result;
}

/**
 * Build chart-ready data for the viewership trend (avg members per genre per season).
 */
export function buildViewershipTrendData(viewershipAggregated, seasons, selectedGenres) {
  return seasons.map(({ season, year }) => {
    const key   = `${season}-${year}`;
    const label = seasonLabel(season, year);
    const point = { season: label, _key: key };

    for (const genre of selectedGenres) {
      point[genre] = viewershipAggregated[key]?.[genre]?.avgMembers ?? null;
    }

    return point;
  });
}

/**
 * Aggregate raw title counts by genre per season (all entries, regardless of score).
 * Returns: { [seasonKey]: { [genre]: count } }
 */
export function aggregateCountByGenre(entries) {
  const map = {};
  for (const entry of entries) {
    const key = `${entry.season}-${entry.year}`;
    if (!map[key]) map[key] = {};
    for (const genre of entry.genres) {
      map[key][genre] = (map[key][genre] || 0) + 1;
    }
  }
  return map;
}

/**
 * Build chart-ready data for a title-count trend (number of titles per genre per season).
 */
export function buildCountChartData(countAggregated, seasons, selectedGenres) {
  return seasons.map(({ season, year }) => {
    const key   = `${season}-${year}`;
    const label = seasonLabel(season, year);
    const point = { season: label, _key: key };
    for (const genre of selectedGenres) {
      point[genre] = countAggregated[key]?.[genre] ?? null;
    }
    return point;
  });
}

/**
 * Compute a symmetric genre co-occurrence matrix across all provided entries.
 * Returns { matrix, genreOrder, maxCount } where:
 *   matrix[A][A].count = titles containing genre A (diagonal)
 *   matrix[A][B].count = titles containing both A and B (off-diagonal, symmetric)
 *   matrix[A][B].titles = up to 5 examples sorted by members desc
 *   maxCount = highest off-diagonal count (for colour normalisation)
 */
export function computeGenreCooccurrence(entries, selectedGenres) {
  if (!selectedGenres || selectedGenres.length < 2) {
    return { matrix: {}, genreOrder: [], maxCount: 1 };
  }

  const genreSet = new Set(selectedGenres);
  const genreOrder = [...selectedGenres];

  // Lazily-initialised: only allocate arrays for genre pairs that actually co-occur.
  const titlesMap = {};

  for (const entry of entries) {
    const hit = entry.genres.filter((g) => genreSet.has(g));
    if (!hit.length) continue;

    for (let i = 0; i < hit.length; i++) {
      const a = hit[i];
      if (!titlesMap[a])    titlesMap[a]    = {};
      if (!titlesMap[a][a]) titlesMap[a][a] = [];
      titlesMap[a][a].push(entry);

      for (let j = i + 1; j < hit.length; j++) {
        const b = hit[j];
        if (!titlesMap[a][b]) titlesMap[a][b] = [];
        if (!titlesMap[b])    titlesMap[b]    = {};
        if (!titlesMap[b][a]) titlesMap[b][a] = [];
        titlesMap[a][b].push(entry);
        titlesMap[b][a].push(entry);
      }
    }
  }

  // Build matrix with counts and capped example lists
  const matrix = {};
  let maxCount = 1;

  for (const a of genreOrder) {
    matrix[a] = {};
    for (const b of genreOrder) {
      const raw = titlesMap[a]?.[b] ?? [];
      const sorted = [...raw].sort((x, y) => y.members - x.members);
      const count = raw.length;
      matrix[a][b] = { count, titles: sorted.slice(0, 5) };
      if (a !== b && count > maxCount) maxCount = count;
    }
  }

  return { matrix, genreOrder, maxCount };
}

/**
 * Aggregate entries by studio and genre, returning the top 12 studios
 * (by unique title count across selected genres) and a cell matrix.
 * Returns: { studios: string[], matrix: { [studio]: { [genre]: Cell | null } } }
 * Cell: { count, avgScore, avgMembers, titlesScore[], titlesPopularity[] }
 */
export function aggregateByStudioAndGenre(entries, selectedGenres) {
  if (!selectedGenres?.length) return { studios: [], matrix: {} };

  const genreSet = new Set(selectedGenres);
  const raw = {}; // { [studio]: { [genre]: { scores[], members[], entries[] } } }
  const studioIds = {}; // { [studio]: Set<id> } for unique-title ranking

  for (const entry of entries) {
    const studio = entry.studio;
    if (!studio || studio === 'Unknown Studio') continue;

    for (const genre of entry.genres) {
      if (!genreSet.has(genre)) continue;

      if (!raw[studio]) raw[studio] = {};
      if (!raw[studio][genre]) raw[studio][genre] = { scores: [], members: [], entries: [] };

      raw[studio][genre].entries.push(entry);
      if (entry.score > 0)   raw[studio][genre].scores.push(entry.score);
      if (entry.members > 0) raw[studio][genre].members.push(entry.members);

      if (!studioIds[studio]) studioIds[studio] = new Set();
      studioIds[studio].add(entry.id);
    }
  }

  // Top 12 studios by unique title count
  const studios = Object.entries(studioIds)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 12)
    .map(([studio]) => studio);

  const matrix = {};
  for (const studio of studios) {
    matrix[studio] = {};
    for (const genre of selectedGenres) {
      const cell = raw[studio]?.[genre];
      if (!cell || cell.entries.length === 0) {
        matrix[studio][genre] = null;
        continue;
      }
      const avgScore   = cell.scores.length ? parseFloat((cell.scores.reduce((s, v) => s + v, 0) / cell.scores.length).toFixed(2)) : null;
      const avgMembers = cell.members.length ? Math.round(cell.members.reduce((s, v) => s + v, 0) / cell.members.length) : null;
      matrix[studio][genre] = {
        count:            cell.entries.length,
        avgScore,
        avgMembers,
        titlesScore:      [...cell.entries].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5),
        titlesPopularity: [...cell.entries].sort((a, b) => b.members - a.members).slice(0, 5),
      };
    }
  }

  return { studios, matrix };
}

/**
 * Build a comprehensive per-studio summary for the sortable studio table.
 * Includes avgScore, avgMembers, titleCount, topGenre, and score trend direction.
 * Trend compares avg score of the first half of seasonRange vs the second half.
 * Returns all studios with 2+ titles, default-sorted by avgScore desc.
 */
export function buildStudioTableData(entries, seasonRange) {
  const map = {};

  for (const e of entries) {
    if (!e.studio || e.studio === 'Unknown Studio') continue;
    if (!map[e.studio]) map[e.studio] = { all: [], scores: [], members: [], genres: {}, seasonScores: {} };
    const s = map[e.studio];
    s.all.push(e);
    if (e.score > 0)   s.scores.push(e.score);
    if (e.members > 0) s.members.push(e.members);
    for (const g of (e.genres || [])) s.genres[g] = (s.genres[g] || 0) + 1;
    const key = `${e.season}-${e.year}`;
    if (e.score > 0) {
      if (!s.seasonScores[key]) s.seasonScores[key] = [];
      s.seasonScores[key].push(e.score);
    }
  }

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const mid = Math.floor(seasonRange.length / 2);
  const firstKeys  = new Set(seasonRange.slice(0, mid).map(({ season, year }) => `${season}-${year}`));
  const secondKeys = new Set(seasonRange.slice(mid).map(({ season, year }) => `${season}-${year}`));

  return Object.entries(map)
    .filter(([, s]) => s.all.length >= 2)
    .map(([studio, s]) => {
      const topGenre = Object.entries(s.genres).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      let trend = null;
      if (seasonRange.length >= 4) {
        const firstScores  = Object.entries(s.seasonScores).filter(([k]) => firstKeys.has(k)).flatMap(([, v]) => v);
        const secondScores = Object.entries(s.seasonScores).filter(([k]) => secondKeys.has(k)).flatMap(([, v]) => v);
        const fa = avg(firstScores);
        const sa = avg(secondScores);
        if (fa != null && sa != null) {
          const delta = sa - fa;
          trend = delta > 0.15 ? 'up' : delta < -0.15 ? 'down' : 'flat';
        }
      }

      return {
        studio,
        titleCount: s.all.length,
        avgScore:   s.scores.length  ? parseFloat(avg(s.scores).toFixed(2))  : null,
        avgMembers: s.members.length ? Math.round(avg(s.members))             : null,
        topGenre,
        trend,
      };
    })
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
}

/**
 * Top titles ranked by AniList popularity.
 */
export function buildMostWatchedTitles(entries, limit = 10) {
  return [...entries]
    .filter((e) => e.members > 0)
    .sort((a, b) => b.members - a.members)
    .slice(0, limit);
}

/**
 * Build breakout titles: titles that most outperformed their genre avg.
 */
export function buildBreakoutTitles(entries, aggregated) {
  const results = [];

  for (const entry of entries) {
    if (!entry.score) continue;

    const key = `${entry.season}-${entry.year}`;
    for (const genre of entry.genres) {
      const genreAvg = aggregated[key]?.[genre]?.avg;
      if (!genreAvg) continue;
      const delta = parseFloat((entry.score - genreAvg).toFixed(2));
      if (delta > 0) {
        results.push({ ...entry, delta, comparedGenre: genre });
        break; // one entry per title
      }
    }
  }

  // Deduplicate by id and take top 10
  const seen = new Set();
  return results
    .sort((a, b) => b.delta - a.delta)
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .slice(0, 10);
}


export function computeBaselineByKey(entries) {
  const scoreMap = {};
  const membersMap = {};
  for (const e of entries) {
    const key = `${e.season}-${e.year}`;
    if (e.score) {
      if (!scoreMap[key]) scoreMap[key] = { sum: 0, count: 0 };
      scoreMap[key].sum   += e.score;
      scoreMap[key].count += 1;
    }
    if (e.members) {
      if (!membersMap[key]) membersMap[key] = { sum: 0, count: 0 };
      membersMap[key].sum   += e.members;
      membersMap[key].count += 1;
    }
  }
  const score   = Object.fromEntries(Object.entries(scoreMap).map(([k, { sum, count }]) => [k, parseFloat((sum / count).toFixed(2))]));
  const members = Object.fromEntries(Object.entries(membersMap).map(([k, { sum, count }]) => [k, Math.round(sum / count)]));
  return { score, members };
}
