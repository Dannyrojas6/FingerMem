import type { Sentence } from '../types'

export interface SceneData {
  name: string
  sentences: Sentence[]
}

export interface Scene extends SceneData {
  id: string
}

// 使用 Vite 的 import.meta.glob 在构建时静态收集所有场景数据
const sceneModules = import.meta.glob('./dicts/basic-850/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, SceneData>

// 保持与历史顺序一致的场景 ID 顺序
const SCENE_DISPLAY_ORDER = [
  'daily-life',
  'restaurant',
  'shopping',
  'travel',
  'work',
  'family',
  'health',
  'weather',
  'time',
  'place',
]

// 导出所有场景（用于 SceneList 动态渲染），按固定顺序排序
export const scenes: Scene[] = Object.entries(sceneModules)
  .map(([filePath, data]) => {
    const fileName = filePath.split('/').pop()!
    const id = fileName.replace('.json', '')
    return {
      id,
      name: data.name,
      sentences: data.sentences,
    }
  })
  .sort((a, b) => {
    return SCENE_DISPLAY_ORDER.indexOf(a.id) - SCENE_DISPLAY_ORDER.indexOf(b.id)
  })

// 根据 sceneId 获取单个场景数据
export function getScene(id: string): SceneData | undefined {
  const key = `./dicts/basic-850/${id}.json`
  return sceneModules[key]
}
