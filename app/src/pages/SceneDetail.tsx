import { useParams, Link } from 'react-router-dom'
import { getScene } from '../data/scenes'
import ErrorMessage from '../components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
      <div className="mb-6 flex items-end justify-between">
        <div data-testid="scene-name">
          <div className="text-[10px] tracking-[1.5px] text-muted-foreground/50 mb-0.5">SCENE</div>
          <div className="text-[19px] font-medium tracking-[-0.25px]">{scene.name}</div>
        </div>

        {/* 开始入口 */}
        <Button
          data-testid="start-practice-button"
          render={<Link to={`/practice/${sceneId}/0`} />}
          size="sm"
          className="text-[12px] tracking-[0.4px] px-3"
        >
          开始练习
        </Button>
      </div>

      <Separator className="my-5" />

      <div className="space-y-2.5">
        {scene.sentences.map((sentence, index) => (
          <Link
            key={index}
            data-testid="sentence-item"
            data-sentence-index={index}
            to={`/practice/${sceneId}/${index}`}
            className="group block rounded-2xl bg-[#181818] px-4 py-3 hover:bg-[#1F1F1F] active:bg-[#222] transition-colors"
          >
            <div>
              <div className="font-mono text-[18px] tracking-[0.05px] leading-snug mb-1.5">{sentence.en}</div>
              <div className="text-[15.5px] text-muted-foreground/85 tracking-[0.05px]">{sentence.zh}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
