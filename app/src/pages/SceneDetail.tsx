import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Sentence } from '../types'

interface SceneData {
  name: string
  sentences: Sentence[]
}

export default function SceneDetail() {
  const { sceneId } = useParams<{ sceneId: string }>()
  const [scene, setScene] = useState<SceneData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadScene = async () => {
      if (!sceneId) return

      setLoading(true)
      setError(null)

      try {
        // 使用 fetch 从 public 目录加载（最可靠的方式）
        const res = await fetch(`/dicts/basic-850/${sceneId}.json`)
        
        if (!res.ok) {
          throw new Error(`无法加载文件: ${sceneId}.json (状态码 ${res.status})`)
        }

        const data: SceneData = await res.json()
        setScene(data)
      } catch (err: any) {
        console.error('Failed to load scene:', err)
        setError(err.message || '加载失败')
        setScene(null)
      } finally {
        setLoading(false)
      }
    }

    loadScene()
  }, [sceneId])

  if (loading) {
    return <div className="text-center py-10 text-gray-500">加载中...</div>
  }

  if (error || !scene) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">
          {error || '未找到该场景的 JSON 文件'}
        </p>
        <p className="text-gray-500 mb-4 text-sm">
          请确认文件存在于：<code>app/public/dicts/basic-850/{sceneId}.json</code>
        </p>
        <Link to="/" className="text-blue-600 hover:underline">返回场景列表</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{scene.name}</h2>
        <Link 
          to="/" 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {scene.sentences.map((sentence, index) => (
          <div 
            key={index} 
            className="p-5 border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 mb-1">
                {sentence.en}
              </div>
              <div className="text-gray-600 text-sm">
                {sentence.zh}
              </div>
            </div>
            <Link
              to={`/practice/${sceneId}/${index}`}
              className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              开始练习
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        共 {scene.sentences.length} 个句子（目前仅支持完整显示模式）
      </div>
    </div>
  )
}

