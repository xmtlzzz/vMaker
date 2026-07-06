import type { CSSProperties, ReactNode } from 'react'

import { cn } from '~/lib/utils'

type LogoLoopItem = {
  color: string
  icon: ReactNode
  label: string
}

type LogoLoopProps = {
  className?: string
  items: LogoLoopItem[]
}

export function LogoLoop({ className, items }: LogoLoopProps) {
  const loopItems = [...items, ...items]

  return (
    <div className={cn('logo-loop-shell', className)}>
      <div className='logo-loop-track'>
        {loopItems.map((item, index) => (
          <div aria-label={item.label} className='logo-loop-item' key={`${item.label}-${index}`} title={item.label}>
            <span
              className='logo-loop-dot'
              style={{ '--logo-loop-color': item.color } as CSSProperties}
            >
              {item.icon}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
