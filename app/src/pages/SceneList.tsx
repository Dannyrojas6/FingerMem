import { Link } from 'react-router-dom'

// 临时硬编码场景列表（MVP阶段），后续可改为自动扫描
const knownScenes = [
  { id: 'daily-life', name: '日常对话' },
  { id: 'restaurant', name: '餐厅点餐' },
  { id: 'shopping', name: '购物' },
  { id: 'travel', name: '旅行' },
  { id: 'work', name: '工作场合' },
  { id: 'family', name: '家庭生活' },
  { id: 'health', name: '健康医疗' },
  { id: 'weather', name: '天气' },
  { id: 'time', name: '时间与日期' },
  { id: 'place', name: '地点与方向' },
]

export default function SceneList() {
  return (
    <div>
      <h2 className="text-xl font-medium text-gray-800 mb-6">
        基础英语 850 · 请选择一个场景
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {knownScenes.map((scene) => (
          <Link
            key={scene.id}
            to={`/practice/${scene.id}/0`}
            className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="font-medium text-lg text-gray-900">{scene.name}</div>
            <div className="text-sm text-gray-500 mt-1">
              10 个句子 · 点击开始连续练习
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-500">
        提示：点击场景可查看句子内容。打字练习功能正在开发中。
      </p>
    </div>
  )
}
