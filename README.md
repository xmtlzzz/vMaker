# vMaker

vMaker 是一个个人项目展示站点，用来把 `xmtlzzz` 的 GitHub 公开仓库整理成一个更适合浏览、筛选和跳转的项目入口。它不是后台系统，也不维护一份独立项目数据库，而是直接以 GitHub 仓库信息作为事实来源，再通过少量本地配置补充展示层信息。

## 设计诉求

- 让访问者快速理解“我做过什么”，而不是先读一堆自我介绍。
- 让项目浏览足够轻，用户可以按语言分组查看，并通过搜索快速定位仓库。
- 让界面保持克制、现代、有技术感，但不做空洞装饰。
- 保持部署简单，优先适配 Vercel 这类以 Git 为中心的托管方式。

## 当前内容与能力

当前版本已经实现的内容：

- 首页项目索引，数据来自 `xmtlzzz` 的 GitHub 公开仓库。
- 按主语言分组展示项目。
- 中英文文案切换。
- 明暗主题切换。
- 项目搜索。
- 通过 `app/data/project-overrides.ts` 对仓库做本地覆盖配置。
  - 可定制展示名。
  - 可设置精选项目。
  - 可调整排序。
  - 可隐藏项目。
  - 可补充摘要和封面。
- 失败兜底与缓存。
  - GitHub API 请求失败时展示错误状态。
  - 服务端使用 10 分钟内存缓存，减少重复请求。

当前实现没有引入：

- 自建数据库
- Neon
- 后台管理页
- 登录系统

## 数据来源

项目直接调用 GitHub API 获取公开仓库信息，当前核心来源包括：

- 仓库基础信息
- 仓库描述
- 仓库主页链接
- 主语言
- Star / Fork
- 最近更新时间与推送时间

可选地通过 `GITHUB_TOKEN` 提升请求额度，避免本地开发或线上访问时触发 GitHub API rate limit。

## 技术栈

- React 19
- React Router 7
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn/ui
- lucide-react
- motion

实现层面特点：

- React Router 默认启用 SSR。
- 只有一个首页路由，数据在服务端 `loader` 中拉取。
- 样式与组件保持轻量，重点在内容索引而不是复杂交互。

## 项目结构

```text
app/
  components/             通用组件与视觉效果组件
  data/
    project-overrides.ts  项目展示覆盖配置
  lib/github/
    projects.ts           GitHub 数据拉取、整形、缓存
  routes/
    home.tsx              首页项目索引
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
GITHUB_TOKEN=your_github_token
```

`GITHUB_TOKEN` 不是强制项，但强烈建议配置，否则开发和线上访问都更容易撞上 GitHub API 频率限制。

### 3. 启动开发环境

```bash
npm run dev
```

默认会启动 React Router 开发服务。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

含义：

- `dev`：本地开发
- `build`：构建生产版本
- `start`：启动生产构建产物
- `typecheck`：生成类型并执行 TypeScript 检查

## 如何部署到 Vercel

### 方案一：连接 Git 仓库自动部署

1. 将项目推送到 GitHub。
2. 在 Vercel 中导入该仓库。
3. Framework Preset 选择 Vite 或保持自动识别。
4. 添加环境变量：

```bash
GITHUB_TOKEN=your_github_token
```

5. 保持默认安装命令：

```bash
npm install
```

6. 构建命令使用：

```bash
npm run build
```

7. 部署完成后，Vercel 会在每次推送后自动重新构建。

### 方案二：本地验证后再推送

部署前建议先本地验证：

```bash
npm run typecheck
npm run build
```

如果这两步通过，再提交并推送到远端仓库，让 Vercel 接管部署。

## 如何自定义项目展示

如果你不想完全照搬 GitHub 原始仓库信息，可以修改 [app/data/project-overrides.ts](/D:/Desktop/code/vibe/vMaker/app/data/project-overrides.ts)：

- `displayName`：自定义展示名
- `summary`：自定义摘要
- `featured`：标记为精选项目
- `hidden`：隐藏项目
- `order`：手动排序
- `cover`：自定义封面

这让 vMaker 保持“GitHub 为事实来源，站点负责展示表达”的结构，不需要额外数据库也能做精细化呈现。

## 部署与使用建议

- 线上务必配置 `GITHUB_TOKEN`。
- 如果项目数量继续增长，可以继续沿用 `project-overrides.ts` 管理展示优先级。
- 如果后续要增加项目详情页、更多统计信息或筛选维度，优先延续当前“GitHub 拉取 + 本地覆盖”的模式，先不要过早引入后台和数据库。
