# vMaker

[![CI](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml/badge.svg)](https://github.com/xmtlzzz/vMaker/actions/workflows/ci.yml)

[English](./README.md) · **简体中文**

> 一个基于 React Router 7（SSR）的入口站，把 `xmtlzzz` 的 GitHub 公开作品整理成一个可检索、按语言分组的项目索引。

## 解决什么问题

公开作品散布在多个仓库里，而 GitHub 个人主页和朴素的仓库列表都不适合拿来浏览：

- 无法按项目名、描述、语言、topics 搜索
- 没有按语言分组，也看不出一个人主要在用什么技术
- 逐仓库的页面遮住了整体视角——总代码体量、语言构成、最近跨仓库动了哪些项目
- 手工维护的作品集会过期：每 push 一次都要改数据库或内容文件，站点与真实情况逐渐脱节

`vMaker` 选择直接读 GitHub，而不是做一份镜像。仓库列表本身就是内容，所以 push 完索引就是最新的；没有第二份数据源，没有后台层，也不需要同步任何重复的项目记录。每个项目还拥有独立的 URL 与社交预览图，因此单件作品可以被单独链接与分享，而不是埋在一张长页里。

## 概览

`vMaker` 从 GitHub 读取仓库数据，叠加少量本地展示元信息，最终渲染为 [vmaker.xmtlz.dev](https://vmaker.xmtlz.dev) 上的可检索项目索引。

它**不是**后台管理端，也**不**维护独立的项目数据库。GitHub 是唯一的数据源。

冷启动时若 GitHub 不可用，站点会退化为一份由本地 overrides 派生的小数据集，而不是渲染成空索引。

## 功能

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
- 每个项目都有 `/projects/<name>` 详情页：完整的语言构成、相关项目，以及可分享的社交预览图；卡片标题即通往详情页的链接

## 技术栈

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
| 部署 | Cloudflare Workers（默认）或任意 Node 宿主 / Vercel |

## 环境要求

- **Node 22+** —— `wrangler` 要求 `>=22`，`vite` 要求 `^20.19 || >=22.12`，CI 固定使用 Node 22。
- npm

## 快速开始

```bash
npm install

# 配置真实的 GitHub token（见「环境变量」）
cp .env.example .env

npm run dev
```

若要用 `wrangler dev`（本地跑 Cloudflare 运行时），改用另一份示例文件：

```bash
cp .dev.vars.example .dev.vars
```

## 命令一览

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | `react-router build` → `build/client` + `build/server` |
| `npm run start` | 用 `react-router-serve` 启动已有构建产物 |
| `npm test` | 通过 `vite-node` 执行单元测试 |
| `npm run typecheck` | `react-router typegen && tsc` |
| `npm run lint` | `eslint .` |
| `npm run format` | `prettier --write` |
| `npm run deploy` | 先构建，再 `wrangler deploy`（Cloudflare） |
| `npm run cf:dev` | 先构建，再 `wrangler dev` |
| `npm run cf:types` | `wrangler types` |

## 质量门禁

`.github/workflows/ci.yml` 在推送到 `main` 和发起 PR 时运行，顺序如下：

```text
npm ci → build → typecheck → test → prettier --check → lint
```

> ⚠️ **必须先 `build` 再 `typecheck`。** `worker.ts` 里有 `import * as build from './build/server'`，而 `build/` 被 gitignore。全新检出时，在构建生成该目录之前 `tsc` 会报 `Cannot find module './build/server'`。本地同理——先 `npm run build` 再 `npm run typecheck`。

测试用裸 `node:assert` 通过 `vite-node` 执行。`test` 脚本显式串联了五个测试文件（依次为 `app/lib/github/projects.test.ts`、`graphql.test.ts`、`rest.test.ts`、`app/lib/projects-view.test.ts`、`app/lib/feed.test.ts`），新增测试文件需要同步修改该脚本。

`rest.test.ts` 用桩替换 `globalThis.fetch`、不触碰网络，因此无论 GitHub 限流状态如何，REST 读取逻辑都有覆盖。

Lint 结果：**0 个 error、3 条 warning**，全部来自 `react-hooks/set-state-in-effect`：共用 hook 在挂载时从 `localStorage` 播种主题 / 强调色 / 语言，`home.tsx` 在首屏幻灯片切换时关闭菜单。

## 环境变量

```bash
GITHUB_TOKEN=your_github_token
```

- `GITHUB_TOKEN` **强烈建议配置**。站点会逐仓库抓取语言构成与最近提交，匿名请求很容易被限流。
- 占位符 `your_github_token` 会被 `githubHeaders()` 忽略，使用它等同于没有 token。
- 没有真实 token 时，匿名额度（每 IP 每小时 60 次）会很快耗尽。在 Cloudflare 上共享出口 IP 几乎立刻触发，GitHub 返回 `403 Forbidden`，站点退化为只包含 `vMaker` 的数据。
- Cloudflare：在 *Settings → Variables & Secrets* 里把 `GITHUB_TOKEN` 配成 Worker secret。
- Node / Vercel：写进 `.env`。

## 目录结构

```text
app/
  app.css                        全局样式、首屏样式、时间线布局、主题与详情页 CSS
  root.tsx                       根布局：字体、<html lang>、hydration 前的主题引导脚本
  routes.ts                      路由表：首页、项目详情页、两个 XML 资源路由
  entry.server.tsx               Web 标准的 SSR 入口（renderToReadableStream），可在 Workers 运行
  routes/
    home.tsx                     首页编排：状态、副作用、首屏与索引的组合
    project.tsx                  项目详情页（/projects/:name）与 404 ErrorBoundary
    feed.ts                      资源路由：/feed.xml（RSS 2.0）
    sitemap.ts                   资源路由：/sitemap.xml（首页 + 每个项目）
  components/
    layout/site-header.tsx       顶部导航、语言 / 主题 / 强调色控件、移动端菜单
    sections/
      project-panel.tsx          项目卡片：统计、语言构成、topics、链接
      project-language-section.tsx  单个语言分组及其卡片
      project-metric.tsx         总览栏的指标卡片
      project-empty.tsx          空状态 / 数据不可用状态
      project-detail-aside.tsx   详情页侧栏：指标、元信息行、操作
      related-projects.tsx       详情页的相关项目区块
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
    use-site-preferences.ts      语言 / 主题 / 强调色的持久化，所有路由共用
  lib/
    config.ts                    storage key、站点 URL、社交分享图、Theme 类型
    feed.ts                      RSS 与 sitemap 构建器、XML / 日期工具（纯函数）
    feed.test.ts                 上述构建器的单元测试
    language.ts                  语言命名、id、导航标签、颜色
    projects-view.ts             分组、提交时间线与相关项目打分（纯函数）
    github/types.ts              共享类型：GitHubRepo、RepoDetails、Project、RepoIndex
    github/client.ts             token 解析与 REST / GraphQL 传输层
    github/graphql.ts            一次性 ProjectIndex 查询及其纯映射函数
    github/projects.ts           REST 读取、缓存、payload 组装、格式化
    github/context.ts            从 Cloudflare load context 中取出 GITHUB_TOKEN
    github/projects.test.ts      payload 构建的单元测试
    github/graphql.test.ts       GraphQL 映射与查询结构的单元测试
    github/rest.test.ts          REST 读取的单元测试（桩 fetch）
    projects-view.test.ts        相关项目打分的单元测试
    utils.ts                     cn() class 合并工具
public/
  hero-*.svg                     首屏插画
  robots.txt                     静态爬虫文件（指向 sitemap）
docs/                            设计参考（见「设计文档」）
worker.ts                        Cloudflare Workers 入口（createRequestHandler + cloudflare 上下文）
wrangler.toml                    Workers 配置、自定义域名、静态资源绑定
```

## 路由

| 路由 | 类型 | 用途 |
| --- | --- | --- |
| `/` | 页面 | 首屏 + 项目索引 |
| `/projects/:name` | 页面 | 项目详情页 |
| `/feed.xml` | 资源 | RSS 2.0 订阅源 |
| `/sitemap.xml` | 资源 | 动态生成的 sitemap |

详情页用 GitHub 仓库名匹配，与索引卡片锚点使用的是同一个标识，因此 `#vMaker` 与 `/projects/vMaker` 指向同一个项目。

从详情页返回索引时会带上该项目的锚点，因此索引会停在对应项目卡片处，而不是页面顶部。

## 数据模型

GitHub 是仓库元信息、主要语言、topics、star / fork、时间戳和最近提交的唯一数据源。

抓取行为 —— 两个读取器产出同一份 payload：

- **GraphQL**（有 token 时优先）：一条 `ProjectIndex` 查询在**单次请求**内拿到仓库列表、语言构成、topics 以及每个仓库最近 5 条提交。GraphQL API 必须认证，所以无 token 时完全不会尝试。
- **REST**（无 token 时的路径，也是 GraphQL 失败后的降级路径）：先 `/users/xmtlzzz/repos?sort=pushed&per_page=100`，再对每个仓库请求 `/languages` 与 `/commits?per_page=5`，并发上限 **5**。
- 无论走哪个读取器，结果都会归一化成 `app/lib/github/*` 里的 `GitHubRepo` + `RepoDetails`，因此 `buildProjectPayload` 仍是唯一负责塑形的纯函数。
- GraphQL 失败会**打日志而不是被吞掉**（`[vMaker] GitHub GraphQL read failed, falling back to REST — …`）。两个读取器都只读一页、最多 **100 个仓库**，超出部分会跳过并打印告警。
- 模块级**内存缓存，TTL 10 分钟**，用于吸收重复访问。
- fork 一律排除；在 overrides 中标记 `hidden` 的仓库也排除。
- 任何 GitHub 失败都会退化为由 overrides 派生的数据；若已存在缓存，则复用旧缓存。

详情页读取的是同一份缓存 payload，因此**不产生任何额外请求**。

排序优先级：`featured` → `overrides.order` → `pushedAt` / `updatedAt`（新的在前）。

每个项目派生出的字段：`codeSize`（语言字节总和）、`languageShares`（百分比，驱动构成条），以及 payload 级别的 `summary`（含总数、`primaryLanguages`、`latestActivity`）。

相关项目按共享 topics（权重 2）、相同主要语言（1）、共享的次要语言（每项 0.5）打分，最多 3 个；无任何关联时整块隐藏。

本地 overrides 位于 `app/data/project-overrides.ts`：

| 字段 | 作用 |
| --- | --- |
| `displayName` | 卡片与详情页标题 |
| `summary` | 描述；GitHub 无描述时作为兜底 |
| `featured` | 置顶并显示精选徽标 |
| `hidden` | 完全排除该仓库 |
| `order` | 非精选组内的手动排序 |
| `cover` | 详情页预览图；未设置时复用 GitHub 的仓库分享卡 |

若 GitHub 无描述且 overrides 也没有 `summary`，卡片会回退到一句占位文案。

## 主题、强调色与语言

- 主题类（`dark`、`theme-dark`、`theme-light`）挂在 **`<html>`** 上，不在路由外壳上。外壳只保留 `theme-shell` / `home-canvas`，因为主题规则是用后代选择器写的。
- `app/root.tsx` 在 `<head>` 里输出一段内联脚本，**在 hydration 之前**读取 `localStorage` 并设置主题类与 `<html lang>`，从而消除暗色用户看到的亮色闪烁。它总是应用一个主题类，读取存储失败时回退到亮色。`<html>` 因此带了 `suppressHydrationWarning`。
- hydration 之后，由路由负责让 `<html>` 的 class、`<html lang>` 与 `localStorage` 保持同步。
- localStorage 的 key：`vmaker-theme`、`vmaker-accent`、`vmaker-locale`（定义在 `app/lib/config.ts`）。
- 默认语言是 `zh`；文案集中在 `app/data/copy.ts`，组件里不硬编码界面字符串。
- 强调色以 `--vmaker-accent` / `--vmaker-accent-rgb` 自定义属性应用在页面外壳上。`app/app.css` 的 `:root` 提供了默认值，因此引用该变量的声明在 hydration 前也是有效的。

## SEO

由路由的 `meta()` 输出：

- `title`、`description`
- `link rel="canonical"`
- `og:type`、`og:site_name`、`og:title`、`og:description`、`og:url`、`og:locale`、`og:locale:alternate`
- `og:image`、`og:image:width`、`og:image:height`、`og:image:alt`
- `twitter:card`（`summary_large_image`）、`twitter:title`、`twitter:description`、`twitter:image`
- `link rel="alternate" type="application/rss+xml"`，指向 `/feed.xml`

爬虫端点：

- `public/robots.txt` —— 静态文件，指向 sitemap
- `/sitemap.xml` —— 依实时数据生成：首页一条 + 每个项目一条，`lastmod` 取该项目的 `pushedAt`（`Cache-Control: public, max-age=600`）
- `/feed.xml` —— 项目 RSS 2.0 订阅源，按最近活跃排序

社交分享图**不是手绘素材**：GitHub 会为每个公开仓库渲染一张 1200×600 的分享卡，因此首页的 `og:image`（以及每个项目详情页的，经由 `projectOgImage()`）都直接指向 `opengraph.githubassets.com`——零维护成本，也不引入第二数据源。若将来品牌需要，可换成自制的 1200×630 素材。

## 部署

**Cloudflare Workers（默认）**

```bash
npm run deploy        # react-router build && wrangler deploy
```

`wrangler.toml` 定义了 worker、`vmaker.xmtlz.dev` 自定义域名，以及 `./build/client` 静态资源绑定。`worker.ts` 是入口：它用服务端 bundle 构造请求处理器，并把 Cloudflare 的 `env` / `ctx` 传入 React Router 的 load context，因此 loader 可以读到 `context.cloudflare.env.GITHUB_TOKEN`。

**Node 宿主 / Vercel**

1. 把仓库推送到 GitHub
2. 在 Vercel 里导入
3. 在环境变量中配置 `GITHUB_TOKEN`
4. 用 `npm install && npm run build` 构建，再用 `npm run start` 启动

token 解析与平台无关：Cloudflare 的 binding 会显式传入，其他环境由 `githubHeaders()` 回退到 `process.env.GITHUB_TOKEN`。

## 设计文档

| 路径 | 内容 |
| --- | --- |
| `docs/ui-ux-pro-max/design-system.md` | 布局、色彩、字体、卡片、动效与可访问性规则 |
| `docs/impeccable/review-rules.md` | 审查定位、视觉质量线，以及布局 / 色彩 / 动效 / 内容检查清单 |
| `docs/karpathy-style/design-principles.md` | 范围与克制准则 |
| `docs/react-bits/usage-rules.md` | 视觉效果组件的使用时机与方式 |
| `docs/superpowers/specs/2026-07-05-homepage-hero-design.md` | 首屏设计 |
| `docs/superpowers/specs/2026-09-10-project-detail-page-design.md` | 项目详情页设计 |
| `docs/base.png` | 最初的线框图 |
