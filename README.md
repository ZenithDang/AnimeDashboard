# AniSeasonr — Anime Season Trend Dashboard

A multi-page dashboard for exploring genre trends, viewership, breakout titles, and studio output across anime seasons. Data is sourced from the [AniList GraphQL API](https://anilist.co).

## Pages

### Summary (`/`)

- **Tab Teasers** — three navigation cards at the top of the page linking to Genres, Studios, and Discover. Each card shows a live mini data preview: momentum bars (rising/falling % by genre), a top-3 studio leaderboard by avg score, and a top-3 hidden gem list (score ≥ 7.5, below 50th-percentile in viewership). Hovering highlights the card border in its accent colour.
- **Ranked Titles** — two-column layout showing the top 5 *Breakout* titles (most above their genre's avg score) and top 5 *Most Watched* titles (by AniList members) side by side. Each row includes a cover art thumbnail with rank overlay, score or member badge, genre pills (navigable to drill-down), and a delta or score secondary badge. Stacks to a single column on mobile.

### Genres (`/genres`)

- **Genre Trends** — multi-line chart showing avg score, avg members, or title count per genre across seasons. Each mode includes a dashed **All Genres** baseline. Toggle labels: **Avg Score / Avg Members / Title Count**. Toggle description updates with the active mode. Hover a data point to see the top 3 titles for that genre/season. Click a genre label to navigate to its drill-down page.
- **Genre Heatmap** — genre × season grid. Toggle between **Avg Score** (violet), **Avg Members** (teal), and **Title Count** (orange) modes. Score uses a fixed 6.0–9.0 scale; Members and Title Count scale relative to the current dataset. Click a genre row header to navigate to its drill-down page.
- **Genre Momentum** — bar chart showing % change per genre from the first to the last season in the selected range, colour-coded rising/declining. Toggle between **Avg Score**, **Avg Members**, and **Title Count**. Click a genre label on the Y-axis to navigate to its drill-down page.
- **Genre Co-occurrence** — chord diagram showing how often genres appear together across all titles in the selected range. Arc size represents a genre's total title count; ribbon width represents the number of titles shared between two genres. Hover an arc to highlight a genre's connections; hover a ribbon to see the exact pair count. Click an arc to navigate to that genre's drill-down page.

### Studios (`/studios`)

- **Stat tiles** — Studios Tracked, Top by Score (clickable → studio drill-down), Top by Popularity (clickable → studio drill-down).
- **All Studios table** — sortable by any column: Studio, Titles, Avg Score, Avg Members, Top Genre, Score Trend. Score Trend compares the first half vs second half of the selected season range (↑ / → / ↓). Click any row to navigate to the studio drill-down. Click a Top Genre pill to navigate to the genre drill-down.
- **Studio × Genre Matrix** — heatmap with studios as rows and selected genres as columns. Shows the top studios by title count in selected genres. Toggle between **Avg Score** (violet, fixed 6–9 scale), **Avg Members** (teal, relative), and **Title Count** (orange, relative). Hover a cell to see the metric value and up to 3 example titles. Click a studio row header to navigate to its drill-down page.

### Genre Drill-Down (`/genres/:genre`)

Per-genre detail page navigable from any genre label across the app.

- **Stat tiles** — Titles, Seasons, Avg Score, Avg Popularity, Best Season (by avg score).
- **Trend Over Time** — line chart with **Avg Score / Avg Members / Title Count** mode toggle. Score and Avg Members modes both overlay a dashed All Genres baseline for comparison. Toggle description updates with the active mode.
- **Score Distribution** — histogram of title score buckets for the genre.
- **Ranked Titles sidebar** — Top Rated / Most Watched tabs, up to 8 titles each. Click any card to open the detail panel.

### Studio Drill-Down (`/studios/:studio`)

Per-studio detail page navigable from the Studios table and Studio × Genre Matrix row headers.

- **Stat tiles** — Titles, Seasons, Avg Score, Avg Members, Top Genre (clickable → genre drill-down).
- **Trend Over Time** — line chart with **Avg Score / Avg Members / Title Count** mode toggle. Score and Avg Members modes both overlay a dashed All Studios baseline for comparison. Toggle description updates with the active mode.
- **Genre Breakdown** — horizontal bar chart of titles per genre; each bar is coloured by genre accent and the genre label is clickable → genre drill-down.
- **Ranked Titles sidebar** — Top Rated / Most Watched tabs, up to 8 titles each.

### Discover (`/discover`)

Hidden gem finder — titles with high scores relative to their viewership.

- **Score vs Popularity scatter plot** — log-scale X-axis (AniList members), Y-axis (score). Gem-zone quadrant is shaded; reference lines mark the active score threshold and member cutoff. Highlighted dots are coloured by primary genre and are clickable.
- **Controls** — Min score threshold (7.0 / 7.5 / 8.0) and Max popularity band (Niche 25th pct / Hidden 50th pct / Underrated 75th pct).
- **Gem grid** — top 10 gems ranked by a composite score (high rating + low popularity). Each card shows score, member count, season, genre pills (navigable), and a popularity deficit badge.

### Privacy Policy (`/privacy`)

GDPR-compliant privacy policy. Covers data controller contact details, browser localStorage usage, third-party data processors (Vercel infrastructure logs, Vercel Web Analytics, Vercel Speed Insights, AniList API), legal bases for processing, retention periods, international transfer safeguards (SCCs / EU–US DPF), and EU/UK data subject rights. Linked from the site footer.

## Title Detail Panel

Slide-in drawer available from any title click across the app. Shows cover image, score, popularity, genres, synopsis, and a Viewership Breakdown section. The breakdown fires a single AniList statistics request on open and renders a segmented Watching / Completed / On Hold / Dropped / Plan to Watch bar with a colour-coded legend.

## Filters

All filter state persists across sessions via `localStorage` and is reflected in the URL — shareable links restore the exact view.

- **Season range** — select start and end season/year. Defaults to the last 6 completed seasons.
- **+ Current season toggle** — opt in to including the in-progress season. Off by default since incomplete data can skew scores and counts.
- **Format** — TV, Movie, OVA, ONA.
- **Top 50 / All titles toggle** — defaults to the top 50 titles per season by popularity (fast, 1 request per season). Enable *All titles* to paginate through the full season data (slower, multiple requests per season).
- **Genre multi-select** — searchable dropdown. Only genres present in the loaded data are shown.

## Stack

| Layer         | Choice                          |
| ------------- | ------------------------------- |
| Framework     | React 19 + Vite 8               |
| Routing       | React Router DOM v6             |
| Styling       | Tailwind CSS v4                 |
| Charts        | Recharts + D3 (chord diagram)   |
| Data fetching | TanStack React Query v5         |
| State         | Zustand v5 (with persistence)   |
| API           | AniList GraphQL                 |

## Getting Started

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173`. On first load it pre-populates with the last 6 seasons across 5 default genres — there is no empty state.

The layout is fully responsive. On mobile the filter controls collapse behind a **Filters** toggle button in the header, and the sidebar stacks below the charts.

## Project Structure

```text
src/
  api/
    anilist.js              — AniList GraphQL client, season pagination (top-50 or full),
                              per-title statistics fetch, response normaliser,
                              and concurrency-limited request queue (max 3 in-flight)
  components/
    NavBar.jsx              — top navigation bar (Summary, Genres, Studios, Discover)
    FilterBar.jsx           — season range, current season toggle, Top 50/All titles toggle,
                              genre multi-select, format filter; collapses to a toggle on mobile
    GenreTrendChart.jsx     — Avg Score / Avg Members / Title Count line chart with All Genres baseline
    ScoreHeatmap.jsx        — Avg Score / Avg Members / Title Count genre × season heatmap
    GenreMomentum.jsx       — % change bar chart (Avg Score / Avg Members / Title Count)
    GenreChordDiagram.jsx   — D3 chord diagram of genre co-occurrence
    StudioTable.jsx         — sortable all-studios table (Avg Score, Avg Members, Titles, Top Genre, Score Trend)
    StudioGenreMatrix.jsx   — studio × genre heatmap (Avg Score / Avg Members / Title Count)
    RankedTitlesPanel.jsx   — two-column Breakout / Most Watched title list (top 5 each, cover art thumbnails)
    TitleDetailPanel.jsx    — slide-in detail drawer with completion funnel
    SkeletonLoader.jsx      — loading skeletons and error banner
  contexts/
    GenreTrendsContext.jsx  — React context that exposes useGenreTrends data app-wide,
                              preventing recomputation on page navigation
  pages/
    SummaryPage.jsx          — / route: tab teasers with mini previews, ranked titles (2-column)
    GenresPage.jsx           — /genres route: genre trend, heatmap, momentum, chord diagram
    StudiosPage.jsx          — /studios route: stat tiles, studio table, studio×genre matrix
    DiscoverPage.jsx         — /discover route: hidden gem scatter plot + gem grid
    GenreDrillDownPage.jsx   — /genres/:genre route: per-genre trend, distribution, ranked titles
    StudioDrillDownPage.jsx  — /studios/:studio route: per-studio trend, genre breakdown, ranked titles
    PrivacyPage.jsx          — /privacy route: GDPR-compliant privacy policy
  hooks/
    useSeasonData.js         — React Query hook for season fetching + format filter
    useGenreTrends.js        — score, popularity, count, co-occurrence, studio aggregation,
                               and studio table data; called once in App.jsx
                               and shared via GenreTrendsContext
    useGenreDrillDown.js     — per-genre aggregation for the genre drill-down page
    useStudioDrillDown.js    — per-studio aggregation for the studio drill-down page
    useAnimeStatistics.js    — on-demand per-title statistics for the detail panel
    useGenres.js             — derives available genres from loaded entries
    useDebounce.js           — debounces season range inputs
    useUrlSync.js            — bidirectional sync between filter store and URL search params
  store/
    filterStore.js          — Zustand store with persistence (filter state, current season toggle,
                              Top 50/All titles flag)
    uiStore.js              — Zustand store with persistence (active mode per chart panel:
                              chartMode, momentumMode)
  utils/
    transforms.js           — API normalisation, score / popularity / count aggregation,
                              genre co-occurrence matrix, studio×genre aggregation,
                              studio table data, per-season baseline computation,
                              chart data builders, HTML entity decoder
    colours.js              — genre → accent colour mapping
    format.js               — shared formatMembers utility (K/M number formatting)
    requestQueue.js         — concurrency limiter for AniList API requests
```

## API Notes

- AniList requests are proxied through `/anilist-gql` — Vite handles this in development (`vite.config.js`), Vercel handles it in production (`vercel.json`).
- Adult content is filtered at the query level via `isAdult: false`.
- By default the app fetches only the first page per season (top 50 titles by popularity). Enable *All titles* in the filter bar to paginate through the full season. Both datasets are cached independently — switching back to Top 50 after a full fetch is instant.
- A concurrency limiter caps AniList requests to 3 in-flight at a time. Retries on 429 responses are capped at 3 attempts and honour the `Retry-After` header.
- React Query persists the cache to `localStorage` (24-hour TTL, key `animepulse-cache-v2`). Returning users within that window see data instantly with no network requests. After 10 minutes the cache is stale and silently refetches in the background.
- Genre list is derived client-side from loaded entries — the dropdown only shows genres present in the selected season range.
- Per-title statistics are fetched on demand when a detail panel opens, cached for the session. Closing and reopening the same title is instant.

## Deployment

```bash
npm run build        # outputs to dist/
npx vercel           # deploy to Vercel
```

`vercel.json` configures two things:

- **Proxy rewrite** — `/anilist-gql` → `https://graphql.anilist.co`, keeping the AniList origin same-origin in production (mirrors the Vite dev proxy).
- **Security headers** — applied to all routes: a strict `Content-Security-Policy` (no `unsafe-inline`; all scripts, styles, and fonts are self-hosted; only the AniList image CDN is allowlisted externally), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `frame-ancestors 'none'`.
