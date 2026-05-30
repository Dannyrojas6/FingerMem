import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getScene } from '../data/scenes'
import { cleanTarget, getMatchedPrefixLength, isSentenceCompleted } from '../utils/typing'
import ErrorMessage from '../components/ErrorMessage'

export default function Practice() {
  const { sceneId, index } = useParams<{ sceneId: string; index: string }>()
  const sentenceIndex = parseInt(index || '0', 10)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // 直接在句子上的打字状态
  const [userInput, setUserInput] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

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

  // 当切换句子时，重置打字输入状态
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 路由参数变化时重置本地 UI 状态是合理且常见的模式
    setUserInput('')
    setIsCompleted(false)
    setShowCompletionModal(false)
  }, [sceneId, sentenceIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sentence) return

    let value = e.target.value

    // 严格限制在有效长度内（忽略末尾标点后的长度）
    if (value.length > effectiveLength) {
      value = value.slice(0, effectiveLength)
    }

    setUserInput(value)

    // 使用共享的完成判断逻辑（防空格作弊）
    const isNowCompleted = isSentenceCompleted(value, effectiveTarget)

    setIsCompleted(isNowCompleted)

    if (isNowCompleted) {
      const isLastSentence = sentenceIndex + 1 >= totalSentences

      if (isLastSentence) {
        setShowCompletionModal(true)
      } else {
        // 中间句子完成，极短延迟后自动跳转下一句（无文字提示）
        setTimeout(() => {
          navigate(`/practice/${sceneId}/${sentenceIndex + 1}`, { replace: true })
        }, 80)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setUserInput('')
      setIsCompleted(false)
    }
  }

  if (error || !sentence) {
    return <ErrorMessage message={error || '无法加载练习内容'} />
  }

  const target = sentence.en
  const chars = target.split('')
  const effectiveTarget = cleanTarget(target)
  const effectiveLength = effectiveTarget.length

  // 光标位置永远不超过有效内容长度（不跳到末尾标点上）
  const cursorPosition = Math.min(userInput.length, effectiveLength)

  // 进度用“已正确匹配的前缀长度”来算，更符合实际完成度
  const matchedForProgress = getMatchedPrefixLength(userInput, effectiveTarget)
  const progress = Math.min(Math.floor((matchedForProgress / effectiveLength) * 100), 100)

  return (
    <div className="max-w-3xl mx-auto">
      {/* 句子练习主区域 - 极简居中设计（按 spec 隐藏头部 + 深色容器） */}
      <div
        className="flex flex-col items-center justify-center min-h-[240px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Subtle container per locked design */}
        <div className="bg-[#1f1f1f] rounded-[10px] p-6 w-full max-w-2xl">
          {/* 大句子 - 12px + 轻微字距 */}
          <div className="text-[12px] leading-relaxed font-mono tracking-[0.5px] select-none text-center mb-5 text-[#f4f4f5]">
            {chars.map((targetChar, i) => {
              const typedChar = userInput[i]
              const isCursorPosition = i === cursorPosition && cursorPosition < effectiveLength

              let displayChar = targetChar
              if (targetChar === ' ') {
                displayChar = '·'
              }

              let className = 'text-[#f4f4f5]'

              if (typedChar !== undefined) {
                if (typedChar === targetChar) {
                  className = 'text-green-600'
                } else {
                  className = 'text-red-600'
                }
              }

              return (
                <span
                  key={i}
                  className={`${className} ${isCursorPosition ? 'border-b-[3px] border-blue-500' : ''}`}
                >
                  {displayChar}
                </span>
              )
            })}
          </div>

          {/* 中文翻译 - 10px */}
          <div className="text-[10px] text-[#a1a1aa] text-center">{sentence.zh}</div>
        </div>

        {/* 隐藏输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="opacity-0 absolute w-px h-px pointer-events-none"
        />
      </div>

      {/* 完成状态 - 最后一句使用轻量弹窗（按 spec 锁定样式） */}
      {isCompleted && sentenceIndex + 1 >= totalSentences && showCompletionModal && (
        <>
          {/* 背景遮罩（中等强度）+ 轻微变暗主内容 */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowCompletionModal(false)}
          />

          {/* 小型居中弹窗 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-[#1f1f1f] rounded-xl shadow-md p-6 w-full max-w-[360px] text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-[15px] font-semibold mb-4 flex items-center justify-center gap-2 text-[#f4f4f5]">
                {sceneName}完成！ <span className="text-lg">🏆</span>
              </div>

              <div className="flex gap-3 justify-center">
                <Link
                  to="/"
                  className="flex-1 px-4 py-1.5 bg-[#1f1f1f] border border-[#444] rounded-[12px] hover:bg-[#252525] text-sm font-medium text-center text-[#f4f4f5]"
                  onClick={() => setShowCompletionModal(false)}
                >
                  返回列表
                </Link>
                <Link
                  to={`/practice/${sceneId}/0`}
                  className="flex-1 px-4 py-1.5 bg-[#f5f5f5] text-[#161616] rounded-[12px] hover:bg-[#e5e5e5] text-sm font-medium text-center"
                  onClick={() => setShowCompletionModal(false)}
                >
                  继续训练
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
