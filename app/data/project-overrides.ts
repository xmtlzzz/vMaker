export type ProjectOverride = {
  cover?: string
  homepage?: string
  displayName?: string
  featured?: boolean
  hidden?: boolean
  order?: number
  summary?: string
}

export const projectOverrides: Record<string, ProjectOverride> = {
  vMaker: {
    cover: '/previews/vmaker.jpg',
    homepage: 'https://vmaker.xmtlz.dev',
    featured: true,
    order: 1,
    summary: '集中浏览个人开源项目，搜索作品、查看技术栈和最近进展。',
  },
  'vBlog-Core': {
    cover: '/previews/vblog.jpg',
    featured: true,
    order: 2,
    homepage: 'https://vblog.xmtlz.dev',
    summary:
      '用于发布技术文章与开发记录的个人博客，支持 Markdown、标签与全文阅读。',
  },
  'astro-blog-starter-template': {
    summary: '基于 Astro 的现代化博客起步模板与静态站点脚手架。',
  },
  HotStart: {
    summary: '高效开发辅助工具与快速启动热加载脚本。',
  },
  tools_script: {
    summary: '网络路由配置与策略转换等运维开发实用脚本工具集。',
  },
  cmdb: {
    summary: '基于 Go 开发的轻量级资产配置与管理数据库系统。',
  },
  vInvoice: {
    summary: '发票开具与财务流转管理系统，含用户管理与权限控制。',
  },
  vMusic: {
    summary: '轻量级现代在线音乐播放器与音频流媒体应用。',
  },
  'rust-template': {
    summary: 'Rust 现代化工程脚手架与最佳实践起步模板。',
  },
  cloudPulse: {
    summary: '云原生与服务器状态探针，基础健康巡检监控工具。',
  },
  'yuque-exporter': {
    summary: '语雀知识库与文档一键批量导出及本地 Markdown 备份工具。',
  },
  xmtlzzz: {
    summary: '个人 GitHub 特色 Profile 主页展示与配置文件。',
  },
  'Study-Project': {
    summary: '全栈开发技术演练与日常编程学习实践库。',
  },
}
