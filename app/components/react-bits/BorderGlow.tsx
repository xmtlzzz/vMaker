import type { MouseEvent, ReactNode } from 'react'
import { useState } from 'react'

import { cn } from '~/lib/utils'

type BorderGlowProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function BorderGlow({ children, className, id }: BorderGlowProps) {
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
      className={cn('border-glow group relative rounded-[1.25rem] p-px', className)}
      id={id}
      onMouseMove={handlePointerMove}
      style={{ '--glow-x': `${position.x}%`, '--glow-y': `${position.y}%` } as React.CSSProperties}
    >
      <div className='relative z-10 h-full rounded-[calc(1.25rem-1px)] border border-border bg-card'>
        {children}
      </div>
    </div>
  )
}
