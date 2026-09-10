import { SITE_URL } from '~/lib/config'
import { buildRssFeed } from '~/lib/feed'
import { githubTokenFromContext } from '~/lib/github/context'
import { getProjects } from '~/lib/github/projects'
import type { Route } from './+types/feed'

export async function loader({ context }: Route.LoaderArgs) {
  const { projects } = await getProjects(githubTokenFromContext(context))

  const body = buildRssFeed({
    description:
      'Public GitHub work published by xmtlzzz, newest activity first.',
    feedUrl: `${SITE_URL}/feed.xml`,
    projects,
    siteUrl: SITE_URL,
    title: 'vMaker — project index',
  })

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=600',
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
