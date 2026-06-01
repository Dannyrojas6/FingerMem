import { Link } from 'react-router-dom'
import { scenes } from '../data/scenes'

export default function SceneList() {
  return (
    <div>
      <div className="mb-8">
        <div className="text-[10px] tracking-[2px] text-muted-foreground/40 mb-1">INSTRUMENT</div>
        <h2 className="text-[22px] font-medium tracking-[-0.3px]">选择练习场景</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {scenes.map(scene => (
          <Link 
            key={scene.id} 
            to={`/scene/${scene.id}`} 
            className="block rounded-xl border border-border/40 bg-[#181818] px-5 py-4 transition-all hover:border-border hover:bg-[#1F1F1F] active:bg-[#222]"
          >
            <div className="text-[15px] font-medium tracking-[-0.1px] mb-1">{scene.name}</div>
            <div className="text-[12.5px] text-muted-foreground/75 tracking-[0.15px]">
              {scene.sentences.length} 句
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-9 text-[12px] text-muted-foreground/50 tracking-[0.4px]">
        选择一个场景开始练习
      </div>
    </div>
  )
}
