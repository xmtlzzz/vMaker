type CloudflareContext = {
  cloudflare?: { env?: Record<string, string | undefined> }
}

// Cloudflare Workers injects env bindings into the load context; every other
// runtime (local dev, Node, Vercel) lets getProjects fall back to process.env.
export function githubTokenFromContext(context: unknown) {
  return (context as CloudflareContext | undefined)?.cloudflare?.env
    ?.GITHUB_TOKEN
}

// The site origin is read from the same binding bag so a deployment can pin its
// canonical address as a plain Worker variable; without one, resolveSiteUrl falls
// back to the host each request arrived on.
export function siteUrlFromContext(context: unknown) {
  const bound = (context as CloudflareContext | undefined)?.cloudflare?.env
    ?.SITE_URL

  // Node / Vercel have no binding bag, so mirror the token's resolution and read
  // process.env there instead.
  return bound?.trim() || process.env.SITE_URL?.trim() || undefined
}
