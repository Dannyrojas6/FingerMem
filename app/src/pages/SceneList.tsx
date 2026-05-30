import { Link } from 'react-router-dom'
import { scenes } from '../data/scenes'

export default function SceneList() {
  return (
    <div>
      <h2 className="text-xl font-medium text-gray-800 mb-6">基础英语 850 · 请选择一个场景</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {scenes.map(scene => (
          <Link
            key={scene.id}
            to={`/scene/${scene.id}`}
            className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="font-medium text-lg text-gray-900">{scene.name}</div>
            <div className="text-sm text-gray-500 mt-1">
              {scene.sentences.length} 个句子 · 点击开始连续练习
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-500">
        点击卡片查看场景内容，可选择单个句子练习或连续练习整个场景。
      </p>
    </div>
  )
}
