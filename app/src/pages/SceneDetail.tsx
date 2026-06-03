import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getScene } from '../data/scenes'
import ErrorMessage from '../components/ErrorMessage'
import { Button } from '@/components/ui/button'
import WheelPicker from '../components/WheelPicker'

export default function SceneDetail() {
  const { sceneId } = useParams<{ sceneId: string }>()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const scene = sceneId ? getScene(sceneId) : undefined

  const wheelItems = useMemo(
    () =>
      scene?.sentences.map((sentence, i) => ({
        id: String(i),
        label: sentence.en,
        sublabel: sentence.zh,
      })) ?? [],
    [scene]
  )

  if (!sceneId) {
    return <ErrorMessage message="缺少场景参数" />
  }

  if (!scene) {
    return (
      <ErrorMessage
        message="未找到该场景的练习内容"
        secondaryMessage="请确认场景 ID 是否正确，或返回场景列表重新选择。"
      />
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col">
      <header className="shrink-0 px-1 pt-2 pb-4 text-center">
        <Link
          to="/"
          className="mb-3 inline-block text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          所有场景
        </Link>
        <h1 data-testid="scene-name" className="truncate text-base font-medium text-foreground">
          {scene.name}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{scene.sentences.length} 句</p>
      </header>

      <div className="flex flex-1 flex-col justify-center py-2">
        <WheelPicker
          testId="sentence-wheel"
          itemTestId="sentence-item"
          aria-label="句子列表"
          items={wheelItems}
          index={index}
          onIndexChange={setIndex}
          getItemDataAttrs={i => ({ 'data-sentence-index': i })}
        />
      </div>

      <footer className="shrink-0 space-y-2 px-1 pb-4 pt-6">
        <Button
          data-testid="start-practice-button"
          className="h-11 w-full text-sm font-medium"
          onClick={() => navigate(`/practice/${sceneId}/${index}`)}
        >
          从这句开始练习
        </Button>
      </footer>
    </div>
  )
}