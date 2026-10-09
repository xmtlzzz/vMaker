export type HeroSlide = {
  accent: string
  availability: string
  description: string
  label: string
  imageUrl: string
  imageUrlDay: string
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    accent: '#F598F2',
    availability: 'Available for the next build sprint',
    description:
      'A curated gateway to projects, websites, experiments, and the systems that hold them together.',
    label: 'PROJECT INDEX',
    imageUrl: '/hero-penguin.svg',
    imageUrlDay: '/hero-penguin-day.svg',
  },
  {
    accent: '#FFFFFF',
    availability: 'Shipping websites, tools, and internal systems',
    description:
      'Structured around real repositories from GitHub, with language grouping, fast search, and direct project access.',
    label: 'WEB SYSTEMS',
    imageUrl: '/hero-bird.svg',
    imageUrlDay: '/hero-bird-day.svg',
  },
  {
    accent: '#FFFFFF',
    availability: 'Open to creative dev collaborations',
    description:
      'Made for browsing the full spread of {owner} work without flattening it into a static portfolio screenshot.',
    label: 'CREATIVE DEV',
    imageUrl: '/hero-deer.svg',
    imageUrlDay: '/hero-deer-day.svg',
  },
]
