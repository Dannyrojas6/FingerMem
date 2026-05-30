import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import type { Sentence } from '../types'

export default function Practice() {
  const { sceneId, index } = useParams<{ sceneId: string; index: string }>()
  const sentenceIndex = parseInt(index || '0', 10)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [sceneName, setSceneName] = useState('')
  const [totalSentences, setTotalSentences] = useState(0)
  const [sentence, setSentence] = useState<Sentence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 直接在句子上的打字状态
  const [userInput, setUserInput] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  // 去除句子末尾标点（用于匹配和完成判断）
  const cleanTarget = (text: string): string => {
    return text.replace(/[.,!?;:"']$/, '')
  }

  // 计算当前输入和目标匹配的最长正确前缀长度（逐字符严格匹配）
  const getMatchedPrefixLength = (input: string, target: string): number => {
    const maxLen = Math.min(input.length, target.length);
    let match = 0;
    for (let i = 0; i < maxLen; i++) {
      if (input[i] === target[i]) {
        match++;
      } else {
        break;
      }
    }
    return match;
  }

  useEffect(() => {
    const loadSentence = async () => {
      if (!sceneId) return
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/dicts/basic-850/${sceneId}.json`)
        if (!res.ok) throw new Error('加载失败')

        const data = await res.json()
        const targetSentence: Sentence = data.sentences[sentenceIndex]

        if (!targetSentence) {
          throw new Error('句子不存在')
        }

        setSceneName(data.name)
        setTotalSentences(data.sentences.length)
        setSentence(targetSentence)
        setUserInput('')
        setIsCompleted(false)
      } catch (err: any) {
        setError(err.message || '加载句子失败')
      } finally {
        setLoading(false)
      }
    }

    loadSentence()
  }, [sceneId, sentenceIndex])

  // 自动聚焦

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [loading, sentenceIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sentence) return

    let value = e.target.value

    // 严格限制在有效长度内（忽略末尾标点后的长度）
    if (value.length > effectiveLength) {
      value = value.slice(0, effectiveLength)
    }

    setUserInput(value)

    // 极度防御的完成判断（专门防止狂按空格导致的误完成）
    const trimmedValue = value.trimEnd();
    const lastTypedChar = value.length > 0 ? value[value.length - 1] : '';

    // 必须同时满足：
    // 1. 去掉末尾空格后内容完全等于目标
    // 2. 最后输入的那个字符不能是空格（防止纯靠空格把长度顶上去）
    const isNowCompleted =
      trimmedValue === effectiveTarget &&
      lastTypedChar !== ' ';

    setIsCompleted(isNowCompleted);

    if (isNowCompleted) {
      const isLastSentence = sentenceIndex + 1 >= totalSentences;

      if (!isLastSentence) {
        // 中间句子完成，极短延迟后自动跳转下一句
        setTimeout(() => {
          navigate(`/practice/${sceneId}/${sentenceIndex + 1}`, { replace: true });
        }, 80);
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setUserInput('')
      setIsCompleted(false)
    }
  }

  const resetInput = () => {
    setUserInput('')
    setIsCompleted(false)
    inputRef.current?.focus()
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void resetInput // 预留给未来“重新开始当前句”功能

  if (loading) {
    return <div className="text-center py-10 text-gray-500">加载中...</div>
  }

  if (error || !sentence) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || '加载失败'}</p>
        <Link to={`/scene/${sceneId}`} className="text-blue-600 hover:underline">
          返回场景
        </Link>
      </div>
    )
  }

  const target = sentence.en;
  const chars = target.split('');
  const effectiveTarget = cleanTarget(target);
  const effectiveLength = effectiveTarget.length;

  // 光标位置永远不超过有效内容长度（不跳到末尾标点上）
  const cursorPosition = Math.min(userInput.length, effectiveLength);

  // 进度用“已正确匹配的前缀长度”来算，更符合实际完成度
  const matchedForProgress = getMatchedPrefixLength(userInput, effectiveTarget);
  const progress = Math.min(Math.floor((matchedForProgress / effectiveLength) * 100), 100);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回场景列表
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">完整显示模式</h2>
          <span className="text-sm text-gray-500">
            第 {sentenceIndex + 1} / {totalSentences} 句
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 直接在句子上的打字区域 */}
      <div 
        className="bg-white border border-gray-200 rounded-xl p-8 mb-6 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-sm text-gray-500 mb-3">直接在句子上打字</div>

        <div className="text-3xl leading-relaxed font-mono tracking-wide select-none mb-6">
          {chars.map((targetChar, i) => {
            const typedChar = userInput[i];
            // 光标只在有效内容范围内显示，绝不跳到末尾标点上
            const isCursorPosition = i === cursorPosition && cursorPosition < effectiveLength;

            let className = 'text-gray-400'; // 未输入
            let displayChar = targetChar;

            if (typedChar !== undefined) {
              if (typedChar === targetChar) {
                // 正确
                className = 'text-green-600';
              } else {
                // 错误：显示原字符（红色）
                className = 'text-red-600';

                // 空格错误特殊处理：显示红色 · 而不是空格
                if (targetChar === ' ' || typedChar === ' ') {
                  displayChar = '·';
                }
              }
            }

            return (
              <span 
                key={i} 
                className={`${className} ${isCursorPosition ? 'border-b-[3px] border-blue-500' : ''}`}
              >
                {displayChar}
              </span>
            );
          })}
        </div>

        <div className="text-xl text-gray-600 mb-6">
          {sentence.zh}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="opacity-0 absolute w-px h-px pointer-events-none"
          autoFocus
        />

        <div className="text-xs text-gray-500">
          直接在句子上打字（包括空格）。错误会显示你实际输入的内容（红色，空格错误显示为 ·），必须删除重打。
        </div>
      </div>

      {/* 完成状态 */}
      {isCompleted && (
        sentenceIndex + 1 >= totalSentences ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-700 text-2xl font-semibold mb-3">
              🎉 恭喜！你已完成「{sceneName}」全部句子！
            </div>
            <p className="text-green-600 mb-6">
              共 {totalSentences} 个句子全部练习完成
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/" className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                返回场景列表
              </Link>
              <Link to={`/practice/${sceneId}/0`} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                重新练习本场景
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-green-600 text-lg font-medium">
            完成！正在进入下一句...
          </div>
        )
      )}
    </div>
  )
}
