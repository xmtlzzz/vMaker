# vMaker

`vMaker` is a React Router based project gateway for the public GitHub work published by `xmtlzzz`.

It is not an admin panel and it does not maintain a separate project database. The site reads repository data from GitHub, adds a small amount of local presentation overrides, and turns that into a searchable, language-grouped index.

If GitHub is unavailable during a cold start, the homepage falls back to a small static project payload derived from local overrides instead of rendering an empty index.

## What It Does

- Full-screen homepage hero with looping video backgrounds
- Theme toggle with persistence across refresh
- Project index grouped by primary language
- Search across project name, description, language, and topics
- Commit timeline in the overview column
  - one latest commit per project
  - ordered by commit time
  - hover linking between timeline items and project cards
- Scroll assist interactions
  - section snap between hero and project index
  - back-to-top button

## Tech Stack

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn/ui
- lucide-react

## Project Structure

```text
app/
  app.css                     Global styles, hero styling, timeline layout, theme behavior
  root.tsx                    Root layout and global font loading
  data/
    project-overrides.ts      Local repository presentation overrides
  lib/
    github/
      projects.ts             GitHub repository, language, and commit fetching
  routes/
    home.tsx                  Homepage hero and project index
```

## GitHub Data Model

The homepage uses GitHub as the source of truth for:

- repository metadata
- primary language
- topics
- stars and forks
- update timestamps
- recent commits

Repository language and commit detail requests are capped with a small concurrency limit to avoid creating a burst of GitHub API requests on cold cache fills.

Local overrides in `app/data/project-overrides.ts` can adjust:

- display name
- summary
- featured state
- visibility
- manual order
- cover image

## Environment Variables

Create a `.env` file in the project root:

```bash
GITHUB_TOKEN=your_github_token
```

`GITHUB_TOKEN` is strongly recommended.

Without it, GitHub API rate limits are much easier to hit, especially now that the homepage also fetches recent commit data per repository.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Useful commands:

```bash
npm run dev
npm test
npm run build
npm run start
npm run typecheck
```

## Homepage Behavior

The homepage is split into two connected layers:

1. A cinematic hero section for brand and navigation
2. A functional project index below it

The transition between these sections is intentionally continuous rather than feeling like two separate pages.

The left overview column contains a commit timeline. The column itself stays in place while the commit list scrolls internally, so the timeline remains useful even when the project list on the right gets long.

## Deployment

Recommended deployment target: Vercel.

Typical setup:

1. Push the repository to GitHub
2. Import the repo into Vercel
3. Set `GITHUB_TOKEN` in the Vercel environment
4. Use:

```bash
npm install
npm run build
```

## Notes

- The homepage relies on remote background videos for the hero section
- Video URLs are preloaded when possible and fall back to direct remote playback if preload fails
- Commit timeline quality depends on GitHub API availability
