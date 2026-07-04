import type { MouseEvent, ReactNode } from 'react'
import { useState } from 'react'

import { cn } from '~/lib/utils'

type SpotlightCardProps = {
  children: ReactNode
  className?: string
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div
      className={cn('spotlight-card relative overflow-hidden rounded-[1.25rem] border border-border bg-card', className)}
      onMouseMove={handlePointerMove}
      style={{ '--spotlight-x': `${position.x}%`, '--spotlight-y': `${position.y}%` } as React.CSSProperties}
    >
      <div className='relative z-10'>{children}</div>
    </div>
  )
}
