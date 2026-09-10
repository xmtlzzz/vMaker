import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  // resource routes: they only export a loader and return XML directly
  route('feed.xml', 'routes/feed.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
] satisfies RouteConfig
