import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  /** Render as another element (e.g. <Link>). Simple cloneElement implementation. */
  render?: React.ReactElement
  loading?: boolean
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(loading || disabledProp)

  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

  const variants: Record<string, string> = {
    default: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
    destructive:
      'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90',
    outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80',
    ghost: 'border-transparent hover:bg-accent hover:text-accent-foreground',
    link: 'border-transparent underline-offset-4 hover:underline text-primary',
  }

  const sizes: Record<string, string> = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-6',
    icon: 'h-9 w-9',
    'icon-sm': 'h-8 w-8 rounded-md',
    'icon-lg': 'h-10 w-10 rounded-md',
  }

  const variantClasses = variants[variant] || variants.default
  const sizeClasses = sizes[size] || sizes.default

  const finalClassName = cn(base, variantClasses, sizeClasses, className)

  const content = (
    <>
      {children}
      {loading && (
        <span
          aria-hidden
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          data-slot="button-loading-indicator"
        />
      )}
    </>
  )

  // Simple render prop support via cloneElement (good enough for Link usage)
  if (render) {
    return React.cloneElement(render, {
      ...props,
      className: cn(finalClassName, (render.props as any)?.className),
      'data-slot': 'button',
      'data-loading': loading ? '' : undefined,
      children: content,
      // Don't forward disabled to Link-like elements
    } as any)
  }

  return (
    <button
      type="button"
      className={finalClassName}
      disabled={isDisabled}
      data-slot="button"
      data-loading={loading ? '' : undefined}
      {...props}
    >
      {content}
    </button>
  )
}
