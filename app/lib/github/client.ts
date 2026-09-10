const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

export const GITHUB_USER = 'xmtlzzz'

// 优先使用调用方注入的 token（Cloudflare 从 env binding 传入），
// 本地 / Node 环境（Vercel、react-router-serve）回退到 process.env。
// 占位符会被忽略，等同于未配置。
export function resolveGithubToken(token?: string) {
  const resolved = token?.trim() || process.env.GITHUB_TOKEN?.trim()

  if (!resolved || resolved === 'your_github_token') {
    return undefined
  }

  return resolved
}

export function githubHeaders(token?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    // GitHub API 强制要求 User-Agent，否则返回 403 "Request forbidden by administrative rules"。
    // Cloudflare Workers 的 fetch 不会自动附加该头（Node/undici 会自动加），所以必须显式声明。
    'User-Agent': 'vMaker (https://vmaker.xmtlz.dev)',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const resolved = resolveGithubToken(token)
  if (resolved) {
    headers.Authorization = `Bearer ${resolved}`
  }

  return headers
}

// 把 GitHub 返回的原始原因也带出来（如 "API rate limit exceeded for ..."、
// "Bad credentials"），避免只看到 403/401 而无法判断是限流还是 token 未生效。
async function describeFailure(response: Response) {
  let reason = ''

  try {
    const body = await response.text()
    if (body) {
      try {
        reason =
          (JSON.parse(body) as { message?: string }).message ??
          body.slice(0, 200)
      } catch {
        reason = body.slice(0, 200)
      }
    }
  } catch {
    // 读取响应体失败则忽略，只保留状态码
  }

  return `GitHub API request failed: ${response.status} ${response.statusText}${reason ? ` — ${reason}` : ''}`
}

export async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(token),
  })

  if (!response.ok) {
    throw new Error(await describeFailure(response))
  }

  return response.json() as Promise<T>
}

type GraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

// The GraphQL endpoint answers with HTTP 200 even when the query failed, so the
// `errors` array has to be inspected explicitly — otherwise a broken query would
// look like an empty index.
export async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL, {
    body: JSON.stringify({ query, variables }),
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await describeFailure(response))
  }

  const payload = (await response.json()) as GraphqlResponse<T>

  if (payload.errors?.length) {
    const reason = payload.errors
      .map((error) => error.message ?? 'unknown error')
      .join('; ')

    throw new Error(`GitHub GraphQL error — ${reason}`)
  }

  if (!payload.data) {
    throw new Error('GitHub GraphQL response contained no data')
  }

  return payload.data
}
