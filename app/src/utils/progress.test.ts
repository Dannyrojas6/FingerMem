import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  type DictProgress,
  type SceneSummary,
  emptyDictProgress,
  pruneDictProgress,
  resolveContinueTarget,
  markSentenceComplete,
  setLastPosition,
  getSceneCompletedCount,
  formatSceneProgressTrailing,
  loadProgressRoot,
  saveProgressRoot,
  withDictProgress,
} from './progress'

const scene = (id: string, n: number): SceneSummary => ({
  id,
  sentenceCount: n,
})

const scenes: SceneSummary[] = [scene('01-alpha', 3), scene('02-beta', 2)]

describe('pruneDictProgress', () => {
  it('drops missing scenes and out-of-range completed indices', () => {
    const input: DictProgress = {
      lastPosition: { sceneId: 'gone', sentenceIndex: 0 },
      completed: {
        '01-alpha': [0, 2, 9],
        gone: [0],
      },
    }
    const pruned = pruneDictProgress(input, scenes)
    expect(pruned.lastPosition).toBeNull()
    expect(pruned.completed['01-alpha']).toEqual([0, 2])
    expect(pruned.completed.gone).toBeUndefined()
  })

  it('clamps lastPosition index into range', () => {
    const input: DictProgress = {
      lastPosition: { sceneId: '01-alpha', sentenceIndex: 99 },
      completed: {},
    }
    const pruned = pruneDictProgress(input, scenes)
    expect(pruned.lastPosition).toEqual({
      sceneId: '01-alpha',
      sentenceIndex: 2,
    })
  })
})

describe('resolveContinueTarget', () => {
  it('returns same index when breakpoint sentence incomplete', () => {
    const p: DictProgress = {
      lastPosition: { sceneId: '01-alpha', sentenceIndex: 1 },
      completed: { '01-alpha': [0] },
    }
    expect(resolveContinueTarget(p, scenes)).toEqual({
      sceneId: '01-alpha',
      sentenceIndex: 1,
    })
  })

  it('advances to next incomplete after completed breakpoint', () => {
    const p: DictProgress = {
      lastPosition: { sceneId: '01-alpha', sentenceIndex: 0 },
      completed: { '01-alpha': [0] },
    }
    expect(resolveContinueTarget(p, scenes)).toEqual({
      sceneId: '01-alpha',
      sentenceIndex: 1,
    })
  })

  it('returns null when scene fully complete', () => {
    const p: DictProgress = {
      lastPosition: { sceneId: '01-alpha', sentenceIndex: 2 },
      completed: { '01-alpha': [0, 1, 2] },
    }
    expect(resolveContinueTarget(p, scenes)).toBeNull()
  })

  it('finds earlier incomplete when later ones are done', () => {
    const p: DictProgress = {
      lastPosition: { sceneId: '01-alpha', sentenceIndex: 2 },
      completed: { '01-alpha': [1, 2] },
    }
    expect(resolveContinueTarget(p, scenes)).toEqual({
      sceneId: '01-alpha',
      sentenceIndex: 0,
    })
  })
})

describe('markSentenceComplete', () => {
  it('is idempotent and sorted unique', () => {
    let p = emptyDictProgress()
    p = markSentenceComplete(p, '01-alpha', 1)
    p = markSentenceComplete(p, '01-alpha', 1)
    p = markSentenceComplete(p, '01-alpha', 0)
    expect(p.completed['01-alpha']).toEqual([0, 1])
  })
})

describe('setLastPosition', () => {
  it('sets position', () => {
    const p = setLastPosition(emptyDictProgress(), '02-beta', 1)
    expect(p.lastPosition).toEqual({ sceneId: '02-beta', sentenceIndex: 1 })
  })
})

describe('formatSceneProgressTrailing', () => {
  it('formats x/y', () => {
    expect(formatSceneProgressTrailing(2, 5)).toBe('2/5')
  })
})

describe('getSceneCompletedCount', () => {
  it('counts completed for scene', () => {
    const p: DictProgress = {
      lastPosition: null,
      completed: { '01-alpha': [0, 2] },
    }
    expect(getSceneCompletedCount(p, '01-alpha')).toBe(2)
  })
})

function mockStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
  }
}

describe('storage + withDictProgress', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockStorage())
  })

  it('isolates two dictionaries', () => {
    withDictProgress('dict-a', scenes, p =>
      markSentenceComplete(setLastPosition(p, '01-alpha', 0), '01-alpha', 0)
    )
    withDictProgress('dict-b', scenes, p => setLastPosition(p, '02-beta', 1))

    const root = loadProgressRoot()
    expect(root.byDict['dict-a'].completed['01-alpha']).toEqual([0])
    expect(root.byDict['dict-b'].lastPosition).toEqual({
      sceneId: '02-beta',
      sentenceIndex: 1,
    })
    expect(root.byDict['dict-b'].completed['01-alpha']).toBeUndefined()
  })

  it('persists prune on load path via withDictProgress read', () => {
    saveProgressRoot({
      version: 1,
      byDict: {
        d: {
          lastPosition: { sceneId: 'gone', sentenceIndex: 0 },
          completed: { '01-alpha': [0, 99] },
        },
      },
    })
    const snapshot = withDictProgress('d', scenes, p => p)
    expect(snapshot.lastPosition).toBeNull()
    expect(snapshot.completed['01-alpha']).toEqual([0])
  })
})
