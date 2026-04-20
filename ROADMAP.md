# AnimePulse — Roadmap

## Completed

- **Summary page** (`/`) — stat tiles, season highlights strip (top-rated and most-watched title per season, clickable), and Breakout / Most Watched ranked titles panel.
- **Genres page** (`/genres`) — genre trend chart, heatmap, momentum bar chart, and co-occurrence chord diagram. Separated from the Summary page so title-level and genre-level content each have a clear home.
- **Genre drill-down** (`/genres/:genre`) — stat tiles, trend chart (Avg Score / Avg Members / Title Count toggle, dashed All Genres baseline in Score and Avg Members modes), score distribution histogram, ranked titles sidebar. Navigable from every genre label across the app.
- **Studio drill-down** (`/studios/:studio`) — stat tiles, trend chart (Avg Score / Avg Members / Title Count toggle, dashed All Studios baseline in Score and Avg Members modes), genre breakdown bar chart with clickable genre labels, ranked titles sidebar. Navigable from the Studios table and matrix row headers.
- **Hidden gem finder** (`/discover`) — log-scale scatter plot of score vs popularity with gem-zone quadrant shading, reference lines, and highlighted gem dots coloured by genre. Configurable min-score threshold (7.0 / 7.5 / 8.0) and popularity cutoff (Niche / Hidden / Underrated percentile bands). Gem grid below the chart ranked by composite score (rating + obscurity), with genre pills and popularity deficit badges.
- **Studios page** (`/studios`) — stat tiles (Studios Tracked, Top by Score, Top by Popularity), sortable all-studios table (Titles, Avg Score, Avg Members, Top Genre, Score Trend), and Studio × Genre Matrix heatmap as a secondary genre-overlap view.
- **Studio × Genre Matrix** — heatmap on the Studios page. Avg Score / Avg Members / Title Count modes, hover tooltip, studio row headers navigate to drill-down. Subtitle explains the "top N of M studios in selected genres" selection logic.
- **Genre co-occurrence chord diagram** — arc size = total title count; ribbon width = shared title count. Hover to highlight connections, click to navigate to genre drill-down.
- **Genre navigation** — every genre label across all charts navigates to `/genres/:genre`.
- **Studio navigation** — studio names in the table and matrix row headers navigate to `/studios/:studio`.
- **Consistent toggle labels** — all mode toggles across the app use "Avg Score / Avg Members / Title Count" labels with a dynamic description ("Avg score per title", etc.) matching the active mode.
- **Consistent tooltips** — all bar and line charts use custom `content` tooltip components with a uniform visual style. No Recharts built-in `contentStyle` / `formatter` pattern anywhere in the app.
- **Multi-page routing** — Summary, Genres, Studios, Discover, Genre drill-down, and Studio drill-down with a persistent NavBar.
- **Performance — shared genre trends context** — `useGenreTrends` (15+ `useMemo` computations) runs once in `App.jsx` and is shared via React Context. Page navigation no longer triggers recomputation; memos survive the full session.
- **Code quality audit** — removed dead files (`TrendsPage`, `BreakoutTitles`, `MostWatchedTitles`, `StudioMomentum`), extracted `formatMembers` to a single shared utility (`utils/format.js`), extracted `computeBaselineByKey` to `utils/transforms.js`, removed an unused prop from `GenreTrendChart`.

## Planned

### Data Gaps

- **Season comparison mode** — select any two seasons and diff them directly: which genres rose/fell, which titles appeared or disappeared. The trend chart shows change over time but can't isolate two points head-to-head.

### Making Existing Data Richer

- **Score distribution** — per-genre distribution is now on the drill-down page; a cross-genre comparison view (box plot or violin plot) showing spread across all selected genres in one chart is still missing.

### Visualisation

- **Seasonal pattern chart** — a radial/polar layout placing Winter, Spring, Summer, Fall as quadrants and years as concentric rings, making cyclical genre patterns explicit rather than implied by the heatmap.
- **Shareable snapshots** — URL sync already exists for filters; extend it to deep-link to a specific panel + filter state for sharing a particular view.

### Infrastructure

- **Vercel KV caching proxy** — replace the current passthrough `vercel.json` rewrite with a serverless function that caches AniList responses server-side (Vercel KV). First user of the day fetches live; everyone after gets a cached response instantly. Completed seasons could be cached for days; current season for ~1 hour.
- **Build-time static JSON** — pre-generate season data as static JSON files at build time and hydrate React Query from them before making any network requests. Requires a scheduled CI rebuild to stay fresh but needs no new infrastructure.
