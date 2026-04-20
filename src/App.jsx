import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import NavBar           from './components/NavBar';
import FilterBar        from './components/FilterBar';
import TitleDetailPanel from './components/TitleDetailPanel';
import { LoadingBar, ErrorBanner } from './components/SkeletonLoader';

import { useSeasonData }  from './hooks/useSeasonData';
import { useGenreTrends } from './hooks/useGenreTrends';
import { useUrlSync }     from './hooks/useUrlSync';
import { GenreTrendsContext } from './contexts/GenreTrendsContext';

import SummaryPage         from './pages/SummaryPage';
import GenresPage          from './pages/GenresPage';
import StudiosPage         from './pages/StudiosPage';
import DiscoverPage        from './pages/DiscoverPage';
import GenreDrillDownPage  from './pages/GenreDrillDownPage';
import StudioDrillDownPage from './pages/StudioDrillDownPage';

export default function App() {
  useUrlSync();

  const queryClient = useQueryClient();
  const { entries, isLoading, isError, errorDetail, seasonRange } = useSeasonData();
  const genreTrendsData = useGenreTrends(entries, seasonRange);

  const [selectedTitle, setSelectedTitle] = useState(null);

  const handleTitleClick = useCallback((title) => {
    setSelectedTitle(title);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTitle(null);
  }, []);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['season'] });
  }, [queryClient]);

  const isRefetching = isLoading && entries.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <LoadingBar visible={isRefetching} />

      {/* Sticky header: NavBar + FilterBar */}
      <div className="sticky top-0 z-40 w-full">
        <NavBar />
        <FilterBar entries={entries} genresLoading={isLoading} />
      </div>

      {isError && (
        <div className="w-full px-4 pt-4" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <ErrorBanner
            message={`Failed to load season data${errorDetail ? `: ${errorDetail}` : ''}. Some seasons may not have loaded.`}
            onRetry={handleRetry}
          />
        </div>
      )}

      <GenreTrendsContext.Provider value={genreTrendsData}>
        <Routes>
          <Route path="/"          element={<SummaryPage  onTitleClick={handleTitleClick} />} />
          <Route path="/genres"    element={<GenresPage   onTitleClick={handleTitleClick} />} />
          <Route path="/studios"   element={<StudiosPage />} />
          <Route path="/discover"  element={<DiscoverPage onTitleClick={handleTitleClick} />} />
          <Route path="/genres/:genre"   element={<GenreDrillDownPage  onTitleClick={handleTitleClick} />} />
          <Route path="/studios/:studio" element={<StudioDrillDownPage onTitleClick={handleTitleClick} />} />
        </Routes>
      </GenreTrendsContext.Provider>

      <TitleDetailPanel title={selectedTitle} onClose={handleClosePanel} />

      <footer
        className="w-full text-center py-3 text-xs mt-auto"
        style={{ color: 'var(--text-muted)', borderTop: '0.5px solid var(--border)' }}
      >
        Data sourced from{' '}
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-violet)', textDecoration: 'none' }}
        >
          AniList
        </a>
      </footer>
    </div>
  );
}
