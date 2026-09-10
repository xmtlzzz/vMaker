import { SITE_URL } from '~/lib/config'
import { buildSitemap, projectTimestamp, toDateOnly } from '~/lib/feed'
import { githubTokenFromContext } from '~/lib/github/context'
import { getProjects } from '~/lib/github/projects'
import type { Route } from './+types/sitemap'

export async function loader({ context }: Route.LoaderArgs) {
  const { projects } = await getProjects(githubTokenFromContext(context))

  const lastmod = projects
    .map((project) => projectTimestamp(project))
    .sort()
    .at(-1)

  const body = buildSitemap([
    {
      changefreq: 'daily',
      lastmod: toDateOnly(lastmod),
      loc: `${SITE_URL}/`,
      priority: '1.0',
    },
    ...projects.map((project) => ({
      changefreq: 'weekly',
      lastmod: toDateOnly(projectTimestamp(project)),
      loc: `${SITE_URL}/projects/${project.name}`,
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
