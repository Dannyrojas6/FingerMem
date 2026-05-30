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
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回场景列表
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{sceneName}</h2>
          <span className="text-sm text-gray-500">
            第 {sentenceIndex + 1} / {totalSentences} 句
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 句子练习主区域 - 极简居中设计 */}
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* 大句子 - 居中 + 加大字号 */}
        <div className="text-4xl md:text-5xl leading-relaxed font-mono tracking-wide select-none text-center mb-6">
          {chars.map((targetChar, i) => {
            const typedChar = userInput[i]
            const isCursorPosition = i === cursorPosition && cursorPosition < effectiveLength

            let displayChar = targetChar
            if (targetChar === ' ') {
              displayChar = '·'
            }

            let className = 'text-gray-400'

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

        {/* 中文翻译 */}
        <div className="text-2xl text-gray-600 text-center mb-8">{sentence.zh}</div>

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

      {/* 完成状态 - 最后一句使用轻量弹窗 */}
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
              className="bg-white border border-gray-200 rounded-xl shadow-md p-6 w-full max-w-[360px] text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                恭喜完成！ <span className="text-2xl">🎉</span>
              </div>

              <div className="flex gap-3 justify-center">
                <Link
                  to="/"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
                  onClick={() => setShowCompletionModal(false)}
                >
                  返回列表
                </Link>
                <Link
                  to={`/practice/${sceneId}/0`}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium text-center"
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
