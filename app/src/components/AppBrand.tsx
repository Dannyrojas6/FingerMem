import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type AppBrandProps = {
  className?: string
}

export default function AppBrand({ className }: AppBrandProps) {
  return (
    <Link
      to="/"
      data-testid="app-brand"
      className={cn(
        'group inline-flex items-baseline gap-0.5 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md',
        className
      )}
    >
      <span className="font-display text-[1.35rem] leading-none tracking-[-0.02em] text-foreground">
        Finger
      </span>
      <span className="font-sans text-[1.05rem] font-medium leading-none tracking-tight text-muted-foreground transition-colors group-hover:text-foreground/80">
        Mem
      </span>
    </Link>
  )
}