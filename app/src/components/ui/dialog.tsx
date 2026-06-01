'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as React from 'react'
import { cn } from '@/lib/utils'

/* Re-export root for controlled usage */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogPortal = DialogPrimitive.Portal

/* Backdrop */
export function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-all duration-200',
        'data-ending-style:opacity-0 data-starting-style:opacity-0',
        className
      )}
      data-slot="dialog-backdrop"
      {...props}
    />
  )
}

/* Viewport / centering container */
export function DialogViewport({ className, ...props }: DialogPrimitive.Viewport.Props) {
  return (
    <DialogPrimitive.Viewport
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', className)}
      data-slot="dialog-viewport"
      {...props}
    />
  )
}

/* Main popup content — 克制优雅的精密仪器感 */
export function DialogPopup({ className, children, initialFocus, ...props }: DialogPrimitive.Popup.Props & { initialFocus?: React.RefObject<HTMLElement> }) {
  return (
    <DialogPortal>
      <DialogBackdrop className="bg-black/50 backdrop-blur-[6px]" />
      <DialogViewport>
        <DialogPrimitive.Popup
          className={cn(
            'relative z-50 w-full max-w-[340px] rounded-xl border bg-[#141414] text-foreground shadow-xl',
            'border-border/60 p-6 text-center outline-none',
            'data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-[0.985] data-starting-style:scale-[0.985]',
            'transition-all duration-200 ease-out',
            className
          )}
          data-slot="dialog-popup"
          initialFocus={initialFocus}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  )
}

/* Structured sections - 克制优雅 */
export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-3', className)} data-slot="dialog-header" {...props} />
}

export const DialogTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-[15px] font-medium tracking-[0.3px] text-foreground/90',
          // 对话框标题作为初始焦点时，不要出现明显的 focus ring（符合克制优雅风格）
          'focus:outline-none focus-visible:ring-0',
          className
        )}
        data-slot="dialog-title"
        tabIndex={-1}
        {...props}
      />
    )
  }
)
DialogTitle.displayName = 'DialogTitle'

export function DialogDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm text-muted-foreground/70 mt-1', className)}
      data-slot="dialog-description"
      {...props}
    />
  )
}

export function DialogPanel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('my-1', className)} data-slot="dialog-panel" {...props} />
}

export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-5 flex gap-2 justify-center', className)}
      data-slot="dialog-footer"
      {...props}
    />
  )
}
