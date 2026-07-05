import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '~/lib/utils'

type TextCursorProps = {
  children: ReactNode
  className?: string
  text: string
}

export function TextCursor({ children, className, text }: TextCursorProps) {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ x: -9999, y: -9999 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    setPosition({
      x: event.clientX,
      y: event.clientY,
    })
    setVisible(true)
  }

  const badge = (
    <span
      aria-hidden='true'
      className='text-cursor-badge'
      data-visible={visible}
      style={
        {
          '--cursor-x': `${position.x}px`,
          '--cursor-y': `${position.y}px`,
        } as CSSProperties
      }
    >
      {text}
    </span>
  )

  return (
    <div
      className={cn('text-cursor relative', className)}
      onPointerEnter={handlePointerMove}
      onPointerLeave={() => setVisible(false)}
      onPointerMove={handlePointerMove}
    >
      {children}
      {mounted ? createPortal(badge, document.body) : null}
    </div>
  )
}
