import { resolveSiteUrl } from '~/lib/config'
import { buildRssFeed } from '~/lib/feed'
import {
  githubTokenFromContext,
  siteUrlFromContext,
} from '~/lib/github/context'
import { getProjects, ownerLabel } from '~/lib/github/projects'
import type { Route } from './+types/feed'

export async function loader({ context, request }: Route.LoaderArgs) {
  const { owner, projects } = await getProjects(githubTokenFromContext(context))
  const siteUrl = resolveSiteUrl({
    configured: siteUrlFromContext(context),
    request,
  })

  const body = buildRssFeed({
    description: `Public GitHub work published by ${ownerLabel(owner)}, newest activity first.`,
    feedUrl: `${siteUrl}/feed.xml`,
    projects,
    siteUrl,
    title: 'vMaker — project index',
  })

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=600',
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
