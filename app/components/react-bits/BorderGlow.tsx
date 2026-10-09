import type { MouseEvent, ReactNode } from 'react'
import { useRef } from 'react'

import { cn } from '~/lib/utils'

type BorderGlowProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function BorderGlow({ children, className, id }: BorderGlowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--glow-x', `${x}%`)
    el.style.setProperty('--glow-y', `${y}%`)
  }

  return (
    <div
      className={cn(
        'border-glow group relative rounded-[1.25rem] p-px',
        className
      )}
      id={id}
      onMouseMove={handlePointerMove}
      ref={containerRef}
      style={
        {
          '--glow-x': '50%',
          '--glow-y': '50%',
        } as React.CSSProperties
      }
    >
      <div className="relative z-10 h-full rounded-[calc(1.25rem-1px)] border border-border bg-card">
        {children}
      </div>
    </div>
  )
}
