type CloudflareContext = {
  cloudflare?: { env?: { GITHUB_TOKEN?: string } }
}

// Cloudflare Workers injects env bindings into the load context; every other
// runtime (local dev, Node, Vercel) lets getProjects fall back to process.env.
export function githubTokenFromContext(context: unknown) {
  return (context as CloudflareContext | undefined)?.cloudflare?.env
    ?.GITHUB_TOKEN
}
