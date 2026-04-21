import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import useFilterStore, { SEASONS, getCurrentSeason, defaultStart, defaultEnd, DEFAULT_GENRES, DEFAULT_FORMAT } from '../store/filterStore';
import { useGenres } from '../hooks/useGenres';

const SEASON_LABELS  = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall' };
const FORMAT_OPTIONS = ['TV', 'Movie', 'OVA', 'ONA'];

const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 2010 + 1 },
  (_, i) => 2010 + i,
).reverse();

export default function FilterBar({ entries = [], genresLoading = false }) {
  const {
    startSeason, startYear, endSeason, endYear,
    selectedGenres, format, includeCurrentSeason, fullData,
    setStartSeason, setStartYear, setEndSeason, setEndYear,
    setFormat, toggleGenre, resetFilters, toggleCurrentSeason, toggleFullData,
  } = useFilterStore();

  const currentSeason = getCurrentSeason();
  const currentYear   = new Date().getFullYear();

  const isDirty = (
    startSeason !== defaultStart.season ||
    startYear   !== defaultStart.year   ||
    endSeason   !== defaultEnd.season   ||
    endYear     !== defaultEnd.year     ||
    format      !== DEFAULT_FORMAT      ||
    includeCurrentSeason                ||
    fullData                            ||
    selectedGenres.length !== DEFAULT_GENRES.length ||
    selectedGenres.some((g) => !DEFAULT_GENRES.includes(g))
  );

  const { pathname } = useLocation();
  const onDrillDown = pathname.startsWith('/genres/') || pathname.startsWith('/studios/');

  const genres = useGenres(entries);

  const [genreOpen,   setGenreOpen]   = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleToggleGenre = useCallback((genre) => toggleGenre(genre), [toggleGenre]);

  const handleGenreOpen = useCallback((open) => {
    setGenreOpen(open);
    if (!open) setGenreSearch('');
  }, []);

  const filteredGenres = genres.filter((g) =>
    g.toLowerCase().includes(genreSearch.toLowerCase()),
  );

  return (
    <header
      className="w-full"
      style={{ background: 'var(--bg-base)', borderBottom: '0.5px solid var(--border)' }}
    >
      <div className="max-w-[1600px] mx-auto px-4 flex flex-wrap items-center gap-x-4 py-3">

        {/* Mobile toggle — hidden on desktop */}
        <button
          className="md:hidden ml-auto flex items-center gap-2 text-xs px-3 py-1.5"
          onClick={() => setFiltersOpen((o) => !o)}
          style={{
            borderRadius: '20px',
            border: `0.5px solid ${filtersOpen ? 'var(--accent-violet)' : 'var(--border)'}`,
            background: filtersOpen ? 'rgba(167,139,250,0.1)' : 'transparent',
            color: filtersOpen ? 'var(--accent-violet)' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Filters
          <span
            className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full"
            style={{ background: 'var(--accent-violet)', color: '#fff' }}
          >
            {selectedGenres.length}
          </span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}>
            <path
              d={filtersOpen ? 'M1 5L5 1L9 5' : 'M1 1L5 5L9 1'}
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Filter controls
            - Mobile: w-full forces wrap to new line; hidden when closed, flex column when open
            - Desktop: always visible, flex row inline with logo */}
        <div
          className={`
            w-full md:flex-1 md:w-auto
            ${filtersOpen ? 'flex' : 'hidden'} md:flex
            flex-col md:flex-row md:flex-wrap
            items-start md:items-center
            gap-3 md:gap-4
            pt-3 md:pt-0 pb-3 md:pb-0
            border-t md:border-0
          `}
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Season Range */}
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--text-muted)' }}>From</span>
            <SeasonSelect
              season={startSeason} year={startYear}
              onSeasonChange={setStartSeason} onYearChange={setStartYear}
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <SeasonSelect
              season={endSeason} year={endYear}
              onSeasonChange={setEndSeason} onYearChange={setEndYear}
            />
            <button
              onClick={toggleCurrentSeason}
              title={`${includeCurrentSeason ? 'Exclude' : 'Include'} current in-progress season`}
              className="px-2.5 py-1 text-xs transition-colors"
              style={{
                borderRadius: '20px',
                border: `0.5px solid ${includeCurrentSeason ? 'var(--accent-teal)' : 'var(--border)'}`,
                background: includeCurrentSeason ? 'rgba(45,212,191,0.12)' : 'transparent',
                color: includeCurrentSeason ? 'var(--accent-teal)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              + {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} {currentYear}
            </button>
          </div>

          {/* Format Filter + Full Data toggle */}
          <div className="flex items-center gap-1 flex-wrap">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-3 py-1 text-xs transition-colors"
                style={{
                  borderRadius: '20px',
                  border: `0.5px solid ${format === f ? 'var(--accent-violet)' : 'var(--border)'}`,
                  background: format === f ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: format === f ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
            <button
              onClick={toggleFullData}
              title={fullData ? 'Showing all titles — click for top 50 per season' : 'Showing top 50 per season — click to load all titles (slower)'}
              className="px-3 py-1 text-xs transition-colors"
              style={{
                borderRadius: '20px',
                border: `0.5px solid ${fullData ? 'var(--accent-amber)' : 'var(--border)'}`,
                background: fullData ? 'rgba(251,191,36,0.12)' : 'transparent',
                color: fullData ? 'var(--accent-amber)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {fullData ? 'All titles' : 'Top 50'}
            </button>
          </div>

          {/* Genre Multi-Select — hidden on drill-down detail pages */}
          {!onDrillDown && <div className="relative">
            <button
              onClick={() => handleGenreOpen(!genreOpen)}
              className="flex items-center gap-1 px-3 py-1 text-xs transition-colors"
              style={{
                borderRadius: '20px',
                border: '0.5px solid var(--border)',
                background: genreOpen ? 'rgba(167,139,250,0.1)' : 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Genres
              <span
                className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full"
                style={{ background: 'var(--accent-violet)', color: '#fff' }}
              >
                {selectedGenres.length}
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}>
                <path
                  d={genreOpen ? 'M1 5L5 1L9 5' : 'M1 1L5 5L9 1'}
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>

            {genreOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-50 flex flex-col"
                style={{
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '12px',
                  width: 'min(320px, calc(100vw - 2rem))',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  maxHeight: '320px',
                }}
              >
                {/* Search input */}
                <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <input
                    autoFocus
                    type="text"
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    placeholder="Search genres…"
                    className="w-full text-xs px-2.5 py-1.5 outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '0.5px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Genre list */}
                <div className="p-3 overflow-y-auto flex flex-wrap gap-1.5">
                  {genresLoading ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading genres…</span>
                  ) : filteredGenres.length === 0 ? (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No genres found</span>
                  ) : (
                    filteredGenres.map((genre) => {
                      const active = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => handleToggleGenre(genre)}
                          className="px-2.5 py-1 text-xs transition-all"
                          style={{
                            borderRadius: '20px',
                            border: `0.5px solid ${active ? 'var(--accent-violet)' : 'var(--border)'}`,
                            background: active ? 'rgba(167,139,250,0.2)' : 'transparent',
                            color: active ? 'var(--accent-violet)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {genre}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>}

          {/* Selected genre pills — hidden on drill-down detail pages */}
          {!onDrillDown && (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="flex items-center gap-1 px-2 py-0.5 text-xs"
                style={{
                  borderRadius: '20px',
                  background: 'rgba(167,139,250,0.1)',
                  border: '0.5px solid rgba(167,139,250,0.3)',
                  color: 'var(--accent-violet)',
                }}
              >
                {genre}
                <button
                  onClick={() => toggleGenre(genre)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          )}

          {/* Reset button — only shown when filters differ from defaults */}
          {isDirty && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs transition-colors flex-shrink-0"
              style={{
                borderRadius: '20px',
                border: '0.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Backdrop for genre dropdown */}
      {genreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => handleGenreOpen(false)} />
      )}
    </header>
  );
}

function SeasonSelect({ season, year, onSeasonChange, onYearChange }) {
  return (
    <div className="flex items-center gap-1">
      <select
        value={season}
        onChange={(e) => onSeasonChange(e.target.value)}
        className="text-xs px-2 py-1"
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {SEASONS.map((s) => (
          <option key={s} value={s}>{SEASON_LABELS[s]}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="text-xs px-2 py-1"
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
