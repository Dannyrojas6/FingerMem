import type { Sentence } from '../types'

export interface SceneData {
  name: string
  sentences: Sentence[]
}

export interface Scene extends SceneData {
  id: string
}

// 使用 Vite 的 import.meta.glob 在构建时静态收集 active/ 目录下的场景数据
// active/ 由 scripts/sync-dicts.js 维护，应用层始终只从此处加载
const sceneModules = import.meta.glob('./dicts/active/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, SceneData>

// 导出所有场景（用于 SceneList 动态渲染）
// 按文件名字母顺序排序（所有词典统一规则，由 sync-dicts 脚本保证数据源）
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
  .sort((a, b) => a.id.localeCompare(b.id))

// 根据 sceneId 获取单个场景数据
export function getScene(id: string): SceneData | undefined {
  const key = `./dicts/active/${id}.json`
  return sceneModules[key]
}

/**
 * 获取当前激活词典的信息（由 sync-dicts 脚本写入）
 * 如果 active/ 为空或标记文件不存在，返回 null
 */
export interface ActiveDictInfo {
  name: string
  sceneCount: number
  switchedAt: string
}

export function getActiveDictInfo(): ActiveDictInfo | null {
  // 注意：此函数在运行时无法直接读取 .active-dict.json
  // 因为它是静态构建时的数据层。这里仅作为类型与未来扩展占位。
  // 实际使用时可通过 import 方式或在脚本端处理。
  // 当前实现返回 null，未来可根据需要扩展。
  return null
}
