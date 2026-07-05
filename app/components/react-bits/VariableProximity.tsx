import type { CSSProperties } from 'react'
import { useMemo, useRef, useState } from 'react'

import { cn } from '~/lib/utils'

type VariableProximityProps = {
  className?: string
  labelClassName?: string
  text: string
}

export function VariableProximity({ className, labelClassName, text }: VariableProximityProps) {
  const [progress, setProgress] = useState(0)
  const [pointerX, setPointerX] = useState<number | null>(null)
  const containerRef = useRef<HTMLSpanElement | null>(null)
  const characters = useMemo(() => text.split(''), [text])

  function handlePointerMove(event: React.MouseEvent<HTMLSpanElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setPointerX(event.clientX)
    setProgress(Math.min(Math.max(ratio, 0), 1))
  }

  function handlePointerLeave() {
    setPointerX(null)
    setProgress(0.5)
  }

  return (
    <span
      className={cn('variable-proximity inline-flex', className)}
      onMouseLeave={handlePointerLeave}
      onMouseMove={handlePointerMove}
      ref={containerRef}
    >
      {characters.map((character, index) => {
        const anchor = characters.length === 1 ? 0.5 : index / (characters.length - 1)
        const influence = pointerX === null ? 0 : Math.max(0, 1 - Math.abs(progress - anchor) * 3.2)
        const style = {
          '--vp-scale': `${1 + influence * 0.26}`,
          '--vp-shift': `${influence * -14}px`,
          '--vp-opacity': `${0.76 + influence * 0.24}`,
          fontVariationSettings: `"wght" ${500 + influence * 100}`,
        } as CSSProperties

        return (
          <span className={cn('variable-proximity-char', labelClassName)} key={`${character}-${index}`} style={style}>
            {character === ' ' ? '\u00A0' : character}
          </span>
        )
      })}
    </span>
  )
}
