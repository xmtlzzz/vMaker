import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('toggle-demo', 'routes/theme-toggle-demo.tsx'),
  route('projects/:name', 'routes/project.tsx'),
  // resource routes: they only export a loader and return XML directly
  route('feed.xml', 'routes/feed.ts'),
  route('feed', 'routes/feed.ts', { id: 'routes/feed-alias' }),
  route('rss.xml', 'routes/feed.ts', { id: 'routes/rss-xml-alias' }),
  route('rss', 'routes/feed.ts', { id: 'routes/rss-alias' }),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('sitemap', 'routes/sitemap.ts', { id: 'routes/sitemap-alias' }),
] satisfies RouteConfig
