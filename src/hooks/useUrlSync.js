import { useEffect } from 'react';
import useFilterStore from '../store/filterStore';

const VALID_SEASONS = ['winter', 'spring', 'summer', 'fall'];
const VALID_FORMATS = ['TV', 'Movie', 'OVA', 'ONA'];

// AniList genre names only contain letters, spaces, and hyphens.
// This rejects anything else (HTML, scripts, etc.) before it reaches the store.
const VALID_GENRE = /^[A-Za-z\s-]{1,50}$/;

const _now      = new Date();
const _maxYear  = _now.getFullYear() + 1;
const _minYear  = _now.getFullYear() - 10;

function parseSeasonParam(param) {
  if (!param) return null;
  const match = param.match(/^(winter|spring|summer|fall)-(\d{4})$/);
  if (!match) return null;
  const year = parseInt(match[2], 10);
  if (year < _minYear || year > _maxYear) return null;
  return { season: match[1], year };
}

function buildUrlParams(state) {
  const params = new URLSearchParams();
  params.set('from',   `${state.startSeason}-${state.startYear}`);
  params.set('to',     `${state.endSeason}-${state.endYear}`);
  params.set('genres', state.selectedGenres.join(','));
  params.set('format', state.format);
  if (state.includeCurrentSeason) params.set('current', 'true');
  if (state.fullData)             params.set('full', 'true');
  return params;
}

/**
 * Bidirectional sync between Zustand filter store and URL search params.
 * - On mount: if URL has params they override persisted state (enables shareable links).
 * - On state change: URL is updated via replaceState (no extra history entries).
 */
export function useUrlSync() {
  useEffect(() => {
    // Subscribe first so any setState below immediately writes back to URL
    const unsubscribe = useFilterStore.subscribe((state) => {
      window.history.replaceState(null, '', `?${buildUrlParams(state)}`);
    });

    const params  = new URLSearchParams(window.location.search);
    const updates = {};

    const from = parseSeasonParam(params.get('from'));
    if (from) {
      updates.startSeason = from.season;
      updates.startYear   = from.year;
    }

    const to = parseSeasonParam(params.get('to'));
    if (to) {
      updates.endSeason = to.season;
      updates.endYear   = to.year;
    }

    const genres = params.get('genres');
    if (genres) {
      const parsed = genres.split(',').map((g) => g.trim()).filter((g) => VALID_GENRE.test(g));
      if (parsed.length > 0) updates.selectedGenres = parsed;
    }

    const format = params.get('format');
    if (format && VALID_FORMATS.includes(format)) updates.format = format;

    const current = params.get('current');
    if (current !== null) updates.includeCurrentSeason = current === 'true';

    const full = params.get('full');
    if (full !== null) updates.fullData = full === 'true';

    if (Object.keys(updates).length > 0) {
      // URL params found — apply them (triggers subscription → writes canonical URL)
      useFilterStore.setState(updates);
    } else {
      // No URL params — write current (possibly persisted) state to URL immediately
      window.history.replaceState(
        null, '',
        `?${buildUrlParams(useFilterStore.getState())}`,
      );
    }

    return unsubscribe;
  }, []);
}
