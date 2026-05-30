import { Link } from 'react-router-dom'
import { scenes } from '../data/scenes'

export default function SceneList() {
  return (
    <div>
      <h2 className="text-xl font-medium text-[#f4f4f5] mb-6">基础英语 850 · 请选择一个场景</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {scenes.map(scene => (
          <Link
            key={scene.id}
            to={`/scene/${scene.id}`}
            className="block"
          >
            <div className="bg-[#1f1f1f] p-4 rounded-[10px] border border-[#2a2a2a] transition-colors hover:border-[#3a3a3a]">
              <div className="text-[16px] font-semibold text-[#f4f4f5]">{scene.name}</div>
              <div className="text-[13px] text-[#888] mt-2">
                {scene.sentences.length} 个句子 · 点击开始练习
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-[#888]">
        点击卡片查看场景内容，可选择单个句子练习或连续练习整个场景。
      </p>
    </div>
  )
}
