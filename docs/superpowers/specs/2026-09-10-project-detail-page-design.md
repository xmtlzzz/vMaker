# Project Detail Page Design

Date: 2026-09-10

Status: proposed — not implemented yet

## Goal

Give every repository in the index a stable, linkable home at `projects/:name`, and give
"related projects" a natural place to live.

Today the site is a single route. A visitor can see 18 cards but cannot link to one of them,
share one, or read more than the card's summary. The index works as a browse surface and should
stay exactly as it is; the detail page is the surface for depth.

Related projects is folded into this design rather than shipped separately. Putting "3 related
projects" inside every index card would add 54 links to the homepage and make the cards the
noisiest thing on the page — the opposite of what the design system asks for.

## Scope

In scope:

- `projects/:name` route reading from the existing payload
- A per-project preview image, per-project `og:image`, per-project meta
- Related projects as a section of the detail page
- A minimal header for the detail route

Out of scope (deliberately):

- **Rendering the repository README.** It would add one API call per project view.
- **A full commit list.** Already decided against; the index timeline keeps one commit per project.
- **Comments, issues, contributors, star history.** All need extra calls.
- **Any new dependency, database or second data source.**
- **Changing the index.** Cards, filters, timeline and the language rail stay as they are.

The page must cost **zero additional GitHub requests**: it reads the same cached
`getProjects()` payload the index already loads.

## Information architecture

```
/                     index (unchanged)
/projects/:name       new — the repository name, e.g. /projects/vMaker
```

`projects/:name` matches on `Project.name`, the GitHub repository name, which is already the
anchor id the index links to (`/#vMaker`). Keeping the same identifier means the existing
`#vMaker` links can later be rewritten to `/projects/vMaker` without a redirect table.

The loader calls `getProjects(token)` and finds the project by name. An unknown name throws a
`404` Response, which the root `ErrorBoundary` already renders.

## Layout

Desktop (≥1024px): two columns.

| Column | Width | Contents |
| --- | --- | --- |
| Main | `minmax(0, 1fr)` | Title and badges, summary, preview, language composition, topics |
| Aside | 226px | 4 metric blocks, 2 meta rows, 2 actions |

Below both, separated by a hairline rule: related projects, 3 cards in a row.

Mobile (<1024px), in this order: header, title, summary, actions, preview, metrics (2×2), language
composition, topics, related (single column).

The design system forbids cards nested inside cards, so the page is **not** wrapped in an outer
panel. The layout is columns on the page surface, separated by 0.5px rules. The only bordered
surfaces are the four metric blocks and the three related cards, and they are siblings.

## Sections

### Header

Minimal, not the index header: `vMaker` wordmark, a back link ("返回索引" / "Back to index"), and
the three existing controls (locale, theme, accent).

The index header carries nav, a clock, a mobile menu and an accent dropdown because the index is a
browse surface. A detail page has one job, and the design system asks for "a compact top bar with
identity, navigation and one primary entry point". A back link is that navigation.

Theme, accent and locale all live on `<html>` / `localStorage` already, so the detail route inherits
the current theme with no work. Two identical toggle implementations would drift, so the
persistence logic moves into one `useSitePreferences()` hook used by both routes. This is the only
refactor this design requires, and it is small: it lifts the existing effects out of `home.tsx`
without changing their behaviour.

### Title block

`displayName` at the section-title scale, plus a `featured` badge and, when `archived` is true, an
`archived` badge. Both badges carry a text label — status is never colour-only.

### Summary

`description`, clamped to a comfortable measure (55–70 characters per line per the design system).

### Preview

The design system requires every project card to convey a visual preview, and `overrides.cover`
exists but has never been rendered. Rather than introduce an image pipeline, the preview reuses
GitHub's own social card for the repository:

```
https://opengraph.githubassets.com/1/xmtlzzz/<repo>
```

This is a real 1200×600 PNG that GitHub renders per repository (verified), needs no asset
management, and introduces no second data source. It renders in a fixed `2 / 1` box so there is no
layout shift, with `loading="lazy"`, `decoding="async"` and an alt text naming the project.

The same URL becomes the page's `og:image`, which finally closes the per-project share-image gap
left open by the feed/sitemap work.

If a project later gets a real `cover` in the overrides, that takes precedence over the generated
card.

### Language composition

The index card shows the top 3 languages and a 4-segment bar. The detail page shows **all**
languages: a full-width bar plus a legend listing `name` and `percent` for each entry, so the
meaning never depends on colour alone.

### Meta and actions

Metric blocks: primary language, stars, forks, code size (formatted with the existing
`formatBytes`). Meta rows: last push, created.

Actions: "查看仓库" (repository) and "打开 Demo" (only when `homepage` exists). Two destinations, so
they are explicit labelled links rather than a clickable whole-page hit area, per the design
system's interaction rule.

### Related projects

Up to 3, computed from data already in the payload, by a pure function in `app/lib/projects-view.ts`:

```
score = 2 × sharedTopics
      + 1 if same primaryLanguage
      + 0.5 × sharedLanguagesBeyondPrimary
```

Rules:

- exclude the project itself
- require `score > 0`; if nothing scores, the whole section is omitted rather than showing an
  empty state
- sort by score, then stars, then activity; ties broken deterministically so the output is stable
- each card shows `displayName`, a one-line summary, and `primaryLanguage · N stars`

Because the rule is pure, it is unit-testable without touching the network or the DOM.

## Content and i18n

Every string goes into `app/data/copy.ts` under both `en` and `zh`, matching the existing pattern.
No interface string is hardcoded in a component.

New keys, roughly: `backToIndex`, `repository`, `demo`, `relatedProjects`, `primaryLanguage`,
`lastPush`, `createdAt`, `archived`, `projectNotFound`, plus labels for the metric blocks that do
not already exist (`codeSize`, `stars`, `forks`, `languages` are already there).

## Visual design

Follows `docs/ui-ux-pro-max/design-system.md`:

- section titles 28–40px desktop / 24–30px mobile; card titles 18–22px; body 15–17px; meta 12–14px
- one strong title per page — the project name; nothing inside a card reuses the hero scale
- max content width 1120–1280px, consistent with the index
- borders clear in both themes, secondary text readable rather than decorative grey
- accent colour reserved for links, focus rings and the featured badge
- no gradients, no decorative backgrounds, no emoji as icons (Lucide only)

Two inconsistencies in the existing docs, worth fixing while implementing:

1. `design-system.md` states the font is **Inter Variable**, but the project ships **Figtree** and
   the Inter dependency was removed as unused. The doc should be corrected.
2. The same document requires a visual preview on project cards; the index cards have none. This
   design adds the preview to the detail page only. Whether the index cards should also gain one is
   a separate decision, not part of this change.

## Responsive behaviour

Breakpoints follow the existing stylesheet. Verified at 320, 375, 414, 768, 1024 and 1440px, as the
design system requires. Two columns collapse to one below 1024px; nothing scrolls horizontally at
375px; the preview keeps its 2:1 box at every width.

## Motion

150–300ms on hover and focus only. No entrance animation on the page itself — the detail page is a
destination, not a reveal. No layout shift: the preview box and metric blocks occupy their final
geometry before data paints. `prefers-reduced-motion` is respected.

## Accessibility

- one `<h1>` per page (the project name), sections as `<h2>`
- the preview image has meaningful alt text; the language bar is `aria-hidden` with an accessible
  legend beside it
- all links and controls reachable and visible on focus, with the accent-coloured focus ring
- status (featured, archived) is always stated in text
- the related cards use descriptive link text, never "click here"
- contrast checked for body, secondary and link text in both themes

## SEO

- `meta()`: title and description from the project, canonical to `/projects/<name>`,
  `og:type=article`, the project's `og:image`, and `twitter:card=summary_large_image`
- the sitemap route gains one entry per project with `lastmod` from `pushedAt`, which is the
  deferred half of the distribution work
- the index cards keep their current anchor links; switching them to the new route is a follow-up

## Testing and verification

Existing tooling only — no new test framework:

- unit tests for the related-projects scoring (pure function, no network)
- unit tests for the detail-page meta builder
- SSR verification: fetch `/projects/<name>` and assert the title, badges, language legend, meta
  values and related cards render; fetch an unknown name and assert 404
- a check that the page issues no additional GitHub requests beyond the shared cached payload
- `lint`, `prettier --check`, `build`, `typecheck` and `test` all green before commit

## Risks

| Risk | Mitigation |
| --- | --- |
| GitHub's card endpoint could change or rate-limit | it already backs the site's own `og:image`; the box has a stable aspect ratio and alt text, so a missing image degrades to an empty frame rather than a broken layout |
| The shared-preference hook changes index behaviour | the hook is a lift-and-shift of existing effects; the index is re-verified against its current SSR output |
| Related projects could surface a stale or hidden repository | candidates come from the same filtered payload the index renders, so hidden repositories can never appear |
| The page slows the first paint | no new requests; the preview image is lazy and the layout is fixed before it loads |

## Success criteria

- `/projects/<name>` renders for every visible project and 404s for unknown names
- the page adds no GitHub requests and no new dependency
- the index is byte-for-byte unchanged in behaviour
- related projects appear for projects that share topics or a language, and the section disappears
  when nothing is related
- a link to a project renders a correct preview card on social platforms
- all quality gates pass
