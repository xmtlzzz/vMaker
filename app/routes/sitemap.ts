import { resolveSiteUrl } from '~/lib/config'
import { buildSitemap, projectTimestamp, toDateOnly } from '~/lib/feed'
import {
  githubTokenFromContext,
  siteUrlFromContext,
} from '~/lib/github/context'
import { getProjects } from '~/lib/github/projects'
import type { Route } from './+types/sitemap'

export async function loader({ context, request }: Route.LoaderArgs) {
  const { projects } = await getProjects(githubTokenFromContext(context))
  const siteUrl = resolveSiteUrl({
    configured: siteUrlFromContext(context),
    request,
  })

  const lastmod = projects
    .map((project) => projectTimestamp(project))
    .sort()
    .at(-1)

  const body = buildSitemap([
    {
      changefreq: 'daily',
      lastmod: toDateOnly(lastmod),
      loc: `${siteUrl}/`,
      priority: '1.0',
    },
    ...projects.map((project) => ({
      changefreq: 'weekly',
      lastmod: toDateOnly(projectTimestamp(project)),
      loc: `${siteUrl}/projects/${project.name}`,
      priority: '0.8',
    })),
  ])

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
