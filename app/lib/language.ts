import type { Project } from '~/lib/github/projects'

export function languageName(project: Project) {
  return project.primaryLanguage || 'Other'
}

const LANGUAGE_COLORS: Record<string, string> = {
  c: '#555555',
  'c#': '#178600',
  'c++': '#F34B7D',
  css: '#1572B6',
  go: '#00ADD8',
  html: '#E34F26',
  java: '#EA580C',
  javascript: '#F7DF1E',
  jsx: '#61DAFB',
  kotlin: '#7F52FF',
  php: '#777BB4',
  python: '#3776AB',
  react: '#61DAFB',
  ruby: '#CC342D',
  rust: '#F97316',
  scss: '#CC6699',
  shell: '#89E051',
  sql: '#7C3AED',
  svelte: '#FF3E00',
  swift: '#F05138',
  tsx: '#3178C6',
  typescript: '#3178C6',
  vue: '#41B883',
}

const LANGUAGE_FALLBACK_COLOR = '#94A3B8'

export function languageColor(language: string) {
  return LANGUAGE_COLORS[language.trim().toLowerCase()] ?? LANGUAGE_FALLBACK_COLOR
}

export function languageId(language: string) {
  return language.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'other'
}

export function languageNavLabel(language: string) {
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
