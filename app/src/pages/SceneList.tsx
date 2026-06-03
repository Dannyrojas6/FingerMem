import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scenes } from '../data/scenes'
import WheelPicker from '../components/WheelPicker'
import { cn } from '@/lib/utils'

function sceneOrderLabel(id: string): string | null {
  const match = id.match(/^(\d+)-/)
  return match ? match[1].padStart(2, '0') : null
}

export default function SceneList() {
  const navigate = useNavigate()
  const [sceneIndex, setSceneIndex] = useState(0)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [splitOpen, setSplitOpen] = useState(false)

  const sceneWheelItems = useMemo(
    () =>
      scenes.map(scene => {
        const order = sceneOrderLabel(scene.id)
        return {
          id: scene.id,
          label: order ? `${order} ${scene.name}` : scene.name,
          trailing: `${scene.sentences.length} 句`,
        }
      }),
    []
  )

  const selectedScene = scenes[sceneIndex]

  const sentenceWheelItems = useMemo(
    () =>
      selectedScene.sentences.map((sentence, i) => ({
        id: String(i),
        label: sentence.en,
        sublabel: sentence.zh,
      })),
    [selectedScene]
  )

  useEffect(() => {
    if (splitOpen) {
      setSentenceIndex(0)
    }
  }, [sceneIndex, splitOpen])

  const openSentencePanel = () => setSplitOpen(true)
  const closeSentencePanel = () => setSplitOpen(false)

  const startPractice = () => {
    navigate(`/practice/${selectedScene.id}/${sentenceIndex}`)
  }

  return (
    <div
      data-testid="scene-picker-page"
      className="flex min-h-[calc(100dvh-3.5rem)] flex-col"
    >
      <div
        data-split={splitOpen ? 'true' : 'false'}
        className="scene-picker-layout flex w-full flex-1 items-center justify-center py-4"
      >
        <section
          aria-label="场景选择"
          className="scene-picker-scenes flex min-w-0 items-center justify-center"
        >
          <div className="scene-picker-back-slot flex shrink-0 items-center justify-center overflow-hidden">
            <button
              type="button"
              data-testid="scene-picker-back"
              aria-label="返回场景选择"
              tabIndex={splitOpen ? 0 : -1}
              aria-hidden={!splitOpen}
              onClick={closeSentencePanel}
              className={cn(
                'rounded-md p-2',
                'text-muted-foreground/35 transition-colors',
                'hover:text-muted-foreground/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <svg
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          <WheelPicker
            size="compact"
            className="min-w-0 flex-1 max-w-none"
            testId="scene-wheel"
            itemTestId="scene-wheel-item"
            aria-label="场景列表"
            items={sceneWheelItems}
            index={sceneIndex}
            onIndexChange={setSceneIndex}
            onActiveItemClick={openSentencePanel}
          />
        </section>

        <section
          aria-label="句子选择"
          aria-hidden={!splitOpen}
          className="scene-picker-sentences flex min-w-0 items-center justify-center"
        >
          <div
            data-testid="sentence-panel"
            className="scene-picker-sentence-panel w-full min-w-0"
          >
            <WheelPicker
              size="default"
              className="max-w-none"
              testId="sentence-wheel"
              itemTestId="sentence-item"
              aria-label="句子列表"
              items={sentenceWheelItems}
              index={sentenceIndex}
              onIndexChange={setSentenceIndex}
              onActiveItemClick={splitOpen ? startPractice : undefined}
              getItemDataAttrs={i => ({ 'data-sentence-index': i })}
            />
          </div>
        </section>
      </div>
    </div>
  )
}