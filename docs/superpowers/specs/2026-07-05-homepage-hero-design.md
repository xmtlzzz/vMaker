# Homepage Hero Design

Date: 2026-07-05

## Goal

Add a full-screen branded hero section to the home page while preserving the existing GitHub project index as the functional core of the page.

The hero should borrow the visual language from the provided portfolio prompt:

- black background
- full-screen video crossfade
- minimal white typography
- strong oversized title
- animated CTA and section reveals
- responsive desktop / tablet / mobile behavior

The home page must still work as a project discovery page for `xmtlzzz` repositories.

## Scope

This change affects the existing home route only.

In scope:

- replace the current top-of-page intro with a full-screen hero
- keep the existing project index section below the hero
- preserve search, language anchor navigation, project cards, and GitHub-backed data loading
- add hero-specific motion, responsive layout, and video switching
- adapt the prompt content to `vMaker` and `xmtlzzz`
- add theme-persistent behavior already implemented and keep it intact

Out of scope:

- creating a new route
- changing the GitHub data model
- removing the project index
- introducing new npm packages
- converting the whole site into a pure portfolio-only landing page

## Recommended Approach

Use a two-layer homepage:

1. Full-screen video hero at the top
2. Existing project index immediately below

This preserves the strongest part of the current page, the index and filtering flow, while allowing the top of the page to become dramatically more polished and brand-led.

## Content Direction

The hero content should be adapted to the current site instead of copying the prompt literally.

### Identity

- Main title: `vMaker.`
- Brand target: personal project gateway for `xmtlzzz`
- CTA: scroll to `#projects`

### Navbar content

Desktop nav labels should be adapted to the current page sections and purpose:

- `01 / Projects`
- `02 / Stack`
- `03 / About`
- `04 / Contact`

Right side should avoid fake email addresses. Use real public identity instead:

- `GitHub / xmtlzzz`
- live clock in the requested `CUP HH:MM:SS` format

### Hero copy

The supporting paragraph should describe the site as a curated entry point to projects, experiments, websites, and creative development work published by `xmtlzzz`.

### Video switcher labels

These should match the site rather than the original art-piece names:

- `01 / PROJECT INDEX`
- `02 / WEB SYSTEMS`
- `03 / CREATIVE DEV`

## Architecture

The current `app/routes/home.tsx` is already large. The hero work should be split into focused components or internal sections to keep the route maintainable.

Recommended structure:

- `Home`
  - loads data and shared state
  - coordinates hero state and project index state
- `HeroNavbar`
  - top navigation
  - mobile menu toggle
  - live clock
- `VideoHero`
  - background videos
  - crossfade state
  - availability indicator
  - title and CTA
- `ProjectIndexSection`
  - existing project index UI extracted from the current route

If file splitting adds unnecessary churn, extraction can start as inner components in `home.tsx`, but the target should be clearer boundaries than the current single-file layout.

## Visual Design

### Hero

- full-screen height
- absolute stacked videos
- black overlay above videos
- white typography
- accent color `#F598F2` on the first slide, white on the others
- large title with strong editorial scale
- bottom-aligned composition

### Existing index section

The project index should remain readable and useful. It may inherit minor visual polish from the hero transition, but must keep:

- clear search affordance
- language jump links
- distinct grouping by language
- legible project cards

The index must not become visually subordinate to the point of hurting navigation.

## Data and State

### Hero video state

Maintain an `activeIndex` for the current hero slide.

Behavior:

- all three videos render at once
- active video uses `opacity-100`
- inactive videos use `opacity-0`
- transitions use opacity crossfade only

### Video preloading

On mount:

- fetch all configured video URLs
- convert successful responses to blob URLs
- fall back to original remote URLs when fetch fails

This should be isolated from project data loading so a video failure cannot break the page.

### Theme persistence

Keep the existing localStorage-backed theme persistence logic.

### Mobile menu state

Use a boolean open/closed state and the requested grid-row expansion pattern for the mobile panel.

## Responsive Behavior

### Desktop

Use the prompt proportions closely:

- full-width hero shell with centered content
- giant title
- split top meta row
- split bottom title + CTA row

### Tablet

Shrink spacing and typography while retaining the same hierarchy.

### Mobile

Hero content stacks vertically:

- nav collapses to menu button
- switcher and availability stack
- title and description stack
- CTA stays obvious and easy to tap

The project index below must remain fully usable on mobile.

## Motion

Add the following motion behaviors:

- video crossfade between slides
- reveal-up for title
- reveal-right for paragraph and CTA
- pulsing availability dot
- hover underline on desktop nav links
- hover slide on switcher items

Animations should trigger once for reveal content using IntersectionObserver.

Reduced-motion users should still get a usable layout with transitions minimized or removed where practical.

## Styling and Globals

### Fonts

Switch the page font foundation from Inter to Figtree for this redesign, loaded through the app's real entry path rather than assuming `public/index.html`.

This should be done in a way compatible with the current React Router setup, most likely through:

- root layout links or head setup
- global CSS font token updates

### Breakpoints and variables

Add:

- custom responsive rules that match the requested mobile and tablet ranges
- `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`

These should live in global CSS and be reusable by the hero.

## Testing and Verification

Minimum verification:

- typecheck passes
- home route renders without runtime errors
- theme persists across refresh
- hero CTA scrolls to project index
- mobile menu opens and closes correctly
- switching hero tabs changes active video and accent behavior
- project search and language anchors still work

If no UI test framework exists, verification can be manual plus `typecheck`.

## Risks

1. The current home route is already large.
   Mitigation: split hero/index concerns clearly during implementation.

2. Remote video preloading may fail or be slow.
   Mitigation: preserve direct URL fallback.

3. A visually dominant hero could reduce clarity of the project index.
   Mitigation: keep `#projects` immediate and obvious, and preserve the current index structure.

4. Font loading changes can affect the whole app.
   Mitigation: update the global font token deliberately and verify overall layout after the change.

## Success Criteria

The redesign is successful if:

- the page opens with a full-screen branded hero matching the provided creative direction
- the hero feels native to `vMaker` rather than copied from a generic template
- the existing project index remains intact and easy to use
- no new dependencies are introduced
- the route remains maintainable after the refactor
