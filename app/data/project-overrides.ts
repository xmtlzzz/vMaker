export type ProjectOverride = {
  cover?: string
  displayName?: string
  featured?: boolean
  hidden?: boolean
  order?: number
  summary?: string
}

export const projectOverrides: Record<string, ProjectOverride> = {
  vMaker: {
    featured: true,
    order: 1,
    summary: '用于集中展示个人项目的现代化作品集网站。',
  },
}
