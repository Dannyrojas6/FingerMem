import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { getScene } from '../data/scenes'
import type { Sentence } from '../types'
import {
  clampInputToEffectiveLength,
  cleanTarget,
  getMatchedPrefixLength,
  isInputComplete,
} from '../utils/typing'
import ErrorMessage from '../components/ErrorMessage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export default function Practice() {
  const { sceneId, index } = useParams<{ sceneId: string; index: string }>()
  const urlSentenceIndex = parseInt(index || '0', 10)
  const [sentenceIndex, setSentenceIndex] = useState(urlSentenceIndex)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  // titleRef was previously used for Dialog initialFocus (removed due to type incompatibility with @base-ui/react)

  // 直接在句子上的打字状态
  const [userInput, setUserInput] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // 光标闪烁控制：新句子默认静态下划线。只有用户长时间静止不动后才开始闪烁提示。
  const [isIdle, setIsIdle] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isCompletedRef = useRef(false)
  const sentenceIndexRef = useRef(0)
  const advanceGenerationRef = useRef(0)
  const IDLE_BLINK_DELAY = 1500
  const AUTO_ADVANCE_DELAY = 80

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    advanceGenerationRef.current += 1
  }

  // 每当有输入或新句子出现时，重置计时器（保持静态），静止够久后才触发闪烁
  const resetIdleTimer = () => {
    setIsIdle(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
    }, IDLE_BLINK_DELAY)
  }

  // 实时 CPM（每分钟正确字符数）计算 —— 仅用于底部极简控制台
  // 使用 10 秒滚动窗口，只统计正确输入的字符
  const correctTimestampsRef = useRef<number[]>([])
  const userInputRef = useRef('')
  const sentenceRef = useRef<Sentence | null>(null)
  const SPEED_WINDOW_MS = 10_000
  const [displayCPM, setDisplayCPM] = useState("—")

  // URL 变化时（链接进入、浏览器后退）与地址栏同步
  useEffect(() => {
    setSentenceIndex(urlSentenceIndex)
  }, [urlSentenceIndex])

  const syncPracticeUrl = (nextIndex: number) => {
    if (!sceneId) return
    const path = `/practice/${sceneId}/${nextIndex}`
    window.history.replaceState(window.history.state, '', path)
  }

  /** 下一句：只更新本地状态 + 地址栏，不走 React Router navigate，避免导航 loading */
  const advanceToSentence = (nextIndex: number) => {
    userInputRef.current = ''
    setUserInput('')
    setIsCompleted(false)
    isCompletedRef.current = false
    setSentenceIndex(nextIndex)
    syncPracticeUrl(nextIndex)
  }

  // 使用共享的纯函数（便于测试）

  // 同步计算当前句子数据（数据层是同步的，不再需要 effect 做数据加载 + setState）
  const sceneData = sceneId ? getScene(sceneId) : undefined
  const targetSentence = sceneData?.sentences[sentenceIndex] ?? null

  const error = !sceneId
    ? '缺少场景参数'
    : !sceneData
      ? '未找到该场景'
      : !targetSentence
        ? '句子不存在'
        : null

  const sceneName = sceneData?.name ?? ''
  const totalSentences = sceneData?.sentences.length ?? 0
  const sentence = targetSentence
  userInputRef.current = userInput
  sentenceRef.current = sentence
  sentenceIndexRef.current = sentenceIndex
  isCompletedRef.current = isCompleted

  // 自动聚焦（当句子变化时聚焦输入框）
  useEffect(() => {
    if (sentence && inputRef.current) {
      inputRef.current.focus()
    }
  }, [sentenceIndex, sentence])

  // 自动聚焦策略（更可靠的打字练习体验）
  // 只在练习进行中（!isCompleted）时才启用全局自动聚焦，避免干扰完成界面
  useEffect(() => {
    if (isCompleted || !sentence) return

    const focusInput = () => inputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) {
        if (e.key.length === 1 || e.key === ' ') {
          focusInput()
        }
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) focusInput()
    }

    window.addEventListener('focus', focusInput)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', focusInput)

    // 立即聚焦一次
    focusInput()

    return () => {
      window.removeEventListener('focus', focusInput)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', focusInput)
    }
  }, [sentence, isCompleted])

  // 切换句子时在绘制前同步清空输入，避免旧输入与新句子逐字比对产生“变绿”闪烁
  useLayoutEffect(() => {
    userInputRef.current = ''
    setUserInput('')
    setIsCompleted(false)
    isCompletedRef.current = false
    setShowCompletionModal(false)
    resetIdleTimer()
    correctTimestampsRef.current = []
    setDisplayCPM("—")
    clearAdvanceTimer()
  }, [sceneId, sentenceIndex])

  // 清理 idle / auto-advance 定时器（组件卸载时）
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      clearAdvanceTimer()
    }
  }, [])

  const applyInputValue = (rawValue: string) => {
    const currentSentence = sentenceRef.current
    if (!currentSentence) return

    const effectiveTarget = cleanTarget(currentSentence.en)
    const total = sceneData?.sentences.length ?? 0
    const value = clampInputToEffectiveLength(rawValue, effectiveTarget)

    resetIdleTimer()

    const prevMatched = getMatchedPrefixLength(userInputRef.current, effectiveTarget)
    setUserInput(value)
    userInputRef.current = value

    const newMatched = getMatchedPrefixLength(value, effectiveTarget)
    const now = Date.now()

    if (newMatched > prevMatched) {
      const added = newMatched - prevMatched
      for (let i = 0; i < added; i++) {
        correctTimestampsRef.current.push(now)
      }
    }

    const cutoff = now - SPEED_WINDOW_MS
    correctTimestampsRef.current = correctTimestampsRef.current.filter(t => t > cutoff)

    const count = correctTimestampsRef.current.length
    if (count >= 3) {
      const cpm = Math.round((count / (SPEED_WINDOW_MS / 1000)) * 60)
      setDisplayCPM(String(cpm))
    } else {
      setDisplayCPM("—")
    }

    const isNowCompleted = isInputComplete(value, effectiveTarget)
    const wasCompleted = isCompletedRef.current

    isCompletedRef.current = isNowCompleted
    setIsCompleted(isNowCompleted)

    if (isNowCompleted && !wasCompleted) {
      const isLastSentence = sentenceIndexRef.current + 1 >= total

      if (isLastSentence) {
        clearAdvanceTimer()
        setShowCompletionModal(true)
      } else {
        clearAdvanceTimer()
        const scheduledIndex = sentenceIndexRef.current
        const nextIndex = scheduledIndex + 1
        const scheduledSentenceEn = currentSentence.en
        const generation = ++advanceGenerationRef.current
        advanceTimerRef.current = setTimeout(() => {
          advanceTimerRef.current = null
          if (generation !== advanceGenerationRef.current) return
          if (sentenceIndexRef.current !== scheduledIndex) return
          const s = sentenceRef.current
          if (!s || s.en !== scheduledSentenceEn) return
          const targetNow = cleanTarget(s.en)
          if (!isInputComplete(userInputRef.current, targetNow)) return
          advanceToSentence(nextIndex)
        }, AUTO_ADVANCE_DELAY)
      }
    } else if (!isNowCompleted) {
      clearAdvanceTimer()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyInputValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearAdvanceTimer()
      setUserInput('')
      userInputRef.current = ''
      setIsCompleted(false)
      isCompletedRef.current = false
      // Escape 清空后保持静态，并重新计时（静止够久才会开始闪烁）
      resetIdleTimer()

      // 重置速度统计
      correctTimestampsRef.current = []
      setDisplayCPM("—")
    }
  }

  // 完成弹窗键盘快捷键支持
  // Enter / 空格 → 重新练习（主操作）
  // Escape → 返回场景选择
  useEffect(() => {
    if (!showCompletionModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate(`/practice/${sceneId}/0`)
        setShowCompletionModal(false)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        navigate('/')
        setShowCompletionModal(false)
      }
    }

    // 使用 capture 优先拦截，避免被 Dialog 默认的 Escape 关闭行为干扰
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [showCompletionModal, sceneId, navigate])

  if (error || !sentence) {
    return <ErrorMessage message={error || '无法加载练习内容'} />
  }

  const target = sentence.en
  const chars = target.split('')
  const effectiveTarget = cleanTarget(target)
  const effectiveLength = effectiveTarget.length
  const matchedPrefixLen = getMatchedPrefixLength(userInput, effectiveTarget)

  // 光标位置跟随用户实际输入位置，但不跳到末尾标点上
  const cursorPosition = Math.min(userInput.length, effectiveLength)

  // 注意：上方视觉进度条已移除，进度仅通过底部控制台文字显示
  // 此处保留 matchedForProgress 计算供速度统计使用（见 handleInputChange）

  return (
    <div className="mx-auto max-w-[720px] px-6">
      {/* 句子核心区域 —— 保持在中央偏下的位置（专注最佳位置）
          再往下移一点，中英文和底部信息整体下移 */}
      <div
        data-testid="practice-typing-area"
        className="flex min-h-[55vh] flex-col items-center justify-center cursor-text pt-16 pb-2"
        onClick={() => inputRef.current?.focus()}
      >
        {/* 句子主体 */}
        <div data-testid="practice-sentence" className="font-mono text-[42px] leading-[1.35] tracking-[0.3px] text-center select-none md:text-[48px] md:leading-[1.32]">
          {chars.map((targetChar, i) => {
            const isTypableIndex = i < effectiveLength
            const typedChar = isTypableIndex ? userInput[i] : undefined
            const isCursorPosition =
              isTypableIndex && i === cursorPosition && cursorPosition < effectiveLength

            let displayChar = targetChar
            if (targetChar === ' ') {
              displayChar = '·'
            }

            let className = 'text-foreground/40'

            // 仅连续正确前缀显示绿色，避免在空格位置“碰巧相等”或换句后旧输入误显绿
            if (typedChar !== undefined) {
              if (i < matchedPrefixLen) {
                className = 'text-emerald-400/90'
              } else {
                className = 'text-rose-400/90'
              }
            }

            return (
              <span
                key={i}
                className={`${className} ${isCursorPosition ? 'border-b-[2.5px] border-foreground/75' : ''} ${isCursorPosition && isIdle ? 'typing-cursor' : ''}`}
              >
                {displayChar}
              </span>
            )
          })}
        </div>

        {/* 中文翻译 */}
        <div className="mt-10 text-[20px] text-muted-foreground/70 tracking-[0.05px] text-center leading-snug">
          {sentence.zh}
        </div>
      </div>

      {/* 捕获键盘的隐藏输入：固定在视口外，避免落在英文/中文之间触发浏览器原生 loading 指示 */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="打字输入"
        className="pointer-events-none fixed top-0 left-[-9999px] h-px w-px opacity-0 overflow-hidden"
      />

      {/* 底部极简控制台读数条（Option A 极致克制风格）
          与上方中英文一起再往下移一点 */}
      <div className="relative mt-10 flex items-center justify-between pb-6 text-[14px] tracking-[0.4px] text-muted-foreground/70 font-mono tabular-nums">
        <div className="flex-1 truncate">{sceneName}</div>

        {/* 进度放在正中间，不受左右内容长度影响 */}
        <div data-testid="practice-progress" className="absolute left-1/2 -translate-x-1/2 tabular-nums">
          {sentenceIndex + 1} / {totalSentences}
        </div>

        <div className="w-[72px] text-right tabular-nums">{displayCPM} CPM</div>
      </div>


      {/* 完成确认 —— 玻璃质感，低调克制 */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogPopup 
          className="max-w-[380px] bg-[#1a1a1a]/70 backdrop-blur-xl border-white/10 p-8 text-center"
        >
          <DialogHeader className="mb-2">
            <DialogTitle className="text-[18px] font-medium tracking-[0.2px]">
              练习完成
            </DialogTitle>
          </DialogHeader>

          <DialogFooter className="mt-7 gap-3">
            <Button
              data-testid="completion-retry-button"
              render={<Link to={`/practice/${sceneId}/0`} />}
              onClick={() => setShowCompletionModal(false)}
              className="flex-1 text-[13px]"
            >
              重新练习
            </Button>
            <Button
              data-testid="completion-back-button"
              variant="ghost"
              render={<Link to="/" />}
              onClick={() => setShowCompletionModal(false)}
              className="flex-1 text-[13px] text-muted-foreground hover:text-foreground border border-white/10 hover:bg-white/5"
            >
              返回
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
