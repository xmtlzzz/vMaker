import type { Locale } from './copy'

type Showcase = {
  introduction: string
  features: string[]
  previewCaption: string
}
export const projectShowcases: Record<string, Record<Locale, Showcase>> = {
  'vBlog-Core': {
    zh: {
      previewCaption: '博客界面预览，文章为本地演示内容。',
      introduction:
        '把开发经验整理成可阅读、可检索的文章。从 Markdown 写作到发布，再用标签和归档组织长期积累的内容。',
      features: [
        'Markdown 写作、代码高亮与文章目录',
        '按标题搜索，按标签和时间浏览',
        '草稿与发布管理，评论和阅读统计',
      ],
    },
    en: {
      previewCaption:
        'Blog interface preview with local demonstration content.',
      introduction:
        'Turn development notes into readable, searchable articles. Write in Markdown, publish, and organize a growing archive with tags.',
      features: [
        'Markdown, highlighted code, and article navigation',
        'Title search, tags, and chronological archives',
        'Drafts, publishing, comments, and reading statistics',
      ],
    },
  },
  vMaker: {
    zh: {
      previewCaption: '作品索引界面，项目数据来自 GitHub 公开仓库。',
      introduction:
        '给分散在 GitHub 的作品一个共同入口。先看精选项目，再用关键词、语言和最近进展找到想了解的工具。',
      features: [
        '搜索、排序与语言分组',
        '在线体验与仓库直达',
        '中英文、明暗主题与项目详情',
      ],
    },
    en: {
      previewCaption:
        'Project index with data from public GitHub repositories.',
      introduction:
        'A shared home for work published on GitHub. Start with selected projects, then explore tools by keyword, language, and recent activity.',
      features: [
        'Search, sorting, and language groups',
        'Direct links to live demos and source code',
        'Chinese and English, light and dark themes, and project details',
      ],
    },
  },
}
