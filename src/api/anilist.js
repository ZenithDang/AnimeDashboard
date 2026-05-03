import { normaliseAnilistEntry } from '../utils/transforms';
import { apiQueue } from '../utils/requestQueue';

const BASE_URL = '/anilist-gql';

const SEASON_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
      }
      media(
        season: $season,
        seasonYear: $seasonYear,
        type: ANIME,
        isAdult: false,
        sort: POPULARITY_DESC
      ) {
        id
        idMal
        title { english romaji }
        genres
        format
        episodes
        meanScore
        popularity
        season
        seasonYear
        description(asHtml: false)
        coverImage { extraLarge large }
        studios(isMain: true) { nodes { name } }
      }
    }
  }
`;

const JIKAN_TO_ANILIST_SEASON = {
  winter: 'WINTER',
  spring: 'SPRING',
  summer: 'SUMMER',
  fall:   'FALL',
};

async function graphqlFetch(query, variables, attempt = 1) {
  const MAX_ATTEMPTS = 3;

  // Each HTTP request goes through the shared queue (max 3 concurrent).
  // Retries call graphqlFetch recursively AFTER the slot is freed, so
  // there is no risk of the queue deadlocking on rate-limited retries.
  const response = await apiQueue.run(() =>
    fetch(BASE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query, variables }),
    })
  );

  if (response.status === 429) {
    if (attempt >= MAX_ATTEMPTS) {
      throw new Error(`AniList rate limit exceeded after ${MAX_ATTEMPTS} attempts`);
    }
    const raw = parseInt(response.headers.get('Retry-After'), 10);
    const retryAfter = isNaN(raw) ? 60 : raw;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return graphqlFetch(query, variables, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`AniList GraphQL error: ${json.errors[0].message}`);
  }
  return json.data;
}

const STATISTICS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      stats {
        statusDistribution {
          status
          amount
        }
      }
    }
  }
`;

const ANILIST_STATUS_MAP = {
  CURRENT:   'watching',
  COMPLETED: 'completed',
  PAUSED:    'on_hold',
  DROPPED:   'dropped',
  PLANNING:  'plan_to_watch',
};

/**
 * Fetch viewership status breakdown for a single title by AniList ID.
 * Returns the same shape as the old Jikan statistics endpoint.
 */
export async function fetchAnilistStatistics(anilistId) {
  const data = await graphqlFetch(STATISTICS_QUERY, { id: anilistId });
  const dist = data?.Media?.stats?.statusDistribution ?? [];

  const stats = { watching: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_watch: 0, total: 0 };
  for (const { status, amount } of dist) {
    const key = ANILIST_STATUS_MAP[status];
    if (key) {
      stats[key]   = amount;
      stats.total += amount;
    }
  }
  return stats;
}

/**
 * Fetch anime for a given season from AniList.
 * fullData=false (default): fetches only the first page (top 50 by popularity) for fast load times.
 * fullData=true: paginates through all pages for complete season data.
 */
export async function fetchAnilistSeason(year, season, fullData = false) {
  const anilistSeason = JIKAN_TO_ANILIST_SEASON[season];
  if (!anilistSeason) return [];

  const entries = [];
  let page    = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await graphqlFetch(SEASON_QUERY, {
      season:     anilistSeason,
      seasonYear: year,
      page,
    });

    const pageEntries = (data?.Page?.media || []).map(normaliseAnilistEntry);
    entries.push(...pageEntries);

    hasNext = data?.Page?.pageInfo?.hasNextPage ?? false;
    page++;

    if (!fullData) break;              // top-50 mode: stop after first page
    if (page > 10) break;             // safety cap (~500 titles per season)
  }

  return entries;
}
