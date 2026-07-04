import * as React from 'react'

import { cn } from '~/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' && 'border border-border bg-card text-foreground hover:bg-muted',
        variant === 'ghost' && 'text-foreground hover:bg-muted',
        className,
      )}
      {...props}
    />
  )
}
