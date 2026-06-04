import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type WheelItem = {
  id: string
  label: string
  /** 主标签下方副文案（如中文释义） */
  sublabel?: string
  /** 行右侧元信息（如「15 句」） */
  trailing?: string
}

export type WheelPickerSize = 'compact' | 'default'

const VISIBLE_COUNT = 7
const SCROLL_SETTLE_MS = 100

type SizeConfig = {
  itemHeight: number
  maxWidth: string
  paddingX: string
  contentGap: string
  tiers: readonly {
    opacity: number
    scale: number
    fontSize: number
    weight: number
  }[]
  sublabelClass: string
  trailingVariant: 'inline' | 'pill'
  minOpacity: number
  sublabelMinOpacity: number
}

const SIZE_CONFIG: Record<WheelPickerSize, SizeConfig> = {
  compact: {
    itemHeight: 96,
    maxWidth: 'max-w-[34rem]',
    paddingX: 'px-6',
    contentGap: 'gap-2.5',
    tiers: [
      { opacity: 1, scale: 1.02, fontSize: 22.5, weight: 500 },
      { opacity: 0.65, scale: 0.97, fontSize: 20.5, weight: 450 },
      { opacity: 0.45, scale: 0.94, fontSize: 18.5, weight: 400 },
      { opacity: 0.28, scale: 0.91, fontSize: 17, weight: 400 },
    ],
    sublabelClass: 'text-xs',
    trailingVariant: 'inline',
    minOpacity: 0.34,
    sublabelMinOpacity: 0.42,
  },
  default: {
    itemHeight: 96,
    maxWidth: 'max-w-3xl',
    paddingX: 'px-8',
    contentGap: 'gap-4',
    tiers: [
      { opacity: 1, scale: 1.03, fontSize: 26, weight: 500 },
      { opacity: 0.55, scale: 0.94, fontSize: 21.5, weight: 450 },
      { opacity: 0.34, scale: 0.87, fontSize: 18.5, weight: 400 },
      { opacity: 0.22, scale: 0.8, fontSize: 16.5, weight: 400 },
    ],
    sublabelClass: 'text-sm',
    trailingVariant: 'pill',
    minOpacity: 0.2,
    sublabelMinOpacity: 0.38,
  },
}

export const WHEEL_ITEM_HEIGHT = SIZE_CONFIG.default.itemHeight
export const WHEEL_VISIBLE_COUNT = VISIBLE_COUNT

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, value))
}

function getVisualTier(distance: number, tiers: SizeConfig['tiers'], minOpacity: number) {
  const d = Math.min(3, distance)
  const tier = tiers[d]
  if (tier) return tier
  const last = tiers[tiers.length - 1]
  return {
    ...last,
    opacity: Math.max(minOpacity, last.opacity),
    scale: 0.88,
    fontSize: last.fontSize - 1,
  }
}

type WheelPickerProps = {
  items: WheelItem[]
  index: number
  onIndexChange: (index: number) => void
  'aria-label': string
  size?: WheelPickerSize
  testId?: string
  itemTestId?: string
  className?: string
  getItemDataAttrs?: (index: number) => Record<string, string | number | undefined>
  onActiveItemClick?: () => void
  /** 列表框 tab 顺序；默认 -1，不参与 Tab 聚焦（仅鼠标/滚轮操作） */
  tabIndex?: number
}

export default function WheelPicker({
  items,
  index,
  onIndexChange,
  'aria-label': ariaLabel,
  size = 'default',
  testId,
  itemTestId,
  className,
  getItemDataAttrs,
  onActiveItemClick,
  tabIndex = -1,
}: WheelPickerProps) {
  const config = SIZE_CONFIG[size]
  const { itemHeight } = config
  const edgePad = ((VISIBLE_COUNT - 1) / 2) * itemHeight

  const scrollRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(index)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingFromPropRef = useRef(false)
  const [scrollOffset, setScrollOffset] = useState(index * itemHeight)

  indexRef.current = index

  const scrollToIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = 'auto') => {
      const el = scrollRef.current
      if (!el) return
      const top = nextIndex * itemHeight
      el.scrollTo({ top, behavior })
      setScrollOffset(top)
    },
    [itemHeight]
  )

  const commitIndex = useCallback(
    (nextIndex: number) => {
      const clamped = clampIndex(nextIndex, items.length)
      scrollToIndex(clamped, 'auto')
      if (clamped !== indexRef.current) {
        onIndexChange(clamped)
      }
    },
    [items.length, onIndexChange, scrollToIndex]
  )

  const settleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const raw = el.scrollTop / itemHeight
    const next = clampIndex(Math.round(raw), items.length)
    commitIndex(next)
  }, [commitIndex, itemHeight, items.length])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    syncingFromPropRef.current = true
    const top = index * itemHeight
    el.scrollTop = top
    setScrollOffset(top)
    requestAnimationFrame(() => {
      syncingFromPropRef.current = false
    })
  }, [index, itemHeight])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const scheduleSettle = () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null
        if (!syncingFromPropRef.current) settleScroll()
      }, SCROLL_SETTLE_MS)
    }

    const onScroll = () => {
      setScrollOffset(el.scrollTop)
      scheduleSettle()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current)
        settleTimerRef.current = null
      }

      const direction = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0
      if (direction === 0) return

      const next = clampIndex(indexRef.current + direction, items.length)
      commitIndex(next)
    }

    const onScrollEnd = () => {
      if (!syncingFromPropRef.current) settleScroll()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('scrollend', onScrollEnd)

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scrollend', onScrollEnd)
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    }
  }, [commitIndex, items.length, settleScroll])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      commitIndex(index - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      commitIndex(index + 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
    } else if (e.key === 'Tab') {
      e.preventDefault()
    }
  }

  const activeFloat = scrollOffset / itemHeight

  return (
    <div
      data-testid={testId}
      className={cn('relative mx-auto w-full select-none', config.maxWidth, className)}
      style={{ height: itemHeight * VISIBLE_COUNT }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          maskImage:
            size === 'default'
              ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
              : 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
          WebkitMaskImage:
            size === 'default'
              ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
              : 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
        }}
      />

      <div
        ref={scrollRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={items[index] ? `wheel-option-${items[index].id}` : undefined}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        className="wheel-picker-scroll relative z-0 h-full overflow-y-auto overscroll-y-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{
          scrollSnapType: 'y proximity',
          paddingTop: edgePad,
          paddingBottom: edgePad,
        }}
      >
        {items.map((item, i) => {
          const distance = Math.abs(i - activeFloat)
          const isActive = distance < 0.35
          const tier = getVisualTier(distance, config.tiers, config.minOpacity)
          const labelOpacity = tier.opacity
          const sublabelOpacity = Math.max(tier.opacity, config.sublabelMinOpacity)
          const dataAttrs = getItemDataAttrs?.(i) ?? {}
          const hasStackedSublabel = Boolean(item.sublabel && !item.trailing)

          return (
            <div
              key={item.id}
              id={`wheel-option-${item.id}`}
              role="option"
              aria-selected={isActive}
              data-testid={itemTestId}
              {...dataAttrs}
              className={cn(
                'wheel-picker-item flex shrink-0 cursor-pointer snap-center snap-always',
                config.paddingX
              )}
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                transform: `scale(${tier.scale})`,
              }}
              onClick={() => {
                if (isActive) {
                  onActiveItemClick?.()
                  return
                }
                commitIndex(i)
              }}
            >
              {item.trailing && config.trailingVariant === 'inline' ? (
                <div className="flex w-full items-center justify-center text-center">
                  <div
                    className={cn(
                      'inline-flex max-w-full items-baseline justify-center',
                      config.contentGap
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 truncate leading-snug',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      style={{
                        fontSize: tier.fontSize,
                        fontWeight: tier.weight,
                        opacity: labelOpacity,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 tabular-nums leading-none text-xs',
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground/80'
                      )}
                      style={{ opacity: labelOpacity }}
                    >
                      {item.trailing}
                    </span>
                  </div>
                </div>
              ) : hasStackedSublabel ? (
                <div
                  className="relative h-full w-full"
                  style={{ ['--wheel-label-size' as string]: `${tier.fontSize}px` }}
                >
                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-0">
                    <span
                      className={cn(
                        'max-w-full truncate leading-snug text-center',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      style={{
                        fontSize: tier.fontSize,
                        fontWeight: tier.weight,
                        opacity: labelOpacity,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div
                    className="absolute inset-x-0 top-1/2 flex justify-center px-0"
                    style={{
                      transform: `translateY(calc(${tier.fontSize}px * 0.55 + 0.375rem))`,
                    }}
                  >
                    <span
                      className={cn(
                        'max-w-full truncate leading-snug text-center',
                        config.sublabelClass,
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground'
                      )}
                      style={{ opacity: sublabelOpacity }}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex w-full items-center',
                    config.contentGap,
                    item.trailing ? 'justify-between' : 'justify-center'
                  )}
                >
                  <div
                    className={cn(
                      'min-w-0',
                      item.trailing ? 'flex-1 text-left' : 'flex flex-1 flex-col items-center text-center'
                    )}
                  >
                    <span
                      className={cn(
                        'block max-w-full truncate leading-snug',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                      style={{
                        fontSize: tier.fontSize,
                        fontWeight: tier.weight,
                        opacity: labelOpacity,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.trailing && (
                    <span
                      className={cn(
                        'shrink-0 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs tabular-nums',
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground/65'
                      )}
                    >
                      {item.trailing}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}