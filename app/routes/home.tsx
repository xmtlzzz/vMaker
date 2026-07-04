import { ExternalLink, GitBranch, Moon, Search, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'

import BlurText from '~/components/BlurText'
import { BorderGlow } from '~/components/react-bits/BorderGlow'
import { SpotlightCard } from '~/components/react-bits/SpotlightCard'
import { Button } from '~/components/ui/button'
import { formatDate, getProjects } from '~/lib/github/projects'
import type { Project, ProjectPayload } from '~/lib/github/projects'
import type { Route } from './+types/home'

type Locale = 'en' | 'zh'
type Theme = 'light' | 'dark'

type ProjectGroup = {
  id: string
  language: string
  projects: Project[]
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
  return (
    <section className='language-section scroll-mt-24 rounded-[1.25rem]' id={`language-${group.id}`}>
      <div className='mb-4 flex items-end justify-between gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>{group.projects.length} projects</p>
          <BlurText animateBy='letters' className='language-section-title text-2xl font-semibold tracking-tight transition-colors duration-300' delay={24} direction='bottom' text={group.language} />
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
            <p className='text-sm text-muted-foreground'>{project.primaryLanguage ?? 'Repository'}</p>
            <h3 className='mt-2 text-2xl font-semibold tracking-tight'>{project.displayName}</h3>
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

