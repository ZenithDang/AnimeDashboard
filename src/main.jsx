import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './index.css';
import App from './App.jsx';

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 h

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  10 * 60 * 1000, // 10 min — fresh window, no refetch
      gcTime:     CACHE_MAX_AGE,  // must be >= persister maxAge
      retry:      2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key:     'animepulse-cache-v2', // increment on breaking entry schema changes
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </PersistQueryClientProvider>
  </StrictMode>,
);
