export type ProjectOverride = {
  cover?: string
  homepage?: string
  displayName?: string
  featured?: boolean
  hidden?: boolean
  order?: number
  summary?: string
  primaryLanguage?: string
  topics?: string[]
  stars?: number
  languages?: Record<string, number>
  releaseCount?: number
  latestReleaseTag?: string
}

export const projectOverrides: Record<string, ProjectOverride> = {
  vMaker: {
    cover: '/previews/vmaker.jpg',
    homepage: 'https://vmaker.xmtlz.dev',
    featured: true,
    order: 1,
    summary: '集中浏览个人开源项目，搜索作品、查看技术栈和最近进展。',
    primaryLanguage: 'TypeScript',
    topics: ['react', 'remix', 'react-router', 'tailwind', 'portfolio'],
    stars: 1,
    languages: { TypeScript: 85000, CSS: 25000, HTML: 2000 },
    latestReleaseTag: 'v1.0.0',
    releaseCount: 1,
  },
  'vBlog-Core': {
    cover: '/previews/vblog.jpg',
    featured: true,
    order: 2,
    homepage: 'https://vblog.xmtlz.dev',
    summary:
      '用于发布技术文章与开发记录的个人博客，支持 Markdown、标签与全文阅读。',
    primaryLanguage: 'Go',
    topics: ['blog', 'go', 'vue', 'cloudflare', 'sqlite', 'd1'],
    stars: 1,
    languages: { Go: 95000, Vue: 65000, TypeScript: 20000, CSS: 15000 },
    latestReleaseTag: 'v1.2.0',
    releaseCount: 1,
  },
  'astro-blog-starter-template': {
    summary: '基于 Astro 的现代化博客起步模板与静态站点脚手架。',
    primaryLanguage: 'TypeScript',
    topics: ['astro', 'template', 'starter'],
    stars: 1,
    languages: { Astro: 45000, TypeScript: 30000, CSS: 15000 },
    latestReleaseTag: 'v1.0.0',
    releaseCount: 1,
  },
  HotStart: {
    summary: '高效开发辅助工具与快速启动热加载脚本。',
    primaryLanguage: 'Shell',
    topics: ['shell', 'scripts', 'devtools'],
    stars: 1,
    languages: { Shell: 25000 },
  },
  tools_script: {
    summary: '网络路由配置与策略转换等运维开发实用脚本工具集。',
    primaryLanguage: 'Python',
    topics: ['python', 'devops', 'automation'],
    stars: 1,
    languages: { Python: 60000, Shell: 10000 },
  },
  cmdb: {
    summary: '基于 Go 开发的轻量级资产配置与管理数据库系统。',
    primaryLanguage: 'Go',
    topics: ['go', 'cmdb', 'asset-management'],
    stars: 1,
    languages: { Go: 75000, SQL: 15000, Shell: 5000 },
  },
  vInvoice: {
    summary: '发票开具与财务流转管理系统，含用户管理与权限控制。',
    primaryLanguage: 'Vue',
    topics: ['vue', 'finance', 'invoice'],
    stars: 1,
    languages: { Vue: 55000, JavaScript: 25000, CSS: 12000 },
  },
  vMusic: {
    summary: '轻量级现代在线音乐播放器与音频流媒体应用。',
    primaryLanguage: 'TypeScript',
    topics: ['music', 'audio-player', 'web-app'],
    stars: 1,
    languages: { TypeScript: 60000, CSS: 20000, HTML: 5000 },
  },
  'rust-template': {
    summary: 'Rust 现代化工程脚手架与最佳实践起步模板。',
    primaryLanguage: 'Rust',
    topics: ['rust', 'template', 'cargo'],
    stars: 1,
    languages: { Rust: 35000, TOML: 2000 },
  },
  cloudPulse: {
    summary: '云原生与服务器状态探针，基础健康巡检监控工具。',
    primaryLanguage: 'Go',
    topics: ['go', 'monitoring', 'cloud-native'],
    stars: 1,
    languages: { Go: 50000, Shell: 8000 },
  },
  'yuque-exporter': {
    summary: '语雀知识库与文档一键批量导出及本地 Markdown 备份工具。',
    primaryLanguage: 'Python',
    topics: ['python', 'exporter', 'backup', 'markdown'],
    stars: 1,
    languages: { Python: 40000, Markdown: 5000 },
  },
  xmtlzzz: {
    summary: '个人 GitHub 特色 Profile 主页展示与配置文件。',
    primaryLanguage: 'Markdown',
    topics: ['github-profile'],
    stars: 1,
    languages: { Markdown: 15000 },
  },
  'Study-Project': {
    summary: '全栈开发技术演练与日常编程学习实践库。',
    primaryLanguage: 'JavaScript',
    topics: ['learning', 'experiments'],
    stars: 1,
    languages: { JavaScript: 40000, HTML: 15000, CSS: 10000 },
  },
}
