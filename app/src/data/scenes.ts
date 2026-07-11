import type { Sentence } from '../types'

export interface SceneData {
  name: string
  sentences: Sentence[]
}

export interface Scene extends SceneData {
  id: string
}

export interface ActiveDictInfo {
  name: string
  sceneCount: number
  switchedAt: string
}

const META_FILE = 'active-dict.json'

// 使用 Vite 的 import.meta.glob 在构建时静态收集 active/ 目录下的场景数据
// active/ 由 scripts/sync-dicts.js 维护，应用层始终只从此处加载
const sceneModules = import.meta.glob('./dicts/active/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

function isSceneData(data: unknown): data is SceneData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return typeof d.name === 'string' && Array.isArray(d.sentences)
}

function isActiveDictInfo(data: unknown): data is ActiveDictInfo {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.name === 'string' &&
    typeof d.sceneCount === 'number' &&
    typeof d.switchedAt === 'string'
  )
}

// 导出所有场景（用于 SceneList 动态渲染）
// 按文件名字母顺序排序；排除 active-dict meta
export const scenes: Scene[] = Object.entries(sceneModules)
  .flatMap(([filePath, data]) => {
    const fileName = filePath.split('/').pop()!
    if (fileName === META_FILE) return []
    if (!isSceneData(data)) return []
    const id = fileName.replace(/\.json$/, '')
    return [{ id, name: data.name, sentences: data.sentences }]
  })
  .sort((a, b) => a.id.localeCompare(b.id))

// 根据 sceneId 获取单个场景数据
export function getScene(id: string): SceneData | undefined {
  if (id === 'active-dict') return undefined
  const key = `./dicts/active/${id}.json`
  const data = sceneModules[key]
  return isSceneData(data) ? data : undefined
}

/**
 * 获取当前激活词典的信息（由 sync-dicts 脚本写入）
 * 如果 active/ 为空或标记文件不存在，返回 null
 */
export function getActiveDictInfo(): ActiveDictInfo | null {
  const key = `./dicts/active/${META_FILE}`
  const data = sceneModules[key]
  return isActiveDictInfo(data) ? data : null
}
