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
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold text-[#f4f4f5]">{scene.name}</div>
          <div className="text-[13px] text-[#888] mt-0.5">{scene.sentences.length} 个句子</div>
        </div>
        <Link
          to={`/practice/${sceneId}/0`}
          className="inline-flex items-center justify-center px-5 py-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#161616] font-medium text-sm rounded-[12px] whitespace-nowrap"
        >
          连续练习本场景
        </Link>
      </div>

      <div className="h-px bg-[#2a2a2a] my-4" />

      <div className="flex flex-col gap-[10px]">
        {scene.sentences.map((sentence, index) => (
          <div
            key={index}
            className="bg-[#252525] rounded-[10px] p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-mono text-[#f4f4f5] mb-1">{sentence.en}</div>
              <div className="text-[12px] text-[#a1a1aa]">{sentence.zh}</div>
            </div>
            <Link
              to={`/practice/${sceneId}/${index}`}
              className="shrink-0 bg-[#232323] hover:bg-[#2a2a2a] text-[#f4f4f5] text-[13px] font-medium rounded-[8px] px-[14px] py-[5px] whitespace-nowrap"
            >
              练习
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
