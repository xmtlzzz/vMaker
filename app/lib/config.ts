export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'vmaker-theme'
export const ACCENT_STORAGE_KEY = 'vmaker-accent'
export const LOCALE_STORAGE_KEY = 'vmaker-locale'
export const SITE_URL = 'https://vmaker.xmtlz.dev'

// GitHub renders a 1200x600 social card for every public repository, so reusing
// it keeps og:image at zero maintenance cost and needs no second data source.
// Swap this for a hand-made 1200x630 asset if the branding ever demands it.
export const SITE_OG_IMAGE =
  'https://opengraph.githubassets.com/1/xmtlzzz/vMaker'
