import { createContext, useContext } from 'react';

export const GenreTrendsContext = createContext(null);

export function useGenreTrendsContext() {
  return useContext(GenreTrendsContext);
}
