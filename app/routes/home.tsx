import { Atom, Boxes, ChevronDown, ExternalLink, Gauge, GitBranch, Menu, Moon, Palette, Search, Server, Sparkles, Sun, Wind, X } from 'lucide-react'
import type { CSSProperties, ReactElement, RefObject, SVGProps } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { BorderGlow } from '~/components/react-bits/BorderGlow'
import { LogoLoop } from '~/components/react-bits/LogoLoop'
import { ShapeBlur } from '~/components/react-bits/ShapeBlur'
import { VariableProximity } from '~/components/react-bits/VariableProximity'
import { Button } from '~/components/ui/button'
import { formatDate, getProjects } from '~/lib/github/projects'
import type { Project, ProjectPayload } from '~/lib/github/projects'
import type { Route } from './+types/home'

type Locale = 'en' | 'zh'
type Theme = 'light' | 'dark'

type AccentPreset = {
  color: string
  id: string
  label: string
  rgb: string
}

type ProjectGroup = {
  id: string
  language: string
  projects: Project[]
}

type LanguageIconConfig = {
  accentClassName: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

type HeroSlide = {
  accent: string
  availability: string
  description: string
  label: string
  videoUrl: string
}

type CommitTimelineItem = {
  date: string
  message: string
  projectId: string
  projectName: string
  sha: string
  url: string
}

const THEME_STORAGE_KEY = 'vmaker-theme'
const ACCENT_STORAGE_KEY = 'vmaker-accent'

const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'pink', label: 'Pink', color: '#F598F2', rgb: '245 152 242' },
  { id: 'cyan', label: 'Cyan', color: '#58D5FF', rgb: '88 213 255' },
  { id: 'lime', label: 'Lime', color: '#A3E635', rgb: '163 230 53' },
  { id: 'amber', label: 'Amber', color: '#FBBF24', rgb: '251 191 36' },
  { id: 'coral', label: 'Coral', color: '#FB7185', rgb: '251 113 133' },
]

const STACK_LOGOS = [
  { label: 'React', color: '#61DAFB', icon: <Atom className='size-4' /> },
  { label: 'TypeScript', color: '#3178C6', icon: <Boxes className='size-4' /> },
  { label: 'Tailwind', color: '#38BDF8', icon: <Wind className='size-4' /> },
  { label: 'Node', color: '#8CC84B', icon: <Server className='size-4' /> },
  { label: 'Rust', color: '#F97316', icon: <Sparkles className='size-4' /> },
  { label: 'Tauri', color: '#24C8DB', icon: <ExternalLink className='size-4' /> },
  { label: 'Vite', color: '#A78BFA', icon: <Gauge className='size-4' /> },
  { label: 'Motion', color: '#F472B6', icon: <GitBranch className='size-4' /> },
]

const HERO_SLIDES: HeroSlide[] = [
  {
    accent: '#F598F2',
    availability: 'Available for the next build sprint',
    description: 'A curated gateway to projects, websites, experiments, and the systems that hold them together.',
    label: '01 / PROJECT INDEX',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_030107_874273ea-684a-4e90-bb96-8fdfde48d53d.mp4',
  },
  {
    accent: '#FFFFFF',
    availability: 'Shipping websites, tools, and internal systems',
    description: 'Structured around real repositories from GitHub, with language grouping, fast search, and direct project access.',
    label: '02 / WEB SYSTEMS',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4',
  },
  {
    accent: '#FFFFFF',
    availability: 'Open to creative dev collaborations',
    description: 'Made for browsing the full spread of xmtlzzz work without flattening it into a static portfolio screenshot.',
    label: '03 / CREATIVE DEV',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260627_094019_4214ea73-b963-46a4-8327-61489192de99.mp4',
  },
]

const copy = {
  en: {
    badge: 'Personal project gateway',
    browse: 'Browse projects',
    dataLeft: 'Source: GitHub public repositories from xmtlzzz',
    dataRight: 'No mirrored database, no admin layer, no duplicated project records',
    empty: 'No matching projects',
    github: 'Open GitHub',
    heroDescription: 'vMaker is a project index for the GitHub work published by xmtlzzz, designed to make browsing repositories, languages, and experiments direct and structured.',
    heroEyebrow: 'Creative development archive',
    heroTitle: 'vMaker.',
    indexLead: 'Scroll from the hero into a live project index without losing context.',
    languageNav: 'Language navigation',
    latest: 'Latest',
    menu: 'Menu',
    projectsUnavailable: 'Projects unavailable',
    repos: 'Repos',
    search: 'Search projects',
    status: 'Index status',
    subtitle: 'The home page stays focused on vMaker itself. Use the top navigation or the project index below to jump into individual xmtlzzz projects.',
    title: 'Jump to a project',
    tokenHelp: 'Add GITHUB_TOKEN in .env or Vercel environment variables, then restart the dev server.',
    top: 'Top',
    tryAnother: 'Try another search term.',
    unavailable: 'GitHub projects could not be loaded',
    updated: 'Updated',
    works: 'Projects',
  },
  zh: {
    badge: '个人项目入口',
    browse: '浏览项目',
    dataLeft: '数据源：xmtlzzz 的 GitHub 公开仓库',
    dataRight: '不做镜像数据库，不加后台层，不复制项目记录',
    empty: '没有匹配的项目',
    github: '打开 GitHub',
    heroDescription: 'vMaker 是一个面向 xmtlzzz GitHub 项目的索引页，用来更直接地浏览仓库、语言分布和不同类型的实验作品。',
    heroEyebrow: '创意开发档案',
    heroTitle: 'vMaker.',
    indexLead: '从首屏自然滑入实时项目索引，而不是切到另一套界面。',
    languageNav: '语言导航',
    latest: '最近活跃',
    menu: '菜单',
    projectsUnavailable: '项目暂不可用',
    repos: '仓库数',
    search: '搜索项目',
    status: '索引状态',
    subtitle: '首页继续聚焦 vMaker 本身。你可以通过顶部导航或下方项目索引，定位到不同的 xmtlzzz 项目。',
    title: '定位到项目',
    tokenHelp: '请在 .env 或 Vercel 环境变量中配置 GITHUB_TOKEN，然后重启服务。',
    top: '返回顶部',
    tryAnother: '换一个搜索词试试。',
    unavailable: 'GitHub 项目加载失败',
    updated: '更新于',
    works: '项目',
  },
} satisfies Record<Locale, Record<string, string>>

function languageName(project: Project) {
  return project.primaryLanguage || 'Other'
}

function TypeScriptBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#3178C6' /><path d='M6.6 7.5h10.8v2.2h-4.1V17h-2.6V9.7H6.6V7.5Zm8.3 6.4h2.4c0 .7.5 1.1 1.4 1.1.8 0 1.3-.3 1.3-.8 0-.5-.4-.7-1.6-1l-.6-.1c-1.8-.4-2.7-1.2-2.7-2.7 0-1.7 1.4-2.9 3.6-2.9 2.1 0 3.4 1.1 3.5 2.8h-2.4c-.1-.7-.4-1-1.2-1-.7 0-1.1.3-1.1.7 0 .4.4.7 1.4.9l.6.1c2 .4 2.9 1.2 2.9 2.8 0 1.8-1.5 3-3.9 3-2.4 0-3.7-1.1-3.8-2.9Z' fill='white' /></svg>
}

function JavaScriptBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#F7DF1E' /><path d='M12.8 16.6 14.6 15.5c.4.8.8 1.4 1.8 1.4.9 0 1.5-.4 1.5-1.8V9.4h2.8V15c0 2.9-1.7 4.2-4.2 4.2-2.2 0-3.4-1.1-4.1-2.6Zm-5.4-.3 1.8-1.1c.3.6.6 1.2 1.4 1.2.7 0 1.2-.3 1.2-1.6V9.4h2.8v5.5c0 2.8-1.6 4.1-4 4.1-2.1 0-3.2-1.1-3.8-2.7Z' fill='#111827' /></svg>
}

function PythonBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#F8FAFC' /><path d='M7 9.3c0-2.1 1.3-3.3 3.4-3.3h2.1c1.7 0 2.7.8 2.7 2.3 0 1.4-1 2.3-2.7 2.3H10c-.8 0-1.2.4-1.2 1.1v.7H7V9.3Zm4-1.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z' fill='#3776AB' /><path d='M17 14.7c0 2.1-1.3 3.3-3.4 3.3h-2.1c-1.7 0-2.7-.8-2.7-2.3 0-1.4 1-2.3 2.7-2.3H14c.8 0 1.2-.4 1.2-1.1v-.7H17v3.1Zm-4 1.6a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z' fill='#FFD43B' /><path d='M9.1 11.8c-.9.3-1.5 1-1.5 2v.3c-.6-.3-1.2-.9-1.5-1.6.2-1.5 1.3-2.7 3-3v2.3Zm5.8.4c.9-.3 1.5-1 1.5-2v-.3c.6.3 1.2.9 1.5 1.6-.2 1.5-1.3 2.7-3 3v-2.3Z' fill='#1E293B' fillOpacity='.18' /></svg>
}

function GoBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#E0F7FF' /><circle cx='8.8' cy='9' r='2.1' fill='#00ADD8' /><circle cx='15.2' cy='9' r='2.1' fill='#00ADD8' /><path d='M6.3 14.2c0-3.2 2.6-5.7 5.7-5.7s5.7 2.5 5.7 5.7c0 2.8-2.6 4.8-5.7 4.8s-5.7-2-5.7-4.8Z' fill='#00ADD8' /><circle cx='10' cy='13.2' r='1' fill='#0F172A' /><circle cx='14' cy='13.2' r='1' fill='#0F172A' /><ellipse cx='12' cy='15.1' rx='1.2' ry='.9' fill='#F8FAFC' /><path d='M10.6 16.3c.3.4.8.6 1.4.6.6 0 1.1-.2 1.4-.6' stroke='#0F172A' strokeWidth='1' strokeLinecap='round' /><path d='M9.2 11.2c.3-.4.8-.6 1.3-.6m3 0c.5 0 1 .2 1.3.6' stroke='#0F172A' strokeWidth='1' strokeLinecap='round' /></svg>
}

function RustBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#FFF7ED' /><path d='M7.2 13.3c0-2.7 2.2-4.9 4.8-4.9 1.9 0 3.5 1.1 4.3 2.6h.8c.9 0 1.7.8 1.7 1.7s-.8 1.7-1.7 1.7h-.6a4.9 4.9 0 0 1-4.5 3c-2.6 0-4.8-1.9-4.8-4.1Z' fill='#F97316' /><circle cx='10.5' cy='12.2' r='1' fill='#0F172A' /><circle cx='13.8' cy='12.2' r='1' fill='#0F172A' /><path d='M10.8 14.5c.4.3.9.5 1.4.5.6 0 1.1-.2 1.5-.5' stroke='#0F172A' strokeWidth='1' strokeLinecap='round' /><path d='M7 14.7 5.2 16m2.4-.4-1.5 1.8m9-2.7 1.8 1.3m-1.1-.1 1.6 1.7' stroke='#F97316' strokeWidth='1.2' strokeLinecap='round' /><path d='M7.7 10.4 6.1 9m1.1.1L5.8 7.5m10.9 2.9L18.3 9m-1 .1 1.4-1.6' stroke='#F97316' strokeWidth='1.2' strokeLinecap='round' /></svg>
}

function JavaBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#F5F5F5' /><path d='M13.8 17.3c0 1-1.3 1.5-3.9 1.5-2.3 0-3.7-.5-3.7-1.3 0-.5.6-1 1.8-1.3-.4.3-.6.6-.6.9 0 .6 1 .9 2.9.9 2 0 3.1-.3 3.5-.7Zm2.9-1.4c.8.3 1.2.7 1.2 1.2 0 1.1-2.1 1.9-5 1.9-2.4 0-4.3-.5-4.9-1.3.8.5 2.2.8 4.1.8 2.6 0 4.6-.5 4.6-1.4 0-.4-.2-.8-.8-1.2h.8ZM11.8 6c1.1 1.1-1 2.4-1 3.4 0 .6.5 1 .8 1.2-.7-.1-1.9-.8-1.9-1.8 0-1.2 1.8-1.9 2.1-2.8Zm1.6 3.1c1.4 1 0 2-1.1 2.8-1 .7-1.4 1.3-.1 2.1-.7-.1-1.1-.4-1.3-.8-.5-1 .4-1.8 1.1-2.4.7-.6.9-.9 1.4-1.7Zm-1.7 6.8c2.2 0 3.6-.4 3.6-1 0-.6-1.4-1-3.6-1s-3.6.4-3.6 1c0 .6 1.4 1 3.6 1Z' fill='#EA580C' /></svg>
}

function SwiftBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#F05138' /><path d='M17.8 17.2c-.7.4-1.9.7-3 .3-1-.3-1.9-1-2.8-1-1.2 0-1.7 1-3 .9 1-.5 1.6-1.4 1.9-2.3-2-.9-3.8-2.8-5.1-5 1.6 1.5 3.5 2.8 4.7 3.5-1.1-1.2-2.5-3.3-3.2-5 1.5 1.7 3.6 3.8 5.2 4.8-.8-1.1-1.8-2.9-2.2-4.5 1.4 1.9 3.4 4 5.5 5.1.8-1.9.4-3.7-.2-5 .9.8 1.8 2.5 1.8 4.5 0 1.2-.3 2.2-.8 3 .9.7 1.3 1.5 1.2 2.7Z' fill='white' /></svg>
}

function HtmlBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#E34F26' /><path d='m6.1 5.4 1.1 12.8 4.8 1.4 4.8-1.4L17.9 5.4H6.1Zm8.6 3H9.5l.1 1.5h5l-.4 4.7-2.2.6-2.2-.6-.1-1.4h2l.1.6.2.1.2-.1.1-1.3H9.1L8.7 8.4h6Z' fill='white' /></svg>
}

function CssBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#1572B6' /><path d='m6.1 5.4 1.1 12.8 4.8 1.4 4.8-1.4L17.9 5.4H6.1Zm8.1 3-.1 1.5h-4l.1 1.4H14l-.4 4.7-2.2.6-2.2-.6-.1-1.8h2l.1.6.2.1.2-.1.1-1.3H8.6l-.4-5.1h6.1Z' fill='white' /></svg>
}

function ReactBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#0F172A' /><circle cx='12' cy='12' r='1.7' fill='#61DAFB' /><ellipse cx='12' cy='12' rx='7' ry='2.8' stroke='#61DAFB' strokeWidth='1.2' /><ellipse cx='12' cy='12' rx='7' ry='2.8' stroke='#61DAFB' strokeWidth='1.2' transform='rotate(60 12 12)' /><ellipse cx='12' cy='12' rx='7' ry='2.8' stroke='#61DAFB' strokeWidth='1.2' transform='rotate(120 12 12)' /></svg>
}

function VueBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#0F172A' /><path d='M5 6h3.1L12 12.5 15.9 6H19l-7 12L5 6Z' fill='#41B883' /><path d='M8.4 6H11l1 1.7L13 6h2.6L12 12 8.4 6Z' fill='#35495E' /></svg>
}

function SvelteBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#FF3E00' /><path d='M15.2 7.8c0-1.1-1-1.8-2.5-1.8-1.8 0-3 1-3 2.5 0 3 4.1 2 4.1 3.9 0 .7-.6 1.1-1.5 1.1-.9 0-1.5-.4-1.6-1.2H8.4c.1 2 1.7 3.1 4 3.1 2.3 0 3.9-1.2 3.9-3.1 0-3-4.1-2.2-4.1-4 0-.6.5-1 1.3-1 .8 0 1.3.4 1.4 1.1h2.3Z' fill='white' /></svg>
}

function DatabaseBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='#7C3AED' /><ellipse cx='12' cy='8' rx='5.5' ry='2.5' fill='white' /><path d='M6.5 8v3.2C6.5 12.6 9 14 12 14s5.5-1.4 5.5-2.8V8' stroke='white' strokeWidth='1.5' strokeLinecap='round' /><path d='M6.5 12.3v3C6.5 16.7 9 18 12 18s5.5-1.3 5.5-2.7v-3' stroke='white' strokeWidth='1.5' strokeLinecap='round' /></svg>
}

function GenericCodeBadge(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden='true' fill='none' viewBox='0 0 24 24' {...props}><rect width='24' height='24' rx='6' fill='currentColor' fillOpacity='.16' /><path d='m10 8-4 4 4 4M14 8l4 4-4 4' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' /></svg>
}

function languageIconConfig(language: string): LanguageIconConfig {
  const normalized = language.trim().toLowerCase()

  if (['typescript'].includes(normalized)) return { accentClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-600 dark:text-sky-300', icon: TypeScriptBadge }
  if (['javascript', 'jsx'].includes(normalized)) return { accentClassName: 'border-yellow-500/30 bg-yellow-500/12 text-yellow-700 dark:text-yellow-300', icon: JavaScriptBadge }
  if (['python'].includes(normalized)) return { accentClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', icon: PythonBadge }
  if (['go', 'golang'].includes(normalized)) return { accentClassName: 'border-cyan-500/30 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300', icon: GoBadge }
  if (['rust'].includes(normalized)) return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: RustBadge }
  if (['java', 'kotlin'].includes(normalized)) return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: JavaBadge }
  if (['swift'].includes(normalized)) return { accentClassName: 'border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300', icon: SwiftBadge }
  if (['html'].includes(normalized)) return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: HtmlBadge }
  if (['css', 'scss'].includes(normalized)) return { accentClassName: 'border-blue-500/30 bg-blue-500/12 text-blue-700 dark:text-blue-300', icon: CssBadge }
  if (['tsx', 'react'].includes(normalized)) return { accentClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300', icon: ReactBadge }
  if (['vue'].includes(normalized)) return { accentClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', icon: VueBadge }
  if (['svelte'].includes(normalized)) return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: SvelteBadge }
  if (['sql', 'postgresql', 'mysql'].includes(normalized)) return { accentClassName: 'border-violet-500/30 bg-violet-500/12 text-violet-700 dark:text-violet-300', icon: DatabaseBadge }

  return { accentClassName: 'border-border bg-muted text-muted-foreground', icon: GenericCodeBadge }
}

function languageId(language: string) {
  return language.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'other'
}

function languageNavLabel(language: string) {
  const normalized = language.trim().toLowerCase()
  const abbreviations: Record<string, string> = {
    javascript: 'JS',
    typescript: 'TS',
  }

  if (abbreviations[normalized]) return abbreviations[normalized]
  if (language.length <= 6) return language

  return language
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase() || language.slice(0, 3).toUpperCase()
}

function groupProjectsByLanguage(projects: Project[]): ProjectGroup[] {
  const groups = new Map<string, Project[]>()

  for (const project of projects) {
    const language = languageName(project)
    groups.set(language, [...(groups.get(language) ?? []), project])
  }

  return [...groups.entries()]
    .map(([language, groupedProjects]) => ({ id: languageId(language), language, projects: groupedProjects }))
    .sort((a, b) => {
      if (a.language === 'Other') return 1
      if (b.language === 'Other') return -1
      return a.language.localeCompare(b.language)
    })
}

function getLatestCommitTimeline(projects: Project[]): CommitTimelineItem[] {
  return projects
    .map((project) => {
      const latestCommit = project.commits[0]
      if (!latestCommit?.date) return null

      return {
        date: latestCommit.date,
        message: latestCommit.message,
        projectId: project.name,
        projectName: project.displayName,
        sha: latestCommit.sha,
        url: latestCommit.url,
      }
    })
    .filter((item): item is CommitTimelineItem => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function useRevealOnView<T extends HTMLElement>(threshold = 0.35): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, visible])

  return [ref, visible]
}

export function meta() {
  return [
    { title: 'vMaker - Project Index' },
    { name: 'description', content: 'A cinematic project gateway for xmtlzzz GitHub repositories.' },
  ]
}

export async function loader(): Promise<ProjectPayload> {
  return getProjects()
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { error, projects, summary } = loaderData
  const [locale, setLocale] = useState<Locale>('zh')
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<Theme>('light')
  const [accentId, setAccentId] = useState<AccentPreset['id']>(ACCENT_PRESETS[0].id)
  const [activeIndex, setActiveIndex] = useState(0)
  const [clock, setClock] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const timelineContainerRef = useRef<HTMLDivElement | null>(null)
  const timelineItemRefs = useRef(new Map<string, HTMLAnchorElement | null>())
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const projectsSectionRef = useRef<HTMLElement | null>(null)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
  const t = copy[locale]

  const activeSlide = HERO_SLIDES[activeIndex]
  const isDark = theme === 'dark'
  const activeAccent = ACCENT_PRESETS.find((preset) => preset.id === accentId) ?? ACCENT_PRESETS[0]
  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase()
    if (!text) return projects

    return projects.filter((project) => {
      return [project.displayName, project.description, project.primaryLanguage, ...project.topics]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(text)
    })
  }, [projects, query])
  const projectGroups = useMemo(() => groupProjectsByLanguage(filteredProjects), [filteredProjects])
  const languageGroups = useMemo(() => groupProjectsByLanguage(projects), [projects])
  const languageNavGroups = useMemo(
    () => {
      const visibleGroups = languageGroups.filter((group) => group.language !== 'Other')
      const otherGroups = languageGroups.filter((group) => group.language === 'Other')

      return [
        ...visibleGroups.sort((a, b) => b.projects.length - a.projects.length || a.language.localeCompare(b.language)),
        ...otherGroups,
      ]
    },
    [languageGroups],
  )
  const topLanguageGroups = useMemo(() => languageNavGroups.filter((group) => group.language !== 'Other').slice(0, 3), [languageNavGroups])
  const moreLanguageGroups = useMemo(() => {
    const visibleTopIds = new Set(topLanguageGroups.map((group) => group.id))
    return languageNavGroups.filter((group) => !visibleTopIds.has(group.id))
  }, [languageNavGroups, topLanguageGroups])
  const commitTimeline = useMemo(() => getLatestCommitTimeline(projects), [projects])
  const [titleRef, titleVisible] = useRevealOnView<HTMLDivElement>()
  const [copyRef, copyVisible] = useRevealOnView<HTMLDivElement>()
  const [buttonRef, buttonVisible] = useRevealOnView<HTMLDivElement>()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)

    const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY)
    if (ACCENT_PRESETS.some((preset) => preset.id === storedAccent)) {
      setAccentId(storedAccent as AccentPreset['id'])
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accentId)
  }, [accentId])

  useEffect(() => {
    const formatClock = () =>
      `CUP ${new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date())}`

    setClock(formatClock())
    const timer = window.setInterval(() => setClock(formatClock()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsAccentMenuOpen(false)
    setIsMoreMenuOpen(false)
  }, [activeIndex, locale])

  useEffect(() => {
    if (!isMoreMenuOpen || typeof window === 'undefined') return

    const handlePointerDown = (event: PointerEvent) => {
      const menu = moreMenuRef.current
      if (!menu || menu.contains(event.target as Node)) return
      setIsMoreMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: number | null = null

    const handleScroll = () => {
      const heroSection = heroSectionRef.current
      const projectsSection = projectsSectionRef.current
      if (!heroSection || !projectsSection) return

      const projectsTop = projectsSection.offsetTop
      const heroHeight = heroSection.offsetHeight
      const threshold = Math.min(heroHeight * 0.42, 360)
      const currentY = window.scrollY

      setShowBackToTop(currentY > Math.max(heroHeight * 0.4, 280))

      if (timeoutId) window.clearTimeout(timeoutId)

      timeoutId = window.setTimeout(() => {
        if (currentY <= 0 || currentY >= projectsTop + threshold) return

        const snapTarget = currentY < threshold ? 0 : projectsTop
        window.scrollTo({
          top: snapTarget,
          behavior: 'smooth',
        })
      }, 110)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!hoveredProjectId) return

    const container = timelineContainerRef.current
    const item = timelineItemRefs.current.get(hoveredProjectId)
    if (!container || !item) return

    const containerTop = container.scrollTop
    const containerBottom = containerTop + container.clientHeight
    const itemTop = item.offsetTop
    const itemBottom = itemTop + item.offsetHeight

    if (itemTop < containerTop || itemBottom > containerBottom) {
      const targetTop = itemTop - container.clientHeight * 0.26
      container.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      })
    }
  }, [hoveredProjectId])

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <main
      className={`${theme === 'dark' ? 'dark theme-dark' : 'theme-light'} theme-shell home-canvas min-h-svh bg-black text-white`}
      style={
        {
          '--vmaker-accent': activeAccent.color,
          '--vmaker-accent-rgb': activeAccent.rgb,
        } as CSSProperties
      }
    >
      <section className='hero-shell relative min-h-svh overflow-hidden bg-black text-white' ref={heroSectionRef}>
        <div className='absolute inset-0 z-0'>
          {HERO_SLIDES.map((slide, index) => (
            <video
              autoPlay
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
              key={HERO_SLIDES[index].label}
              loop
              muted
              playsInline
              preload={index === activeIndex ? 'auto' : 'metadata'}
              src={slide.videoUrl}
            />
          ))}
        </div>
        <div className='absolute inset-0 z-[1] bg-black/10' />
        <div className='hero-scrim absolute inset-0 z-[1]' />

        <HeroNavbar
          accentId={accentId}
          accentPresets={ACCENT_PRESETS}
          clock={clock}
          isAccentMenuOpen={isAccentMenuOpen}
          isMenuOpen={isMenuOpen}
          locale={locale}
          onAccentChange={(nextAccentId) => setAccentId(nextAccentId)}
          onAccentMenuToggle={() => setIsAccentMenuOpen((open) => !open)}
          onMenuToggle={() => setIsMenuOpen((open) => !open)}
          onThemeToggle={handleThemeToggle}
          setLocale={setLocale}
          t={t}
          theme={theme}
        />

        <div className='hero-layout relative z-[2] mx-auto flex min-h-svh w-full max-w-[1340px] flex-col justify-end gap-[116px] px-[15px] pt-[190px]'>
          <div className='hero-top-row flex w-full items-start justify-between gap-10'>
            <div className='flex-[4]'>
              <p className='hero-eyebrow mb-6'>{t.heroEyebrow}</p>
              <div className='flex flex-col gap-3'>
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    className={`hero-switcher role-link text-left text-xs font-medium uppercase tracking-[-0.12px] transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-55 hover:opacity-75'}`}
                    key={slide.label}
                    onClick={() => setActiveIndex(index)}
                    type='button'
                  >
                    {slide.label}
                  </button>
                ))}
              </div>
            </div>
            <div className='flex flex-1 justify-start md:justify-end'>
              <div className='hero-availability'>
                <span
                  className='hero-availability-dot'
                  style={{
                    '--dot-color': activeSlide.accent,
                    '--dot-glow': activeSlide.accent,
                  } as CSSProperties}
                />
                <span>{activeSlide.availability}</span>
              </div>
            </div>
          </div>

          <div className='hero-bottom-row flex w-full items-end justify-between gap-10 pb-[54px]'>
            <div className='flex-[2]' ref={titleRef}>
              <div className={`reveal-block ${titleVisible ? 'is-visible reveal-up' : ''}`}>
                <h1 className='hero-title'>
                  <VariableProximity className='hero-title-word' labelClassName='hero-title-char' text='vMaker' />
                  <span className='hero-title-dot'>.</span>
                </h1>
              </div>
            </div>

            <div className='hero-copy-column flex flex-1 flex-col pl-[50px]'>
              <div className={`reveal-block ${copyVisible ? 'is-visible reveal-right' : ''}`} id='hero-copy' ref={copyRef}>
                <p className='hero-description'>{t.heroDescription}</p>
                <p className='hero-slide-copy'>{activeSlide.description}</p>
              </div>
              <div className={`reveal-block delay-1 ${buttonVisible ? 'is-visible reveal-right' : ''}`} ref={buttonRef}>
                <a className='hero-cta' href='#projects'><span>{t.browse}</span></a>
              </div>
            </div>
          </div>
        </div>

        <div className='hero-bridge relative z-[2] mx-auto flex w-full max-w-[1340px] flex-col gap-5 px-[15px] pb-0'>
          <div className='hero-bridge-meta hero-bridge-meta-standalone' id='stack'>
            <span>{t.indexLead}</span>
            <span>{t.dataLeft}</span>
            <span>{t.dataRight}</span>
          </div>
        </div>
      </section>

      <section className='projects-shell relative pb-16 pt-10' ref={projectsSectionRef}>
        <div className='projects-shell-glow' />
        <div className='relative mx-auto max-w-[1340px] px-[15px]' id='projects'>
          <div className='grid gap-10 lg:grid-cols-[0.92fr_1.08fr]'>
            <div className='projects-intro'>
              <p className='projects-kicker'>{t.languageNav}</p>
              <h2 className='projects-title'>{t.title}</h2>
              <p className='projects-subtitle'>{t.subtitle}</p>
              <div className='projects-side-card'>
                <p className='project-meta-label'>{t.status}</p>
                <div className='mt-5 grid grid-cols-2 gap-3'>
                  <Metric isDark={isDark} label={t.repos} value={summary.totalProjects.toString()} />
                  <Metric isDark={isDark} label={t.latest} value={formatDate(summary.latestActivity)} />
                </div>
                {error && <p className='project-error-note mt-4'>{t.tokenHelp}</p>}
              </div>
              <div className='project-timeline mt-8' ref={timelineContainerRef}>
                {commitTimeline.length > 0 ? (
                  commitTimeline.map((item) => (
                    <a
                      className={`project-timeline-item ${hoveredProjectId === item.projectId ? 'is-active' : ''}`}
                      href={item.url}
                      key={`${item.projectName}-${item.sha}`}
                      onMouseEnter={() => setHoveredProjectId(item.projectId)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      ref={(node) => {
                        timelineItemRefs.current.set(item.projectId, node)
                      }}
                      rel='noreferrer'
                      target='_blank'
                    >
                      <span className='project-timeline-date'>{formatDate(item.date)}</span>
                      <span className='project-timeline-copy'>
                        <span className='project-timeline-title'>{item.projectName}({item.sha})</span>
                        <span className='project-timeline-message'> - {item.message}</span>
                      </span>
                    </a>
                  ))
                ) : (
                  <p className='project-empty-copy'>No commit activity available yet.</p>
                )}
              </div>
              <div className='project-stack-loop-wrap'>
                <LogoLoop items={STACK_LOGOS} />
              </div>
            </div>

            <div>
              <div className='projects-toolbar'>
                <div className='projects-nav-wrap'>
                  <div className='projects-anchor-list'>
                    {topLanguageGroups.length > 0 ? (
                      topLanguageGroups.map((group) => (
                        <a className='projects-anchor-chip' href={`#language-${group.id}`} key={group.language} title={group.language}>
                          {languageNavLabel(group.language)}
                        </a>
                      ))
                    ) : (
                      <span className='projects-anchor-chip opacity-60'>{t.projectsUnavailable}</span>
                    )}
                  </div>
                  <div className='projects-anchor-more' ref={moreMenuRef}>
                    <div className={`projects-anchor-dropdown ${isMoreMenuOpen ? 'is-open' : ''}`}>
                      <button
                        aria-expanded={isMoreMenuOpen}
                        aria-haspopup='menu'
                        className='projects-anchor-chip projects-anchor-summary'
                        onClick={() => setIsMoreMenuOpen((open) => !open)}
                        type='button'
                      >
                        <span>More</span>
                        <ChevronDown className='size-3.5' />
                      </button>
                      {isMoreMenuOpen && <div className='projects-anchor-dropdown-menu' role='menu'>
                        {moreLanguageGroups.length > 0 ? (
                          moreLanguageGroups.map((group) => (
                            <a
                              className='projects-anchor-dropdown-item'
                              href={`#language-${group.id}`}
                              key={group.language}
                              onClick={() => setIsMoreMenuOpen(false)}
                              role='menuitem'
                            >
                              <span>{group.language}</span>
                              <span>{group.projects.length}</span>
                            </a>
                          ))
                        ) : (
                          <span className='projects-anchor-dropdown-empty'>{t.projectsUnavailable}</span>
                        )}
                      </div>}
                    </div>
                  </div>
                </div>
                <label className='projects-search'>
                  <Search className='pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45' />
                  <input onChange={(event) => setQuery(event.target.value)} placeholder={t.search} value={query} />
                </label>
              </div>

              {projectGroups.length > 0 ? (
                <div className='mt-12 space-y-12'>
                  {projectGroups.map((group) => (
                    <ProjectLanguageSection
                      group={group}
                      hoveredProjectId={hoveredProjectId}
                      isDark={isDark}
                      key={group.language}
                      onProjectHover={setHoveredProjectId}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <EmptyProjects error={error} isDark={isDark} t={t} />
              )}
            </div>
          </div>
        </div>
      </section>

      {showBackToTop && (
        <button
          aria-label='Back to top'
          className='back-to-top-button'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          type='button'
        >
          <span>Top</span>
        </button>
      )}
    </main>
  )
}

type HeroNavbarProps = {
  accentId: AccentPreset['id']
  accentPresets: AccentPreset[]
  clock: string
  isAccentMenuOpen: boolean
  isMenuOpen: boolean
  locale: Locale
  onAccentChange: (accentId: AccentPreset['id']) => void
  onAccentMenuToggle: () => void
  onMenuToggle: () => void
  onThemeToggle: () => void
  setLocale: (locale: Locale) => void
  t: Record<string, string>
  theme: Theme
}

function HeroNavbar({
  accentId,
  accentPresets,
  clock,
  isAccentMenuOpen,
  isMenuOpen,
  locale,
  onAccentChange,
  onAccentMenuToggle,
  onMenuToggle,
  onThemeToggle,
  setLocale,
  t,
  theme,
}: HeroNavbarProps) {
  const navItems = [
    { href: '#projects', index: '01', label: t.works },
  ]

  return (
    <header className='absolute left-0 top-0 z-10 w-full'>
      <div className='hero-nav-shell mx-auto max-w-[1340px] px-[15px] py-9'>
        <div className='flex items-center justify-between gap-6'>
          <a className='text-sm font-semibold uppercase tracking-[0.18em] text-white' href='/'>vMaker</a>

          <nav className='hero-desktop-nav flex items-center gap-6'>
            {navItems.map((item) => (
              <a
                className='nav-link-underline group flex items-center gap-2 text-white/88'
                href={item.href}
                key={item.label}
              >
                <span className='text-[8px] font-medium uppercase leading-3 tracking-[-0.08px]'>{item.index}</span>
                <span className='text-xs font-medium uppercase leading-4 tracking-[-0.12px]'>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className='hero-desktop-meta flex items-center gap-3 text-right'>
            <a className='text-xs font-medium uppercase tracking-[-0.12px] text-white/88' href='https://github.com/xmtlzzz' rel='noreferrer' target='_blank'>
              GitHub / xmtlzzz
            </a>
            <span className='text-xs font-medium uppercase tracking-[-0.12px] text-white/58'>{clock}</span>
            <button className='hero-icon-button' onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} type='button'>
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <button aria-label='Toggle theme' className='hero-icon-button' onClick={onThemeToggle} type='button'>
              {theme === 'light' ? <Moon className='size-4' /> : <Sun className='size-4' />}
            </button>
            <div className='hero-accent-picker'>
              <button aria-label='Change accent color' className='hero-icon-button' onClick={onAccentMenuToggle} type='button'>
                <Palette className='size-4' />
              </button>
              <div className={`hero-accent-menu ${isAccentMenuOpen ? 'open' : ''}`}>
                {accentPresets.map((preset) => (
                  <button
                    aria-label={preset.label}
                    className={`hero-accent-swatch ${accentId === preset.id ? 'is-active' : ''}`}
                    key={preset.id}
                    onClick={() => onAccentChange(preset.id)}
                    style={{ '--swatch-color': preset.color } as CSSProperties}
                    type='button'
                  />
                ))}
              </div>
            </div>
          </div>

          <div className='hero-mobile-actions'>
            <button className='hero-icon-button' onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} type='button'>
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <button aria-label='Toggle theme' className='hero-icon-button' onClick={onThemeToggle} type='button'>
              {theme === 'light' ? <Moon className='size-4' /> : <Sun className='size-4' />}
            </button>
            <div className='hero-accent-picker'>
              <button aria-label='Change accent color' className='hero-icon-button' onClick={onAccentMenuToggle} type='button'>
                <Palette className='size-4' />
              </button>
              <div className={`hero-accent-menu ${isAccentMenuOpen ? 'open' : ''}`}>
                {accentPresets.map((preset) => (
                  <button
                    aria-label={preset.label}
                    className={`hero-accent-swatch ${accentId === preset.id ? 'is-active' : ''}`}
                    key={preset.id}
                    onClick={() => onAccentChange(preset.id)}
                    style={{ '--swatch-color': preset.color } as CSSProperties}
                    type='button'
                  />
                ))}
              </div>
            </div>
            <button className='hero-menu-button' onClick={onMenuToggle} type='button'>
              <span>{isMenuOpen ? 'Close' : t.menu}</span>
              {isMenuOpen ? <X className='size-4' /> : <Menu className='size-4' />}
            </button>
          </div>
        </div>

        <div className={`hero-mobile-panel ${isMenuOpen ? 'open' : ''}`}>
          <div className='hero-mobile-panel-inner'>
            <div className='mt-6 flex flex-col gap-5'>
              {navItems.map((item) => (
                <a
                  className='text-[28px] font-medium uppercase leading-8 tracking-[-0.84px] text-white'
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className='mt-8 flex flex-col gap-2 text-sm text-white/58'>
              <span>GitHub / xmtlzzz</span>
              <span>{clock}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Metric({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  return (
    <div className={`project-metric ${isDark ? 'project-metric-dark' : 'project-metric-light'}`}>
      <ShapeBlur
        borderSize={0.05}
        circleEdge={1}
        circleSize={0.22}
        className='project-metric-blur'
        pixelRatioProp={typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1}
        roundness={0.5}
        shapeSize={0.78}
        variation={0}
      />
      <p className='project-metric-label'>{label}</p>
      <p className='project-metric-value'>{value}</p>
    </div>
  )
}

function EmptyProjects({ error, isDark, t }: { error?: string; isDark: boolean; t: Record<string, string> }) {
  return (
    <div className={`project-empty ${isDark ? 'project-empty-dark' : 'project-empty-light'}`}>
      <p className='text-lg font-semibold'>{error ? t.unavailable : t.empty}</p>
      <p className='project-empty-copy'>
        {error ? `${error}. ${t.tokenHelp}` : t.tryAnother}
      </p>
    </div>
  )
}

function ProjectLanguageSection({
  group,
  hoveredProjectId,
  isDark,
  onProjectHover,
  t,
}: {
  group: ProjectGroup
  hoveredProjectId: string | null
  isDark: boolean
  onProjectHover: (projectId: string | null) => void
  t: Record<string, string>
}) {
  const { accentClassName, icon: LanguageIcon } = languageIconConfig(group.language)

  return (
    <section className='language-section scroll-mt-24 rounded-[1.25rem]' id={`language-${group.id}`}>
      <div className='mb-4 flex items-end justify-between gap-4'>
        <div>
          <p className='project-group-count'>{group.projects.length} projects</p>
          <div className='mt-2 flex items-center gap-3'>
            <span className={`inline-flex size-10 items-center justify-center rounded-2xl border ${accentClassName}`}>
              <LanguageIcon className='size-5' />
            </span>
            <h3 className='language-section-title project-group-title'>{group.language}</h3>
          </div>
        </div>
        <a className='project-back-link' href='#projects'>{t.top}</a>
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {group.projects.map((project) => (
          <ProjectPanel
            isActive={hoveredProjectId === project.name}
            isDark={isDark}
            key={project.name}
            onHover={onProjectHover}
            project={project}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

function ProjectPanel({
  isActive,
  isDark,
  onHover,
  project,
  t,
}: {
  isActive: boolean
  isDark: boolean
  onHover: (projectId: string | null) => void
  project: Project
  t: Record<string, string>
}) {
  return (
    <BorderGlow className='scroll-mt-24' id={project.name}>
      <article
        className={`project-panel ${isDark ? 'project-panel-dark' : 'project-panel-light'} ${isActive ? 'project-panel-active' : ''}`}
        onMouseEnter={() => onHover(project.name)}
        onMouseLeave={() => onHover(null)}
      >
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='project-panel-title'>{project.displayName}</h3>
          </div>
          <a aria-label={`Open ${project.displayName}`} className='project-panel-link' href={project.homepage || project.url} rel='noreferrer' target='_blank'><ExternalLink className='size-4' /></a>
        </div>
        <p className='project-panel-description'>{project.description}</p>
        <div className='mt-5 flex flex-wrap gap-2'>
          {project.topics.slice(0, 4).map((topic) => <span className='project-topic' key={topic}>{topic}</span>)}
        </div>
        <div className='mt-6 flex flex-wrap gap-4 text-sm'>
          <a className='project-action' href={project.url} rel='noreferrer' target='_blank'>Repository</a>
          {project.homepage && <a className='project-action' href={project.homepage} rel='noreferrer' target='_blank'>Demo</a>}
          <span className='project-updated'>{t.updated} {formatDate(project.pushedAt ?? project.updatedAt)}</span>
        </div>
      </article>
    </BorderGlow>
  )
}
