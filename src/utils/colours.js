const GENRE_COLOURS = {
  'Action':        '#a78bfa',
  'Adventure':     '#34d399',
  'Comedy':        '#fb923c',
  'Drama':         '#f87171',
  'Fantasy':       '#60a5fa',
  'Romance':       '#f472b6',
  'Sci-Fi':        '#22d3ee',
  'Thriller':      '#fbbf24',
  'Horror':        '#ef4444',
  'Slice of Life': '#4ade80',
  'Sports':        '#f97316',
  'Mystery':       '#818cf8',
  'Supernatural':  '#c084fc',
  'Psychological': '#f43f5e',
  'Mecha':         '#3b82f6',
  'Isekai':        '#8b5cf6',
  'Shounen':       '#f59e0b',
  'Shoujo':        '#ec4899',
  'Seinen':        '#6366f1',
  'Josei':         '#db2777',
  'Historical':    '#d97706',
  'Military':      '#64748b',
  'Music':         '#e879f9',
  'School':        '#2dd4bf',
  'Magic':         '#a855f7',
  'Harem':         '#fdba74',
  'Award Winning': '#fde68a',
  'Gourmet':       '#86efac',
  'Suspense':      '#0ea5e9',
  'Strategy Game': '#7c3aed',
  'Boys Love':     '#f9a8d4',
  'Girls Love':    '#fda4af',
  'Ecchi':         '#fb7185',
};

const FALLBACK_PALETTE = [
  '#a78bfa', '#34d399', '#fb923c', '#f87171', '#60a5fa',
  '#f472b6', '#22d3ee', '#fbbf24', '#4ade80', '#818cf8',
];

const SEASON_COLOURS = {
  winter: '#93c5fd',
  spring: '#f9a8d4',
  summer: '#fbbf24',
  fall:   '#f97316',
};

export function getSeasonColour(season) {
  return SEASON_COLOURS[season?.toLowerCase()] ?? '#94a3b8';
}

export function getGenreColour(genre) {
  if (GENRE_COLOURS[genre]) return GENRE_COLOURS[genre];
  // Deterministic fallback based on name hash
  let hash = 0;
  for (let i = 0; i < genre.length; i++) hash = (hash * 31 + genre.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export default GENRE_COLOURS;
