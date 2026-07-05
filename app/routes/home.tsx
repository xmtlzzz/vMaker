import { ExternalLink, GitBranch, Moon, Search, Sun } from 'lucide-react'
import type { ReactElement, SVGProps } from 'react'
import { useEffect, useMemo, useState } from 'react'

import BlurText from '~/components/BlurText'
import { BorderGlow } from '~/components/react-bits/BorderGlow'
import { SpotlightCard } from '~/components/react-bits/SpotlightCard'
import { Button } from '~/components/ui/button'
import { formatDate, getProjects } from '~/lib/github/projects'
import type { Project, ProjectPayload } from '~/lib/github/projects'
import type { Route } from './+types/home'

type Locale = 'en' | 'zh'
type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'vmaker-theme'

type ProjectGroup = {
  id: string
  language: string
  projects: Project[]
}

type LanguageIconConfig = {
  accentClassName: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

const copy = {
  en: {
    badge: 'Personal project gateway',
    browse: 'Browse projects',
    dataLeft: 'Source: GitHub public repositories from xmtlzzz',
    dataRight: 'No Neon, no admin panel, no duplicate project database',
    empty: 'No matching projects',
    github: 'Open GitHub',
    hero: 'vMaker collects the projects I publish on GitHub.',
    languageNav: 'Language navigation',
    latest: 'Latest',
    projectsUnavailable: 'Projects unavailable',
    repos: 'Repos',
    search: 'Search projects',
    status: 'Index status',
    subtitle: 'The home page stays focused on vMaker itself. Use the top navigation or the project index below to jump into individual xmtlzzz projects.',
    title: 'Jump to a project',
    tokenHelp: 'Add GITHUB_TOKEN in .env or Vercel environment variables, then restart the dev server.',
    tryAnother: 'Try another search term.',
    unavailable: 'GitHub projects could not be loaded',
    updated: 'Updated',
  },
  zh: {
    badge: '\u4e2a\u4eba\u9879\u76ee\u5165\u53e3',
    browse: '\u6d4f\u89c8\u9879\u76ee',
    dataLeft: '\u6570\u636e\u6e90\uff1axmtlzzz \u7684 GitHub \u516c\u5f00\u4ed3\u5e93',
    dataRight: '\u4e0d\u4f7f\u7528 Neon\uff0c\u4e0d\u505a\u540e\u53f0\uff0c\u4e0d\u590d\u5236\u9879\u76ee\u6570\u636e\u5e93',
    empty: '\u6ca1\u6709\u5339\u914d\u7684\u9879\u76ee',
    github: '\u6253\u5f00 GitHub',
    hero: 'vMaker \u6536\u96c6\u6211\u53d1\u5e03\u5728 GitHub \u4e0a\u7684\u9879\u76ee\u3002',
    languageNav: '\u8bed\u8a00\u5bfc\u822a',
    latest: '\u6700\u8fd1\u6d3b\u8dc3',
    projectsUnavailable: '\u9879\u76ee\u6682\u4e0d\u53ef\u7528',
    repos: '\u4ed3\u5e93\u6570',
    search: '\u641c\u7d22\u9879\u76ee',
    status: '\u7d22\u5f15\u72b6\u6001',
    subtitle: '\u9996\u9875\u53ea\u805a\u7126 vMaker \u672c\u8eab\u3002\u4f60\u53ef\u4ee5\u901a\u8fc7\u9876\u90e8\u5bfc\u822a\u6216\u4e0b\u65b9\u9879\u76ee\u7d22\u5f15\uff0c\u5b9a\u4f4d\u5230\u4e0d\u540c\u7684 xmtlzzz \u9879\u76ee\u3002',
    title: '\u5b9a\u4f4d\u5230\u9879\u76ee',
    tokenHelp: '\u8bf7\u5728 .env \u6216 Vercel \u73af\u5883\u53d8\u91cf\u4e2d\u914d\u7f6e GITHUB_TOKEN\uff0c\u7136\u540e\u91cd\u542f\u670d\u52a1\u3002',
    tryAnother: '\u6362\u4e00\u4e2a\u641c\u7d22\u8bcd\u8bd5\u8bd5\u3002',
    unavailable: 'GitHub \u9879\u76ee\u52a0\u8f7d\u5931\u8d25',
    updated: '\u66f4\u65b0\u4e8e',
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

  if (['typescript'].includes(normalized)) {
    return { accentClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-600 dark:text-sky-300', icon: TypeScriptBadge }
  }

  if (['javascript', 'jsx'].includes(normalized)) {
    return { accentClassName: 'border-yellow-500/30 bg-yellow-500/12 text-yellow-700 dark:text-yellow-300', icon: JavaScriptBadge }
  }

  if (['python'].includes(normalized)) {
    return { accentClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', icon: PythonBadge }
  }

  if (['go', 'golang'].includes(normalized)) {
    return { accentClassName: 'border-cyan-500/30 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300', icon: GoBadge }
  }

  if (['rust'].includes(normalized)) {
    return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: RustBadge }
  }

  if (['java', 'kotlin'].includes(normalized)) {
    return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: JavaBadge }
  }

  if (['swift'].includes(normalized)) {
    return { accentClassName: 'border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300', icon: SwiftBadge }
  }

  if (['html'].includes(normalized)) {
    return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: HtmlBadge }
  }

  if (['css', 'scss'].includes(normalized)) {
    return { accentClassName: 'border-blue-500/30 bg-blue-500/12 text-blue-700 dark:text-blue-300', icon: CssBadge }
  }

  if (['tsx', 'react'].includes(normalized)) {
    return { accentClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300', icon: ReactBadge }
  }

  if (['vue'].includes(normalized)) {
    return { accentClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', icon: VueBadge }
  }

  if (['svelte'].includes(normalized)) {
    return { accentClassName: 'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300', icon: SvelteBadge }
  }

  if (['sql', 'postgresql', 'mysql'].includes(normalized)) {
    return { accentClassName: 'border-violet-500/30 bg-violet-500/12 text-violet-700 dark:text-violet-300', icon: DatabaseBadge }
  }

  return { accentClassName: 'border-border bg-muted text-muted-foreground', icon: GenericCodeBadge }
}

function languageId(language: string) {
  return language.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'other'
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

export function meta() {
  return [
    { title: 'vMaker - Project Index' },
    { name: 'description', content: 'A personal project index for xmtlzzz GitHub repositories.' },
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
  const t = copy[locale]

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

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

  return (
    <main className={`${theme === 'dark' ? 'dark' : ''} theme-shell min-h-svh bg-background text-foreground`}>
      <Header groups={languageGroups} locale={locale} onThemeToggle={handleThemeToggle} setLocale={setLocale} t={t} theme={theme} />
      <section className='mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1fr_0.75fr] lg:pb-24 lg:pt-20'>
        <div>
          <p className='mb-5 inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground'>{t.badge}</p>
          <BlurText key={locale} animateBy='words' className='max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl' delay={60} direction='bottom' text={t.hero} />
          <p className='mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg'>{t.subtitle}</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <a href='#projects'><Button>{t.browse}</Button></a>
            <a href='https://github.com/xmtlzzz' rel='noreferrer' target='_blank'><Button variant='secondary'>{t.github}</Button></a>
          </div>
        </div>

        <SpotlightCard className='p-5 shadow-sm'>
          <p className='text-sm text-muted-foreground'>{t.status}</p>
          <div className='mt-5 grid grid-cols-2 gap-3'>
            <Metric label={t.repos} value={summary.totalProjects.toString()} />
            <Metric label={t.latest} value={formatDate(summary.latestActivity)} />
          </div>
          {error && <p className='mt-4 rounded-2xl bg-muted p-3 text-sm leading-6 text-muted-foreground'>{t.tokenHelp}</p>}
        </SpotlightCard>
      </section>

      <section className='border-y border-border bg-muted/40'>
        <div className='mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8'>
          <span>{t.dataLeft}</span>
          <span>{t.dataRight}</span>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-5 py-12 sm:px-8' id='projects'>
        <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>{t.languageNav}</p>
            <h2 className='mt-2 text-3xl font-semibold tracking-tight sm:text-4xl'>{t.title}</h2>
          </div>
          <label className='relative block md:w-80'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <input className='h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40' onChange={(event) => setQuery(event.target.value)} placeholder={t.search} value={query} />
          </label>
        </div>

        {projectGroups.length > 0 ? (
          <div className='mt-10 space-y-12'>
            {projectGroups.map((group) => <ProjectLanguageSection group={group} key={group.language} t={t} />)}
          </div>
        ) : (
          <EmptyProjects error={error} t={t} />
        )}
      </section>
    </main>
  )
}

type HeaderProps = {
  groups: ProjectGroup[]
  locale: Locale
  onThemeToggle: () => void
  setLocale: (locale: Locale) => void
  t: Record<string, string>
  theme: Theme
}

function Header({ groups, locale, onThemeToggle, setLocale, t, theme }: HeaderProps) {
  return (
    <header className='sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8'>
        <a className='flex shrink-0 items-center gap-3 font-semibold' href='/'>
          <span className='flex size-9 items-center justify-center rounded-full bg-foreground text-sm text-background'>v</span>
          <span>vMaker</span>
        </a>
        <nav className='flex min-w-0 flex-1 gap-2 overflow-x-auto'>
          {groups.length > 0 ? groups.map((group) => <a className='shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground' href={`#language-${group.id}`} key={group.language}>{group.language}</a>) : <span className='shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground'>{t.projectsUnavailable}</span>}
        </nav>
        <button className='shrink-0 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground' onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} type='button'>
          {locale === 'en' ? '\u4e2d' : 'EN'}
        </button>
        <button aria-label='Toggle theme' className='shrink-0 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground' onClick={onThemeToggle} type='button'>
          {theme === 'light' ? <Moon className='size-4' /> : <Sun className='size-4' />}
        </button>
        <a className='rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground' href='https://github.com/xmtlzzz' rel='noreferrer' target='_blank'><GitBranch className='size-4' /></a>
      </div>
    </header>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className='rounded-2xl border border-border bg-background p-4'><p className='text-sm text-muted-foreground'>{label}</p><p className='mt-2 text-xl font-semibold tracking-tight'>{value}</p></div>
}

function EmptyProjects({ error, t }: { error?: string; t: Record<string, string> }) {
  return (
    <div className='mt-8 rounded-[1.25rem] border border-border bg-card p-8 text-center'>
      <p className='text-lg font-semibold'>{error ? t.unavailable : t.empty}</p>
      <p className='mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
        {error ? `${error}. ${t.tokenHelp}` : t.tryAnother}
      </p>
    </div>
  )
}

function ProjectLanguageSection({ group, t }: { group: ProjectGroup; t: Record<string, string> }) {
  const { accentClassName, icon: LanguageIcon } = languageIconConfig(group.language)

  return (
    <section className='language-section scroll-mt-24 rounded-[1.25rem]' id={`language-${group.id}`}>
      <div className='mb-4 flex items-end justify-between gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>{group.projects.length} projects</p>
          <div className='mt-2 flex items-center gap-3'>
            <span className={`inline-flex size-10 items-center justify-center rounded-2xl border ${accentClassName}`}>
              <LanguageIcon className='size-5' />
            </span>
            <BlurText animateBy='letters' className='language-section-title text-2xl font-semibold tracking-tight transition-colors duration-300' delay={24} direction='bottom' text={group.language} />
          </div>
        </div>
        <a className='text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline' href='#projects'>Top</a>
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {group.projects.map((project) => <ProjectPanel key={project.name} project={project} t={t} />)}
      </div>
    </section>
  )
}

function ProjectPanel({ project, t }: { project: Project; t: Record<string, string> }) {
  return (
    <BorderGlow className='scroll-mt-24' id={project.name}>
      <article className='h-full rounded-[calc(1.25rem-1px)] bg-card p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='text-2xl font-semibold tracking-tight'>{project.displayName}</h3>
          </div>
          <a aria-label={`Open ${project.displayName}`} className='rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground' href={project.homepage || project.url} rel='noreferrer' target='_blank'><ExternalLink className='size-4' /></a>
        </div>
        <p className='mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground'>{project.description}</p>
        <div className='mt-5 flex flex-wrap gap-2'>
          {project.topics.slice(0, 4).map((topic) => <span className='rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground' key={topic}>{topic}</span>)}
        </div>
        <div className='mt-6 flex flex-wrap gap-4 text-sm'>
          <a className='font-medium underline-offset-4 hover:underline' href={project.url} rel='noreferrer' target='_blank'>Repository</a>
          {project.homepage && <a className='font-medium underline-offset-4 hover:underline' href={project.homepage} rel='noreferrer' target='_blank'>Demo</a>}
          <span className='text-muted-foreground'>{t.updated} {formatDate(project.pushedAt ?? project.updatedAt)}</span>
        </div>
      </article>
    </BorderGlow>
  )
}

