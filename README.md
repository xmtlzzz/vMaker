# vMaker

[![CI](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml/badge.svg)](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml)

**English** · [简体中文](./README.zh-CN.md)

> A React Router 7 (SSR) gateway that turns the public GitHub work of `xmtlzzz` into a curated, searchable project index.

## The problem

Public work is spread across many repositories, and neither a GitHub profile nor a plain repository list makes it browsable:

- there is no search across project names, descriptions, languages and topics
- there is no grouping by language, so you cannot see what someone actually works in
- per-repository pages hide the aggregate view — total code size, language mix, and what was touched most recently across everything
- hand-maintained portfolio sites go stale: every push means editing a database or a content file, so the site drifts away from reality

`vMaker` reads GitHub directly instead of mirroring it. The repository list *is* the content, so the index is current the moment something is pushed — no second data source, no admin layer, and no duplicated project records to keep in sync. Each project also gets its own URL and social preview, so individual work can be linked and shared instead of being buried in one long page.

## Overview

`vMaker` reads repository data from GitHub, adds a small amount of local presentation metadata, and renders it as a searchable, language-grouped project index at [vmaker.xmtlz.dev](https://vmaker.xmtlz.dev).

It is **not** an admin panel and it does **not** maintain a separate project database. GitHub is the only source of truth.

If GitHub is unavailable on a cold start, the site degrades to a small payload derived from the local overrides instead of rendering an empty index.

## Features

- Full-screen hero with layered local SVG artwork (`public/hero-*.svg`), respecting `prefers-reduced-motion`
- Theme toggle (light / dark) that persists and is applied **before first paint**
- Accent color presets with persistence
- ZH / EN copy toggle with persistence
- Project index grouped by primary language
- Per-project stats: stars, forks, code size, and a language composition bar + legend
- Featured projects pinned to the top of the index with a badge
- Search across project name, description, primary language and topics
- Commit timeline in the left overview column
  - one latest commit per project
  - ordered by commit time
  - hover-linked with the project cards
- Language navigation rail with anchor jumps
- Scroll assist: section snap between hero and index, plus a back-to-top button
- Discovery surface: an RSS feed at `/feed.xml` and a generated `/sitemap.xml`
- A detail page for every project at `/projects/<name>`: full language composition, related projects, and a shareable social preview. The card title links to it

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19 |
| Framework | React Router 7 (SSR) |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Components | shadcn-compatible config (`components.json`), lucide-react |
| Font | Figtree (Google Fonts, 400/500/600) |
| Quality | Prettier, ESLint 9 (flat config) |
| Hosting | Cloudflare Workers (default) or any Node host / Vercel |

## Requirements

- **Node 22+** — `wrangler` requires `>=22`, `vite` requires `^20.19 || >=22.12`. CI pins Node 22.
- npm

## Quick start

```bash
npm install

# add a real GitHub token (see Environment variables)
cp .env.example .env

npm run dev
```

For `wrangler dev` (the Cloudflare runtime locally) copy the other example file instead:

```bash
cp .dev.vars.example .dev.vars
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | `react-router build` → `build/client` + `build/server` |
| `npm run start` | Serve an existing build with `react-router-serve` |
| `npm test` | Run the unit tests via `vite-node` |
| `npm run typecheck` | `react-router typegen && tsc` |
| `npm run lint` | `eslint .` |
| `npm run format` | `prettier --write` |
| `npm run deploy` | Build, then `wrangler deploy` (Cloudflare) |
| `npm run cf:dev` | Build, then `wrangler dev` |
| `npm run cf:types` | `wrangler types` |

## Quality gates

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, in this order:

```text
npm ci → build → typecheck → test → prettier --check → lint
```

> ⚠️ **`build` must run before `typecheck`.** `worker.ts` does `import * as build from './build/server'`, and `build/` is gitignored. On a clean checkout `tsc` fails with `Cannot find module './build/server'` until a build has produced that directory. The same applies locally — run `npm run build` before `npm run typecheck`.

Tests use plain `node:assert` executed through `vite-node`. The `test` script chains the five test files explicitly (`app/lib/github/projects.test.ts`, `graphql.test.ts`, `rest.test.ts`, `app/lib/projects-view.test.ts`, then `app/lib/feed.test.ts`), so adding a new file means updating that script.

`rest.test.ts` stubs `globalThis.fetch` instead of touching the network, so the REST reader stays covered regardless of the GitHub rate limit.

Lint reports **0 errors and 3 warnings**, all from `react-hooks/set-state-in-effect`: the shared hook seeds theme, accent and locale from `localStorage` on mount, and `home.tsx` closes menus when the hero slide changes.

## Environment variables

```bash
GITHUB_TOKEN=your_github_token
```

- `GITHUB_TOKEN` is **strongly recommended**. The site fetches languages and recent commits per repository, so an unauthenticated client is easy to rate-limit.
- The placeholder string `your_github_token` is ignored by `githubHeaders()`. Using it is identical to having no token.
- Without a real token the unauthenticated limit (60 requests/hour per IP) is hit quickly. On Cloudflare the shared egress IP hits it almost immediately, GitHub returns `403 Forbidden`, and the site falls back to a payload containing only `vMaker`.
- Cloudflare: add `GITHUB_TOKEN` as a Worker secret under *Settings → Variables & Secrets*.
- Node / Vercel: put it in `.env`.

## Project structure

```text
app/
  app.css                        Global styles, hero styling, timeline layout, theme + detail-page CSS
  root.tsx                       Root layout: fonts, <html lang>, and the pre-hydration theme bootstrap script
  routes.ts                      Route table: index, project detail page, two XML resource routes
  entry.server.tsx               Web-standard SSR entry (renderToReadableStream) so it runs on Workers
  routes/
    home.tsx                     Homepage orchestration: state, effects, hero + index composition
    project.tsx                  Project detail page (/projects/:name) + 404 ErrorBoundary
    feed.ts                      Resource route: /feed.xml (RSS 2.0)
    sitemap.ts                   Resource route: /sitemap.xml (home + every project)
  components/
    layout/site-header.tsx       Top navigation, locale / theme / accent controls, mobile menu
    sections/
      project-panel.tsx          Project card: stats, language composition, topics, links
      project-language-section.tsx  One language group + its cards
      project-metric.tsx         Overview-column metric card
      project-empty.tsx          Empty / unavailable state
      project-detail-aside.tsx   Detail page aside: metrics, meta rows, actions
      related-projects.tsx       Related projects section of the detail page
    language-badges.tsx          Per-language SVG badges + accent class mapping
    react-bits/                  Visual effects (BorderGlow, LogoLoop, VariableProximity)
    ui/                          Base UI primitives (shadcn-style)
  data/
    copy.ts                      All ZH / EN interface copy (Locale = 'en' | 'zh')
    accents.ts                   Accent presets
    hero-slides.ts               Hero slide content
    stack-logos.tsx              Stack logo loop items
    project-overrides.ts         Local repository presentation overrides
  hooks/
    use-reveal-on-view.ts        IntersectionObserver reveal helper
    use-site-preferences.ts      Locale / theme / accent persistence, shared by all routes
  lib/
    config.ts                    Storage keys, site URL, social image, Theme type
    feed.ts                      RSS + sitemap builders and XML/date helpers (pure)
    feed.test.ts                 Unit tests for the builders
    language.ts                  Language naming, ids, nav labels, colors
    projects-view.ts             Grouping, commit timeline and related-project scoring (pure)
    github/types.ts              Shared shapes: GitHubRepo, RepoDetails, Project, RepoIndex
    github/client.ts             Token resolution and the REST / GraphQL transports
    github/graphql.ts            The one-shot ProjectIndex query and its pure mapper
    github/projects.ts           REST reader, cache, payload building, formatters
    github/context.ts            Pulls GITHUB_TOKEN out of the Cloudflare load context
    github/projects.test.ts      Unit tests for the payload builder
    github/graphql.test.ts       Unit tests for the GraphQL mapper and query shape
    github/rest.test.ts          Unit tests for the REST reader (stubbed fetch)
    projects-view.test.ts        Unit tests for related-project scoring
    utils.ts                     cn() class merge helper
public/
  hero-*.svg                     Hero artwork
  robots.txt                     Static crawler file (points at the sitemap)
docs/                            Design references (see Design documents)
worker.ts                        Cloudflare Workers entry (createRequestHandler + cloudflare context)
wrangler.toml                    Workers config, custom domain, static assets binding
```

## Routes

| Route | Type | Purpose |
| --- | --- | --- |
| `/` | Page | Hero + project index |
| `/projects/:name` | Page | Project detail page |
| `/feed.xml` | Resource | RSS 2.0 feed |
| `/sitemap.xml` | Resource | Generated sitemap |

The detail route matches on the GitHub repository name, the same identifier the index uses for its card anchors, so `#vMaker` links and `/projects/vMaker` refer to the same project.

## Data model

GitHub is the source of truth for repository metadata, primary language, topics, stars, forks, timestamps and recent commits.

Fetching behaviour — two readers feed the same payload builder:

- **GraphQL** (used when a token is present): a single `ProjectIndex` query reads the repository list, languages, topics and the last 5 commits per repository in **one request**. The GraphQL API is authenticated-only, so it is never attempted without a token.
- **REST** (the unauthenticated path, and the fallback if the GraphQL read fails): `/users/xmtlzzz/repos?sort=pushed&per_page=100`, then `/languages` and `/commits?per_page=5` per repository, capped at **5 concurrent**.
- Whichever reader runs, results are normalised into `GitHubRepo` + `RepoDetails` in `app/lib/github/*`, so `buildProjectPayload` stays the single place that shapes the data.
- A GraphQL failure is logged (`[vMaker] GitHub GraphQL read failed, falling back to REST — …`) rather than swallowed. Both readers read one page of at most **100 repositories**; the remainder is skipped with a warning.
- A module-level **in-memory cache with a 10 minute TTL** absorbs repeat loads.
- Forks are always excluded; repositories marked `hidden` in the overrides are excluded too.
- Any GitHub failure falls back to the overrides-derived payload, and a stale cache entry is reused if one exists.

The detail page reads the same cached payload, so it costs no additional GitHub requests.

Sorting priority: `featured` → `overrides.order` → `pushedAt` / `updatedAt` (newest first).

Derived per project: `codeSize` (sum of language bytes), `languageShares` (percent, drives the composition bar), and a payload-level `summary` with totals, `primaryLanguages` and `latestActivity`.

Related projects are scored from shared topics (weight 2), a shared primary language (1) and shared secondary languages (0.5 each). Capped at three, and the section is hidden when nothing relates.

Local overrides live in `app/data/project-overrides.ts`:

| Field | Effect |
| --- | --- |
| `displayName` | Card and detail page title |
| `summary` | Description; also the fallback when GitHub has no description |
| `featured` | Pins the project to the top and shows the featured badge |
| `hidden` | Excludes the repository entirely |
| `order` | Manual sort order within the non-featured group |
| `cover` | Preview image on the detail page; GitHub's per-repository card is used when unset |

If GitHub has no description and there is no override summary, the card falls back to a placeholder sentence.

## Theming, accent and locale

- Theme classes (`dark`, `theme-dark`, `theme-light`) live on **`<html>`**, not on the route shell. The route shell keeps only `theme-shell` / `home-canvas`, because CSS scopes theme rules by descendant selectors.
- `app/root.tsx` emits a small inline script in `<head>` that reads `localStorage` **before hydration** and sets the theme class and `<html lang>`. This removes the light-theme flash a dark-theme visitor would otherwise see. It always applies a theme class, falling back to light if storage access throws. `<html>` carries `suppressHydrationWarning` for this reason.
- After hydration the route keeps the `<html>` classes, `<html lang>` and `localStorage` in sync.
- localStorage keys: `vmaker-theme`, `vmaker-accent`, `vmaker-locale` (defined in `app/lib/config.ts`).
- The default locale is `zh`; the copy lives in `app/data/copy.ts` and no interface strings are hardcoded in components.
- The accent is applied as `--vmaker-accent` / `--vmaker-accent-rgb` custom properties on the page shell. `:root` in `app/app.css` defines a default, so declarations that reference the variable stay valid before hydration.

## SEO

Rendered by the route `meta()`:

- `title`, `description`
- `link rel="canonical"`
- `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale`, `og:locale:alternate`
- `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`
- `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`
- `link rel="alternate" type="application/rss+xml"` pointing at `/feed.xml`

Crawler endpoints:

- `public/robots.txt` — static, points at the sitemap
- `/sitemap.xml` — generated from the live payload: one entry for the homepage plus one per project, with `lastmod` from its `pushedAt` (`Cache-Control: public, max-age=600`)
- `/feed.xml` — RSS 2.0 feed, newest activity first

The social image is **not a hand-made asset**: GitHub renders a 1200×600 card for every public repository, so the homepage's `og:image` — and each project detail page's, via `projectOgImage()` — points at `opengraph.githubassets.com`. That keeps `og:image` at zero maintenance cost and needs no second data source. Swap it for a custom 1200×630 asset if the branding ever demands one.

## Deployment

**Cloudflare Workers (default)**

```bash
npm run deploy        # react-router build && wrangler deploy
```

`wrangler.toml` defines the worker, the `vmaker.xmtlz.dev` custom domain, and a `./build/client` static assets binding. `worker.ts` is the entry: it builds a request handler from the server bundle and passes Cloudflare's `env` / `ctx` into React Router's load context, so loaders read `context.cloudflare.env.GITHUB_TOKEN`.

**Node host / Vercel**

1. Push the repository to GitHub
2. Import it into Vercel
3. Set `GITHUB_TOKEN` in the environment
4. Build with `npm install && npm run build`; serve with `npm run start`

Token resolution is platform-agnostic: the Cloudflare binding is passed in explicitly, and `githubHeaders()` falls back to `process.env.GITHUB_TOKEN` otherwise.

## Design documents

| Path | Contents |
| --- | --- |
| `docs/ui-ux-pro-max/design-system.md` | Layout, colour, typography, card, motion and accessibility rules |
| `docs/impeccable/review-rules.md` | Review positioning, visual quality bar, layout/colour/motion/content checklists |
| `docs/karpathy-style/design-principles.md` | Scope and restraint guidelines |
| `docs/react-bits/usage-rules.md` | When and how to use the visual-effect components |
| `docs/superpowers/specs/2026-07-05-homepage-hero-design.md` | Homepage hero design |
| `docs/superpowers/specs/2026-09-10-project-detail-page-design.md` | Project detail page design |
| `docs/base.png` | Original hand-drawn wireframe |
