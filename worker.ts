import { createRequestHandler } from "react-router"
import type { ServerBuild } from "react-router"
import * as build from "./build/server"
import type { ExecutionContext } from "@cloudflare/workers-types"

// Cloudflare Workers 环境变量绑定
// 正式环境的 GITHUB_TOKEN 请在 Cloudflare 面板 Settings → Variables 中配置为 Secret；
// 本地调试用 .dev.vars（见 .dev.vars.example）
interface Env {
  GITHUB_TOKEN?: string
}

const requestHandler = createRequestHandler(
  // build/server 是 react-router build 生成的无类型声明 bundle，这里显式断言
  build as unknown as ServerBuild,
  process.env.NODE_ENV,
)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 把 Cloudflare 的 env / ctx 注入 React Router 的 loadContext，
    // 路由 loader 里即可通过 context.cloudflare.env / context.cloudflare.ctx 访问
    return requestHandler(request, {
      cloudflare: { env, ctx },
    })
  },
}
