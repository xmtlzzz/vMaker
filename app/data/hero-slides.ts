export type HeroSlide = {
  accent: string
  availability: string
  description: string
  label: string
  imageUrl: string
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    accent: '#F598F2',
    availability: 'Available for the next build sprint',
    description: 'A curated gateway to projects, websites, experiments, and the systems that hold them together.',
    label: '01 / PROJECT INDEX',
    imageUrl: '/hero-penguin.svg',
  },
  {
    accent: '#FFFFFF',
    availability: 'Shipping websites, tools, and internal systems',
    description: 'Structured around real repositories from GitHub, with language grouping, fast search, and direct project access.',
    label: '02 / WEB SYSTEMS',
    imageUrl: '/hero-bird.svg',
  },
  {
    accent: '#FFFFFF',
    availability: 'Open to creative dev collaborations',
    description: 'Made for browsing the full spread of xmtlzzz work without flattening it into a static portfolio screenshot.',
    label: '03 / CREATIVE DEV',
    imageUrl: '/hero-deer.svg',
  },
]
