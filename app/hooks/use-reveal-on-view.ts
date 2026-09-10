import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

export function useRevealOnView<T extends HTMLElement>(threshold = 0.35): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, visible])

  return [ref, visible]
}
