# vMaker

[![CI](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml/badge.svg)](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml)

**English** · [简体中文](#简体中文)

> A React Router 7 (SSR) gateway that turns the public GitHub work of `xmtlzzz` into a curated, searchable project index.

---

## English

### Overview

`vMaker` reads repository data from GitHub, adds a small amount of local presentation metadata, and renders it as a searchable, language-grouped project index at [vmaker.xmtlz.dev](https://vmaker.xmtlz.dev).

It is **not** an admin panel and it does **not** maintain a separate project database. GitHub stays the source of truth.

If GitHub is unavailable on a cold start, the homepage degrades to a small static payload derived from the local overrides instead of rendering an empty index.

### What it does

- Full-screen hero with layered local SVG artwork (`public/hero-*.svg`), respecting `prefers-reduced-motion`
- Theme toggle (light / dark) that persists and is applied **before first paint**
- Accent color presets with persistence
- ZH / EN copy toggle with persistence
- Project index grouped by primary language
- Per-project stats: stars, forks, code size, and a language composition bar + legend
- Featured projects pinned to the top of the index with a badge
- Search across project name, description, primary language and topics
- Commit timeline in the left overview column
  - one latest commit per project
  - ordered by commit time
  - hover-linked with the project cards
- Language navigation rail with anchor jumps
- Scroll assist: section snap between hero and index, plus a back-to-top button
- Discovery surface: an RSS feed at `/feed.xml` and a generated `/sitemap.xml`

### Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19 |
| Framework | React Router 7 (SSR) |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Components | shadcn-compatible config (`components.json`), lucide-react |
| Font | Figtree (Google Fonts, 400/500/600) |
| Quality | Prettier, ESLint 9 (flat config) |
| Hosting | Cloudflare Workers (default) or any Node host / Vercel |

### Requirements

- **Node 22+** — `wrangler` requires `>=22`, `vite` requires `^20.19 || >=22.12`. CI pins Node 22.
- npm

### Quick start

```bash
npm install

# add a real GitHub token (see Environment variables)
cp .env.example .env

npm run dev
```

For `wrangler dev` (Cloudflare runtime locally) copy the other example file instead:

```bash
cp .dev.vars.example .dev.vars
```

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | `react-router build` → `build/client` + `build/server` |
| `npm run start` | Serve an existing build with `react-router-serve` |
| `npm test` | Run the unit tests via `vite-node` |
| `npm run typecheck` | `react-router typegen && tsc` |
| `npm run lint` | `eslint .` |
| `npm run format` | `prettier --write` |
| `npm run deploy` | Build, then `wrangler deploy` (Cloudflare) |
| `npm run cf:dev` | Build, then `wrangler dev` |
| `npm run cf:types` | `wrangler types` |

There is no `package.json` `engines` field yet; use Node 22+ to match CI.

### Quality gates

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, in this order:

```text
npm ci → build → typecheck → test → prettier --check → lint
```

> ⚠️ **`build` must run before `typecheck`.** `worker.ts` does `import * as build from './build/server'`, and `build/` is gitignored. On a clean checkout `tsc` fails with `Cannot find module './build/server'` until a build has produced that directory. The same applies locally — run `npm run build` before `npm run typecheck`.

Testing is intentionally minimal: plain `node:assert` executed through `vite-node`. The `test` script chains the test files explicitly (`app/lib/github/projects.test.ts` then `app/lib/feed.test.ts`), so adding a new file means updating that script.

Lint currently reports **0 errors and 3 warnings**. The warnings come from `react-hooks/set-state-in-effect` in `app/routes/home.tsx` (see Known limitations).

### Environment variables

```bash
GITHUB_TOKEN=your_github_token
```

- `GITHUB_TOKEN` is **strongly recommended**. The homepage fetches languages and recent commits per repository, so an unauthenticated client is easy to rate-limit.
- The placeholder string `your_github_token` is deliberately ignored by `githubHeaders()`. Using it is identical to having no token.
- Without a real token, the unauthenticated limit (60 requests/hour per IP) is hit quickly. On Cloudflare the shared egress IP hits it almost immediately, GitHub returns `403 Forbidden`, and the homepage falls back to a payload containing only `vMaker`.
- Cloudflare: add `GITHUB_TOKEN` as a Worker secret under *Settings → Variables & Secrets*.
- Node / Vercel: put it in `.env`.

### Project structure

```text
app/
  app.css                        Global styles, hero styling, timeline layout, theme + language-section CSS
  root.tsx                       Root layout: fonts, <html lang>, and the pre-hydration theme bootstrap script
  routes.ts                      Route table: the index plus the two XML resource routes
  entry.server.tsx               Web-standard SSR entry (renderToReadableStream) so it runs on Workers
  routes/
    home.tsx                     Homepage orchestration: state, effects, hero + index composition
    feed.ts                      Resource route: /feed.xml (RSS 2.0)
    sitemap.ts                   Resource route: /sitemap.xml
  components/
    layout/site-header.tsx       Top navigation, locale / theme / accent controls, mobile menu
    sections/
      project-panel.tsx          Project card: stats, language composition, topics, links
      project-language-section.tsx  One language group + its cards
      project-metric.tsx         Overview-column metric card
      project-empty.tsx          Empty / unavailable state
    language-badges.tsx          Per-language SVG badges + accent class mapping
    react-bits/                  Visual effects (BorderGlow, LogoLoop, VariableProximity)
    ui/                          Base UI primitives (shadcn-style)
  data/
    copy.ts                      All ZH / EN interface copy (Locale = 'en' | 'zh')
    accents.ts                   Accent presets
    hero-slides.ts               Hero slide content
    stack-logos.tsx              Stack logo loop items
    project-overrides.ts         Local repository presentation overrides
  hooks/
    use-reveal-on-view.ts        IntersectionObserver reveal helper
  lib/
    config.ts                    Storage keys, site URL, social image, Theme type
    feed.ts                      RSS + sitemap builders and XML/date helpers (pure)
    feed.test.ts                 Unit tests for the builders
    language.ts                  Language naming, ids, nav labels, colors
    projects-view.ts             Grouping + commit timeline derivation (pure)
    github/projects.ts           GitHub fetching, cache, payload building, formatting
    github/context.ts            Pulls GITHUB_TOKEN out of the Cloudflare load context
    github/projects.test.ts      Unit tests
    utils.ts                     cn() class merge helper
public/
  hero-*.svg                     Hero artwork
  robots.txt                     Static crawler file (points at the sitemap)
docs/                            Design and review references (see Design documents)
worker.ts                        Cloudflare Workers entry (createRequestHandler + cloudflare context)
wrangler.toml                    Workers config, custom domain, static assets binding
```

### Data model

GitHub is the source of truth for repository metadata, primary language, topics, stars, forks, timestamps and recent commits.

Fetching behaviour:

- Repository list: `/users/xmtlzzz/repos?sort=pushed&per_page=100`
- Per repository: `/languages` and `/commits?per_page=5`
- Detail requests are capped at **5 concurrent** to avoid a request burst on a cold cache fill
- A module-level **in-memory cache with a 10 minute TTL** absorbs repeat loads
- Forks are always excluded; repositories marked `hidden` in the overrides are excluded too
- Any GitHub failure falls back to the overrides-derived payload, and a stale cache entry is reused if one exists

Sorting priority: `featured` → `overrides.order` → `pushedAt` / `updatedAt` (newest first).

Derived per project: `codeSize` (sum of language bytes), `languageShares` (percent, drives the composition bar), and a payload-level `summary` with totals, `primaryLanguages` and `latestActivity`.

Local overrides live in `app/data/project-overrides.ts`:

| Field | Effect |
| --- | --- |
| `displayName` | Card title |
| `summary` | Card description; also the fallback when GitHub has no description |
| `featured` | Pins the project to the top and shows the featured badge |
| `hidden` | Excludes the repository entirely |
| `order` | Manual sort order within the non-featured group |
| `cover` | ⚠️ Carried into `Project.cover` but **not rendered yet** |

If GitHub has no description and there is no override summary, the card falls back to a placeholder sentence.

### Theming, accent and locale

- Theme classes (`dark`, `theme-dark`, `theme-light`) live on **`<html>`**, not on the route shell. The route shell keeps only `theme-shell` / `home-canvas`, because CSS scopes theme rules by descendant selectors.
- `app/root.tsx` emits a small inline script in `<head>` that reads `localStorage` **before hydration** and sets the theme class and `<html lang>`. This removes the light-theme flash a dark-theme visitor would otherwise see. It always applies a theme class, falling back to light if storage access throws. `<html>` carries `suppressHydrationWarning` for this reason.
- After hydration the route keeps the `<html>` classes, `<html lang>` and `localStorage` in sync.
- localStorage keys: `vmaker-theme`, `vmaker-accent`, `vmaker-locale` (defined in `app/lib/config.ts`).
- The default locale is `zh`; the copy lives in `app/data/copy.ts` and no interface strings are hardcoded in components.
- The accent is applied as `--vmaker-accent` / `--vmaker-accent-rgb` custom properties on the page shell. `:root` in `app/app.css` defines a default, so gradient declarations that reference the variable stay valid before hydration.

### SEO

Rendered by the route `meta()`:

- `title`, `description`
- `link rel="canonical"`
- `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:locale`, `og:locale:alternate`
- `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`
- `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`
- `link rel="alternate" type="application/rss+xml"` pointing at `/feed.xml`

Two crawler files are served as routes rather than static assets:

- `public/robots.txt` — static, points at the sitemap
- `/sitemap.xml` — generated by `app/routes/sitemap.ts` from the live payload, `lastmod` taken from the newest project activity (`Cache-Control: public, max-age=600`)
- `/feed.xml` — an RSS 2.0 feed of the projects, newest activity first, generated by `app/routes/feed.ts` and covered by unit tests

The social image is **not a hand-made asset**: GitHub renders a 1200×600 card for every public repository, so `SITE_OG_IMAGE` points at `opengraph.githubassets.com`. That keeps `og:image` at zero maintenance cost and needs no second data source. Swap it for a custom 1200×630 asset if the branding ever demands one — the same endpoint gives every project its own card, ready for the per-project pages.

> `public/sitemap.xml` was deleted on purpose: a static file would shadow the route.

### Deployment

**Cloudflare Workers (default)**

```bash
npm run deploy        # react-router build && wrangler deploy
```

`wrangler.toml` defines the worker, the `vmaker.xmtlz.dev` custom domain, and a `./build/client` static assets binding. `worker.ts` is the entry: it builds a request handler from the server bundle and passes Cloudflare's `env` / `ctx` into React Router's load context, so loaders read `context.cloudflare.env.GITHUB_TOKEN`.

**Node host / Vercel**

1. Push the repository to GitHub
2. Import it into Vercel
3. Set `GITHUB_TOKEN` in the environment
4. Build with `npm install && npm run build`; serve with `npm run start`

Token resolution is platform-agnostic: the Cloudflare binding is passed in explicitly, and `githubHeaders()` falls back to `process.env.GITHUB_TOKEN` otherwise.

### Known limitations and roadmap

- **`overrides.cover` is not rendered** — the field is plumbed through the data layer but no component uses it.
- **The commit timeline shows only the newest commit per project**, while the design system document calls for 3–5.
- **The sitemap lists only the homepage.** Per-project URLs, and a per-project `og:image`, both land with the detail page.
- **3 ESLint warnings** from `react-hooks/set-state-in-effect`: `home.tsx` seeds theme / accent / locale from `localStorage` on mount, and closes menus when the hero slide changes. A lazy initializer would hydrate differently from the server, so these need a store or derived-state refactor before they can become errors.
- **Only one HTML route exists.** There is no project detail page and no admin panel, although the original wireframe (`docs/base.png`) sketched both, along with nested ("prefix") routes.
- **The 10 minute cache is per instance**, so it only partially mitigates GitHub rate limits on a distributed runtime.

### Design documents

| Path | Contents |
| --- | --- |
| `docs/ui-ux-pro-max/design-system.md` | Layout, colour, typography, card, motion and accessibility rules |
| `docs/impeccable/review-rules.md` | Review positioning, visual quality bar, layout/colour/motion/content checklists |
| `docs/karpathy-style/design-principles.md` | Scope and restraint guidelines |
| `docs/react-bits/usage-rules.md` | When and how to use the visual-effect components |
| `docs/superpowers/specs/2026-07-05-homepage-hero-design.md` | Homepage hero design spec |
| `docs/superpowers/plans/2026-07-05-homepage-hero-implementation.md` | Hero implementation plan |
| `docs/base.png` | Original hand-drawn wireframe (project index, admin panel, detail page, admin sub-route) |

---

## 简体中文

[English](#english) · **简体中文**

> 一个基于 React Router 7（SSR）的入口站，把 `xmtlzzz` 的 GitHub 公开作品整理成一个可检索、按语言分组项目索引。

### 概览

`vMaker` 从 GitHub 读取仓库数据，叠加少量本地展示元信息，最终渲染为 [vmaker.xmtlz.dev](https://vmaker.xmtlz.dev) 上的可检索项目索引。

它**不是**后台管理系统，也**不**维护独立的项目数据库——GitHub 始终是唯一数据源。

如果在冷启动时 GitHub 不可用，首页会降级为一份由本地 overrides 派生的静态数据，而不是渲染出一个空索引。

### 功能

- 全屏首屏，背景使用 `public/hero-*.svg` 本地分层插画，并尊重 `prefers-reduced-motion`
- 亮色 / 暗色主题切换，可持久化，且**在首次绘制前就已生效**
- 强调色预设切换，可持久化
- 中 / 英界面文案切换，可持久化
- 项目索引按主要语言分组
- 每个项目展示 star 数、fork 数、代码体量，以及语言构成占比条 + 图例
- 精选项目置顶并显示徽标
- 支持按项目名、描述、主要语言和 topics 搜索
- 左侧总览栏展示提交时间线
  - 每个项目取最新一条提交
  - 按提交时间排序
  - 与右侧项目卡片 hover 联动
- 语言导航栏，可锚点跳转
- 滚动辅助：首屏与索引之间的分区吸附、返回顶部按钮
- 分发入口：`/feed.xml`（RSS 订阅）与动态生成的 `/sitemap.xml`

### 技术栈

| 类别 | 选型 |
| --- | --- |
| UI | React 19 |
| 框架 | React Router 7（SSR） |
| 语言 | TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 组件 | shadcn 兼容配置（`components.json`）、lucide-react |
| 字体 | Figtree（Google Fonts，400/500/600） |
| 质量 | Prettier、ESLint 9（flat config） |
| 部署 | Cloudflare Workers（默认），或任意 Node 托管 / Vercel |

### 环境要求

- **Node 22+** —— `wrangler` 要求 `>=22`，`vite` 要求 `^20.19 || >=22.12`。CI 固定使用 Node 22。
- npm

### 快速开始

```bash
npm install

# 配置真实的 GitHub token（见「环境变量」）
cp .env.example .env

npm run dev
```

如果要用 `wrangler dev`（本地跑 Cloudflare 运行时），复制另一个示例文件：

```bash
cp .dev.vars.example .dev.vars
```

### 命令一览

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | `react-router build` → 产出 `build/client` 与 `build/server` |
| `npm run start` | 用 `react-router-serve` 运行已有构建产物 |
| `npm test` | 通过 `vite-node` 运行单元测试 |
| `npm run typecheck` | `react-router typegen && tsc` |
| `npm run lint` | `eslint .` |
| `npm run format` | `prettier --write` |
| `npm run deploy` | 构建后 `wrangler deploy`（Cloudflare） |
| `npm run cf:dev` | 构建后 `wrangler dev` |
| `npm run cf:types` | `wrangler types` |

`package.json` 里目前没有 `engines` 字段，请按 CI 使用 Node 22+。

### 质量门禁

`.github/workflows/ci.yml` 在推送到 `main` 和 Pull Request 时触发，顺序如下：

```text
npm ci → build → typecheck → test → prettier --check → lint
```

> ⚠️ **`build` 必须先于 `typecheck`。** `worker.ts` 里有 `import * as build from './build/server'`，而 `build/` 被 gitignore。在干净检出上，`tsc` 会因为找不到 `./build/server` 而报错（`Cannot find module './build/server'`），必须先构建出该目录。本地同理——请先跑 `npm run build` 再跑 `npm run typecheck`。

测试刻意保持轻量：用裸 `node:assert` 通过 `vite-node` 执行。`test` 脚本里显式串联了测试文件（先 `app/lib/github/projects.test.ts`，再 `app/lib/feed.test.ts`），新增测试文件需要同步修改该脚本。

当前 lint 结果是 **0 error、3 warning**，warning 全部来自 `app/routes/home.tsx` 的 `react-hooks/set-state-in-effect`（见「已知限制」）。

### 环境变量

```bash
GITHUB_TOKEN=your_github_token
```

- `GITHUB_TOKEN` **强烈建议配置**。首页会为每个仓库额外抓取语言构成与最近提交，未认证时很容易触发限流。
- 占位符 `your_github_token` 被 `githubHeaders()` 有意忽略，填它等同于没填。
- 没有真实 token 时，未认证额度（每 IP 每小时 60 次）很快耗尽。在 Cloudflare 上共享出口 IP 会几乎立刻触发，GitHub 返回 `403 Forbidden`，首页降级为只显示 `vMaker`。
- Cloudflare：在 *Settings → Variables & Secrets* 里把 `GITHUB_TOKEN` 配为 Worker secret。
- Node / Vercel：写入 `.env`。

### 目录结构

```text
app/
  app.css                        全局样式、首屏样式、时间线布局、主题与语言区块 CSS
  root.tsx                       根布局：字体、<html lang>、hydration 前的主题引导脚本
  routes.ts                      路由表（目前只有首页一条路由）
  entry.server.tsx               Web 标准的 SSR 入口（renderToReadableStream），可在 Workers 运行
  routes/
    home.tsx                     首页编排：状态、副作用、首屏与索引的组合
    feed.ts                      资源路由：/feed.xml（RSS 2.0）
    sitemap.ts                   资源路由：/sitemap.xml
  components/
    layout/site-header.tsx       顶部导航、语言 / 主题 / 强调色控件、移动端菜单
    sections/
      project-panel.tsx          项目卡片：统计、语言构成、topics、链接
      project-language-section.tsx  单个语言分组及其卡片
      project-metric.tsx         总览栏的指标卡片
      project-empty.tsx          空状态 / 数据不可用状态
    language-badges.tsx          各语言 SVG 徽标与强调色 class 映射
    react-bits/                  视觉效果组件（BorderGlow、LogoLoop、VariableProximity）
    ui/                          基础 UI 基元（shadcn 风格）
  data/
    copy.ts                      全部中英文界面文案（Locale = 'en' | 'zh'）
    accents.ts                   强调色预设
    hero-slides.ts               首屏幻灯片内容
    stack-logos.tsx              技术栈 logo 滚动项
    project-overrides.ts         本地仓库展示 overrides
  hooks/
    use-reveal-on-view.ts        基于 IntersectionObserver 的进场显隐 hook
  lib/
    config.ts                    storage key、站点 URL、社交分享图、Theme 类型
    feed.ts                      RSS 与 sitemap 构建器、XML / 日期工具（纯函数）
    feed.test.ts                 上述构建器的单元测试
    language.ts                  语言命名、id、导航标签、颜色
    projects-view.ts             分组与提交时间线派生（纯函数）
    github/projects.ts           GitHub 抓取、缓存、payload 组装、格式化
    github/context.ts            从 Cloudflare load context 中取出 GITHUB_TOKEN
    github/projects.test.ts      单元测试
    utils.ts                     cn() class 合并工具
public/
  hero-*.svg                     首屏插画
  robots.txt                     静态爬虫文件（指向 sitemap）
docs/                            设计与审查参考（见「设计文档」）
worker.ts                        Cloudflare Workers 入口（createRequestHandler + cloudflare 上下文）
wrangler.toml                    Workers 配置、自定义域名、静态资源绑定
```

### 数据模型

GitHub 是仓库元信息、主要语言、topics、star / fork、时间戳和最近提交的唯一数据源。

抓取行为：

- 仓库列表：`/users/xmtlzzz/repos?sort=pushed&per_page=100`
- 每个仓库：`/languages` 与 `/commits?per_page=5`
- 明细请求并发上限为 **5**，避免冷缓存填充时产生请求突发
- 模块级**内存缓存，TTL 10 分钟**，用于吸收重复访问
- fork 一律排除；在 overrides 中标记 `hidden` 的仓库也排除
- 任何 GitHub 失败都会降级到 overrides 派生的 payload；若已有缓存，则复用旧缓存

排序优先级：`featured` → `overrides.order` → `pushedAt` / `updatedAt`（新者优先）。

每个项目派生的字段：`codeSize`（语言字节数总和）、`languageShares`（百分比，驱动占比条）；payload 级还有 `summary`，含总数、`primaryLanguages` 和 `latestActivity`。

本地 overrides 位于 `app/data/project-overrides.ts`：

| 字段 | 作用 |
| --- | --- |
| `displayName` | 卡片标题 |
| `summary` | 卡片描述；同时是 GitHub 无描述时的兜底 |
| `featured` | 置顶并显示精选徽标 |
| `hidden` | 完全排除该仓库 |
| `order` | 非精选组内的手动排序 |
| `cover` | ⚠️ 已传入 `Project.cover` 但**尚未渲染** |

如果 GitHub 没有描述且 overrides 也没有提供 summary，卡片会退回到一句占位文案。

### 主题、强调色与语言

- 主题类（`dark`、`theme-dark`、`theme-light`）挂在 **`<html>`** 上，而不是路由的页面外壳上。页面外壳只保留 `theme-shell` / `home-canvas`，因为 CSS 里的主题规则是按后代选择器作用域的。
- `app/root.tsx` 在 `<head>` 中注入一小段内联脚本，**在 hydration 之前**读取 `localStorage` 并设置主题类与 `<html lang>`。这消除了暗色用户本来会看到的亮色闪烁。脚本总会加一个主题类；若访问 storage 抛错则回落到亮色。`<html>` 因此带上 `suppressHydrationWarning`。
- hydration 之后，由路由负责让 `<html>` 的 class、`<html lang>` 与 `localStorage` 保持同步。
- localStorage 的 key：`vmaker-theme`、`vmaker-accent`、`vmaker-locale`（定义在 `app/lib/config.ts`）。
- 默认语言是 `zh`；文案集中在 `app/data/copy.ts`，组件里不硬编码界面字符串。
- 强调色以 `--vmaker-accent` / `--vmaker-accent-rgb` 自定义属性应用在页面外壳上。`app/app.css` 的 `:root` 提供了默认值，因此引用该变量的渐变声明在 hydration 前也是有效的。

### SEO

由路由的 `meta()` 输出：

- `title`、`description`
- `link rel="canonical"`
- `og:type`、`og:site_name`、`og:title`、`og:description`、`og:url`、`og:locale`、`og:locale:alternate`
- `og:image`、`og:image:width`、`og:image:height`、`og:image:alt`
- `twitter:card`（`summary_large_image`）、`twitter:title`、`twitter:description`、`twitter:image`
- `link rel="alternate" type="application/rss+xml"`，指向 `/feed.xml`

两个爬虫文件都改成了路由而不是静态资源：

- `public/robots.txt` —— 静态文件，指向 sitemap
- `/sitemap.xml` —— 由 `app/routes/sitemap.ts` 依实时数据生成，`lastmod` 取最新项目活跃时间（`Cache-Control: public, max-age=600`）
- `/feed.xml` —— 项目 RSS 2.0 订阅源，按最近活跃排序，构建逻辑由 `app/routes/feed.ts` 调用并配有单元测试

社交分享图**不是手绘素材**：GitHub 会为每个公开仓库渲染一张 1200×600 的分享卡，因此 `SITE_OG_IMAGE` 直接指向 `opengraph.githubassets.com`——零维护成本，也不引入第二数据源。若将来品牌需要，可换成自制的 1200×630 素材；同一个端点也能给每个项目生成自己的分享图，等项目详情页做好即可接上。

> `public/sitemap.xml` 是**故意删掉的**：静态文件会遮蔽同名路由。

### 部署

**Cloudflare Workers（默认）**

```bash
npm run deploy        # react-router build && wrangler deploy
```

`wrangler.toml` 定义了 worker、`vmaker.xmtlz.dev` 自定义域名，以及指向 `./build/client` 的静态资源绑定。`worker.ts` 是入口：它用服务端 bundle 构造请求处理器，并把 Cloudflare 的 `env` / `ctx` 注入 React Router 的 load context，因此 loader 里可以通过 `context.cloudflare.env.GITHUB_TOKEN` 读取 token。

**Node 托管 / Vercel**

1. 把仓库推到 GitHub
2. 在 Vercel 导入该仓库
3. 在环境变量中配置 `GITHUB_TOKEN`
4. 用 `npm install && npm run build` 构建，用 `npm run start` 运行

token 读取是平台无关的：Cloudflare 的 binding 显式传入，其余环境由 `githubHeaders()` 回退到 `process.env.GITHUB_TOKEN`。

### 已知限制与后续计划

- **缺少 `og:image`** —— 社交分享只能退化为文字卡片。
- **`overrides.cover` 未参与渲染** —— 字段已贯通数据层，但没有组件使用它。
- **提交时间线每个项目只显示最新一条提交**，而设计系统文档要求 3–5 条。
- **sitemap 目前只列出首页。** 每项目 URL 与每项目 `og:image` 都随项目详情页一起落地。
- **3 条 ESLint warning**，来自 `react-hooks/set-state-in-effect`：`home.tsx` 在挂载时从 `localStorage` 播种主题 / 强调色 / 语言，并在首屏幻灯片切换时关闭菜单。改成 lazy 初始化会导致 hydration 与服务端不一致，因此需要先做 store 或派生状态重构，才能升为 error。
- **目前只有一条 HTML 路由。** 没有项目详情页，也没有后台管理页——尽管最初的线框图（`docs/base.png`）把两者以及「前缀子路由」都画了出来。
- **10 分钟的缓存是单实例的**，在分布式运行时只能部分缓解 GitHub 限流。

### 设计文档

| 路径 | 内容 |
| --- | --- |
| `docs/ui-ux-pro-max/design-system.md` | 布局、配色、排版、卡片、动效与可访问性规则 |
| `docs/impeccable/review-rules.md` | 审查定位、视觉质量标准，以及布局 / 配色 / 动效 / 内容检查清单 |
| `docs/karpathy-style/design-principles.md` | 范围与克制原则 |
| `docs/react-bits/usage-rules.md` | 视觉效果组件的使用时机与方式 |
| `docs/superpowers/specs/2026-07-05-homepage-hero-design.md` | 首页首屏设计规格 |
| `docs/superpowers/plans/2026-07-05-homepage-hero-implementation.md` | 首屏实现计划 |
| `docs/base.png` | 最初的手绘线框图（项目首页、管理后台、详情页、后台子路由） |
