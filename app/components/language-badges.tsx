import type { ReactElement, SVGProps } from 'react'

export type LanguageIconConfig = {
  accentClassName: string
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement
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

export function languageIconConfig(language: string): LanguageIconConfig {
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
