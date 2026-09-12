import type { Locale } from '~/data/copy'

// Presentation formatters used by both routes and section components. They take the
// active locale so an English visitor never sees a Chinese date or placeholder.
const DATE_LOCALES: Record<Locale, string> = {
  en: 'en-GB',
  zh: 'zh-CN',
}

export const NO_RECORD: Record<Locale, string> = {
  en: 'No record yet',
  zh: '暂无记录',
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 102.4) / 10} KB`
  }

  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`
}

export function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return NO_RECORD[locale]
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return NO_RECORD[locale]
  }

  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
