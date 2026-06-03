import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { getScene } from '../data/scenes'
import type { Sentence } from '../types'
import {
  clampInputToEffectiveLength,
  cleanTarget,
  getMatchedPrefixLength,
  isInputComplete,
  isUnexpectedInputJump,
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
  const inputOwnerEnRef = useRef<string | null>(null)
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
    const nextSentence = sceneData?.sentences[nextIndex] ?? null
    sentenceIndexRef.current = nextIndex
    sentenceRef.current = nextSentence
    inputOwnerEnRef.current = nextSentence?.en ?? null
    userInputRef.current = ''
    setUserInput('')
    setIsCompleted(false)
    isCompletedRef.current = false
    if (inputRef.current) {
      inputRef.current.value = ''
    }
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
    inputOwnerEnRef.current = sentence?.en ?? null
    userInputRef.current = ''
    setUserInput('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setIsCompleted(false)
    isCompletedRef.current = false
    setShowCompletionModal(false)
    resetIdleTimer()
    correctTimestampsRef.current = []
    setDisplayCPM("—")
    clearAdvanceTimer()
  }, [sceneId, sentenceIndex, sentence?.en])

  // 清理 idle / auto-advance 定时器（组件卸载时）
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      clearAdvanceTimer()
    }
  }, [])

  const applyInputValue = (rawValue: string, options?: { allowMultiChar?: boolean }) => {
    const currentSentence = sentenceRef.current
    if (!currentSentence) return

    const effectiveTarget = cleanTarget(currentSentence.en)
    const total = sceneData?.sentences.length ?? 0
    const prevInput = userInputRef.current
    const value = clampInputToEffectiveLength(rawValue, effectiveTarget)

    if (!options?.allowMultiChar && isUnexpectedInputJump(prevInput, value)) {
      return
    }

    if (inputOwnerEnRef.current !== null && inputOwnerEnRef.current !== currentSentence.en) {
      return
    }

    // 自动跳句后滞后的 onChange 可能携带上一句全文，与新句零匹配且长度>1
    if (
      userInputRef.current === '' &&
      value.length > 1 &&
      getMatchedPrefixLength(value, effectiveTarget) === 0
    ) {
      return
    }

    if (value === userInputRef.current) {
      return
    }

    resetIdleTimer()

    const prevMatched = getMatchedPrefixLength(userInputRef.current, effectiveTarget)
    setUserInput(value)
    userInputRef.current = value
    inputOwnerEnRef.current = currentSentence.en

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

  const appendTypingKey = (key: string) => {
    applyInputValue(userInputRef.current + key)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 忽略浏览器自动补全/连字触发的 onChange，打字只走 keydown
    if (e.target.value !== userInputRef.current && inputRef.current) {
      inputRef.current.value = userInputRef.current
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Escape') {
      e.preventDefault()
      clearAdvanceTimer()
      setUserInput('')
      userInputRef.current = ''
      setIsCompleted(false)
      isCompletedRef.current = false
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      resetIdleTimer()

      correctTimestampsRef.current = []
      setDisplayCPM("—")
      return
    }

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (userInputRef.current.length === 0) return
      applyInputValue(userInputRef.current.slice(0, -1))
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      appendTypingKey(e.key)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text/plain')
    if (!pasted) return
    applyInputValue(userInputRef.current + pasted, { allowMultiChar: true })
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
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="shrink-0 border-b border-border/80 px-5 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to={`/scene/${sceneId}`}
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
          >
            返回
          </Link>
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-foreground/90 transition-[width] duration-200 ease-out"
              style={{ width: `${((sentenceIndex + 1) / totalSentences) * 100}%` }}
            />
          </div>
          <span
            data-testid="practice-progress"
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
          >
            {sentenceIndex + 1}/{totalSentences}
          </span>
        </div>
        <p className="mx-auto mt-2 max-w-2xl truncate text-center text-xs text-muted-foreground">
          {sceneName}
        </p>
      </header>

      <div
        data-testid="practice-typing-area"
        className="mx-auto flex w-full max-w-3xl flex-1 cursor-text flex-col items-center justify-center px-6 py-10"
        onClick={() => inputRef.current?.focus()}
      >
        <div
          data-testid="practice-sentence"
          className="practice-sentence w-full text-center font-mono text-[clamp(1.75rem,6vw,2.75rem)] leading-[1.4] tracking-tight select-none"
        >
          {chars.map((targetChar, i) => {
            const isTypableIndex = i < effectiveLength
            const typedChar = isTypableIndex ? userInput[i] : undefined
            const isCursorPosition =
              isTypableIndex && i === cursorPosition && cursorPosition < effectiveLength

            let displayChar = targetChar
            if (targetChar === ' ') {
              displayChar = '·'
            }

            let className = 'text-muted-foreground/60'

            // 仅连续正确前缀显示绿色，避免在空格位置“碰巧相等”或换句后旧输入误显绿
            if (typedChar !== undefined) {
              if (i < matchedPrefixLen) {
                className = 'text-typing-correct'
              } else {
                className = 'text-typing-error'
              }
            }

            return (
              <span
                key={i}
                className={`${className} ${isCursorPosition ? 'border-b-2 border-foreground/70' : ''} ${isCursorPosition && isIdle ? 'typing-cursor' : ''}`}
              >
                {displayChar}
              </span>
            )
          })}
        </div>

        <p className="mt-12 max-w-lg text-center text-[15px] leading-relaxed text-muted-foreground">
          {sentence.zh}
        </p>
      </div>

      {/* 捕获键盘的隐藏输入：固定在视口外，避免落在英文/中文之间触发浏览器原生 loading 指示 */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore
        name="finger-mem-typing"
        aria-label="打字输入"
        className="pointer-events-none fixed top-0 left-[-9999px] h-px w-px opacity-0 overflow-hidden"
      />

      <footer className="shrink-0 border-t border-border/80 px-5 py-4 text-center font-mono text-xs tabular-nums text-muted-foreground">
        {displayCPM} CPM
      </footer>

      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogPopup className="max-w-[380px] border border-border bg-popover p-8 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-medium text-foreground">练习完成</DialogTitle>
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
              variant="outline"
              render={<Link to="/" />}
              onClick={() => setShowCompletionModal(false)}
              className="flex-1 text-[13px]"
            >
              返回场景列表
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
