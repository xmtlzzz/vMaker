# Homepage Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen branded video hero to the home page while preserving the current GitHub-backed project index and making the transition between them feel continuous.

**Architecture:** Keep the home route as the single integration point but split it into clear hero and index sections inside `home.tsx`. Add root font links and global CSS tokens/animations in `root.tsx` and `app.css`, while preserving existing project data loading and theme persistence.

**Tech Stack:** React Router 7, React 19, Tailwind CSS 4, existing local SVG badges, existing motion-adjacent UI patterns, no new dependencies.

---

### Task 1: Add font and global hero styling support

**Files:**
- Modify: `app/root.tsx`
- Modify: `app/app.css`

- [ ] Add Figtree font links to the root layout head.
- [ ] Add hero-specific CSS variables, keyframes, underline effects, reveal helpers, mobile menu grid animation, and responsive helpers.
- [ ] Preserve existing theme variables and project-index animations.

### Task 2: Rebuild the home route around a hero + index composition

**Files:**
- Modify: `app/routes/home.tsx`

- [ ] Add hero slide metadata, video preload logic, active slide state, mobile menu state, and live clock state.
- [ ] Replace the current top intro with a full-screen hero and adapted `vMaker` copy.
- [ ] Keep the existing GitHub project index below the hero, with search, language navigation, and cards preserved.
- [ ] Create a visual bridge between hero and index so the page scroll feels continuous rather than switching between unrelated sections.

### Task 3: Verify the integrated homepage behavior

**Files:**
- Modify: `app/routes/home.tsx` if fixes are needed
- Modify: `app/app.css` if fixes are needed

- [ ] Run `npm.cmd run typecheck`.
- [ ] Check for regressions in theme persistence, project search, language anchors, and hero CTA targeting `#projects`.
- [ ] Refine spacing, gradients, and section overlap if the hero-to-index transition still feels visually split.
