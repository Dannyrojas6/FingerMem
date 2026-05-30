import { useParams, Link } from 'react-router-dom'
import { getScene } from '../data/scenes'
import ErrorMessage from '../components/ErrorMessage'

export default function SceneDetail() {
  const { sceneId } = useParams<{ sceneId: string }>()

  if (!sceneId) {
    return <ErrorMessage message="缺少场景参数" />
  }

  const scene = getScene(sceneId)

  if (!scene) {
    return (
      <ErrorMessage
        message="未找到该场景的练习内容"
        secondaryMessage="请确认场景 ID 是否正确，或返回场景列表重新选择。"
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{scene.name}</h2>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回场景列表
        </Link>
      </div>

      {/* 连续练习入口 - 让 SceneDetail 真正有价值 */}
      <div className="mb-6">
        <Link
          to={`/practice/${sceneId}/0`}
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-lg"
        >
          开始连续练习本场景 →
        </Link>
        <p className="mt-2 text-sm text-gray-500 text-center sm:text-left">
          或在下方选择单个句子单独练习
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {scene.sentences.map((sentence, index) => (
          <div
            key={index}
            className="p-5 border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 mb-1">{sentence.en}</div>
              <div className="text-gray-600 text-sm">{sentence.zh}</div>
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

      <div className="mt-6 text-sm text-gray-500">共 {scene.sentences.length} 个句子</div>
    </div>
  )
}
