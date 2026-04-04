import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'gradient-bg text-white border-transparent',
        secondary:
          'border-border bg-foreground/5 text-foreground/60',
        accent:
          'bg-accent/10 border-accent/20 text-accent',
        destructive:
          'bg-red-500/10 border-red-500/20 text-red-400',
        outline:
          'border-border text-foreground/55',
        success:
          'bg-green-500/10 border-green-500/20 text-green-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
