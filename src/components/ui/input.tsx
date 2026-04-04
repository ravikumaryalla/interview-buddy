import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-[var(--radius)] border bg-panel px-3 py-2 text-xs text-foreground placeholder:text-foreground/30',
          'transition-all outline-none',
          'file:border-0 file:bg-transparent file:text-xs file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'focus:border-accent/40 focus:ring-0',
          'border-[hsl(var(--input-border))]',
          className
        )}
        style={{ boxShadow: 'var(--shadow-sm)' }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
