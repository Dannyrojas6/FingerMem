export const PROGRESS_STORAGE_KEY = 'fingermem.progress.v1'

export type PracticePosition = {
  sceneId: string
  sentenceIndex: number
}

export type DictProgress = {
  lastPosition: PracticePosition | null
  completed: Record<string, number[]>
}

export type ProgressRoot = {
  version: 1
  byDict: Record<string, DictProgress>
}

/** Minimal scene shape for prune/resolve (avoid coupling to full Scene type). */
export type SceneSummary = {
  id: string
  sentenceCount: number
}

export function emptyDictProgress(): DictProgress {
  return { lastPosition: null, completed: {} }
}

export function emptyProgressRoot(): ProgressRoot {
  return { version: 1, byDict: {} }
}

export function pruneDictProgress(
  progress: DictProgress,
  scenes: SceneSummary[]
): DictProgress {
  const byId = new Map(scenes.map(s => [s.id, s]))
  const completed: Record<string, number[]> = {}

  for (const [sceneId, indices] of Object.entries(progress.completed)) {
    const scene = byId.get(sceneId)
    if (!scene || scene.sentenceCount <= 0) continue
    const next = [
      ...new Set(
        indices.filter(
          i => Number.isInteger(i) && i >= 0 && i < scene.sentenceCount
        )
      ),
    ].sort((a, b) => a - b)
    if (next.length > 0) completed[sceneId] = next
  }

  let lastPosition: PracticePosition | null = null
  if (progress.lastPosition) {
    const scene = byId.get(progress.lastPosition.sceneId)
    if (scene && scene.sentenceCount > 0) {
      const idx = Math.min(
        Math.max(0, progress.lastPosition.sentenceIndex),
        scene.sentenceCount - 1
      )
      lastPosition = { sceneId: scene.id, sentenceIndex: idx }
    }
  }

  return { lastPosition, completed }
}

function isCompleted(
  progress: DictProgress,
  sceneId: string,
  index: number
): boolean {
  return (progress.completed[sceneId] ?? []).includes(index)
}

export function resolveContinueTarget(
  progress: DictProgress,
  scenes: SceneSummary[]
): PracticePosition | null {
  const pruned = pruneDictProgress(progress, scenes)
  if (!pruned.lastPosition) return null

  const scene = scenes.find(s => s.id === pruned.lastPosition!.sceneId)
  if (!scene || scene.sentenceCount <= 0) return null

  const i = pruned.lastPosition.sentenceIndex
  if (!isCompleted(pruned, scene.id, i)) {
    return { sceneId: scene.id, sentenceIndex: i }
  }

  for (let j = i + 1; j < scene.sentenceCount; j++) {
    if (!isCompleted(pruned, scene.id, j)) {
      return { sceneId: scene.id, sentenceIndex: j }
    }
  }

  for (let j = 0; j < scene.sentenceCount; j++) {
    if (!isCompleted(pruned, scene.id, j)) {
      return { sceneId: scene.id, sentenceIndex: j }
    }
  }

  return null
}

export function markSentenceComplete(
  progress: DictProgress,
  sceneId: string,
  sentenceIndex: number
): DictProgress {
  if (!Number.isInteger(sentenceIndex) || sentenceIndex < 0) return progress
  const prev = progress.completed[sceneId] ?? []
  if (prev.includes(sentenceIndex)) return progress
  const next = [...prev, sentenceIndex].sort((a, b) => a - b)
  return {
    ...progress,
    completed: { ...progress.completed, [sceneId]: next },
  }
}

export function setLastPosition(
  progress: DictProgress,
  sceneId: string,
  sentenceIndex: number
): DictProgress {
  return {
    ...progress,
    lastPosition: { sceneId, sentenceIndex },
  }
}

export function getSceneCompletedCount(
  progress: DictProgress,
  sceneId: string
): number {
  return progress.completed[sceneId]?.length ?? 0
}

export function formatSceneProgressTrailing(
  completed: number,
  total: number
): string {
  return `${completed}/${total}`
}

export function practicePath(target: PracticePosition): string {
  return `/practice/${target.sceneId}/${target.sentenceIndex}`
}

function getStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage
    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function'
    ) {
      return null
    }
    return storage
  } catch {
    return null
  }
}

function safeParseRoot(raw: string | null): ProgressRoot {
  if (!raw) return emptyProgressRoot()
  try {
    const data = JSON.parse(raw) as Partial<ProgressRoot>
    if (data?.version !== 1 || typeof data.byDict !== 'object' || !data.byDict) {
      return emptyProgressRoot()
    }
    return { version: 1, byDict: data.byDict as Record<string, DictProgress> }
  } catch {
    console.error('[progress] failed to parse localStorage; resetting root')
    return emptyProgressRoot()
  }
}

export function loadProgressRoot(): ProgressRoot {
  try {
    const storage = getStorage()
    if (!storage) return emptyProgressRoot()
    return safeParseRoot(storage.getItem(PROGRESS_STORAGE_KEY))
  } catch (e) {
    console.error('[progress] localStorage getItem failed', e)
    return emptyProgressRoot()
  }
}

export function saveProgressRoot(root: ProgressRoot): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(root))
  } catch (e) {
    console.error('[progress] localStorage setItem failed', e)
  }
}

/**
 * Load dict bucket, prune against live scenes, apply updater, persist pruned result.
 * Returns the dict progress after update (and prune).
 */
export function withDictProgress(
  dictName: string,
  scenes: SceneSummary[],
  updater: (progress: DictProgress) => DictProgress
): DictProgress {
  const root = loadProgressRoot()
  const current = pruneDictProgress(
    root.byDict[dictName] ?? emptyDictProgress(),
    scenes
  )
  const next = pruneDictProgress(updater(current), scenes)
  root.byDict[dictName] = next
  saveProgressRoot(root)
  return next
}

export function readDictProgress(
  dictName: string,
  scenes: SceneSummary[]
): DictProgress {
  const root = loadProgressRoot()
  const pruned = pruneDictProgress(
    root.byDict[dictName] ?? emptyDictProgress(),
    scenes
  )
  // Persist prune so bad data does not reappear
  const prev = root.byDict[dictName]
  if (JSON.stringify(prev ?? null) !== JSON.stringify(pruned)) {
    root.byDict[dictName] = pruned
    saveProgressRoot(root)
  }
  return pruned
}

export function scenesToSummary(
  list: { id: string; sentences: { length: number } }[]
): SceneSummary[] {
  return list.map(s => ({ id: s.id, sentenceCount: s.sentences.length }))
}
