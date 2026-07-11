import { describe, it, expect } from 'vitest'
import { scenes, getScene, getActiveDictInfo } from './scenes'

describe('scenes data layer', () => {
  it('应该能从 active/ 加载场景数据', () => {
    expect(scenes.length).toBeGreaterThan(0)
  })

  it('每个场景都应该有正确的结构', () => {
    scenes.forEach(scene => {
      expect(scene).toHaveProperty('id')
      expect(scene).toHaveProperty('name')
      expect(scene).toHaveProperty('sentences')
      expect(Array.isArray(scene.sentences)).toBe(true)
      expect(scene.sentences.length).toBeGreaterThan(0)

      scene.sentences.forEach(sentence => {
        expect(sentence).toHaveProperty('en')
        expect(sentence).toHaveProperty('zh')
      })
    })
  })

  it('应该按文件名字母顺序排序', () => {
    // 验证排序是稳定的字母顺序（不依赖具体词典内容）
    for (let i = 1; i < scenes.length; i++) {
      expect(scenes[i].id.localeCompare(scenes[i - 1].id)).toBeGreaterThanOrEqual(0)
    }
  })

  it('getScene 应该能根据加载数据中的 id 正确获取场景', () => {
    // 使用实际加载的第一个场景进行测试（数据无关）
    const firstScene = scenes[0]
    const fetched = getScene(firstScene.id)

    expect(fetched).toBeDefined()
    expect(fetched?.name).toBe(firstScene.name)
    expect(fetched?.sentences.length).toBeGreaterThan(0)
  })

  it('getScene 对不存在的 id 应该返回 undefined', () => {
    expect(getScene('non-existent')).toBeUndefined()
    expect(getScene('')).toBeUndefined()
    expect(getScene('this-id-does-not-exist-xyz')).toBeUndefined()
  })

  it('scenes 列表不包含 active-dict meta', () => {
    expect(scenes.some(s => s.id === 'active-dict')).toBe(false)
  })

  it('getActiveDictInfo 在 meta 存在时返回 name 与 sceneCount', () => {
    const info = getActiveDictInfo()
    expect(info).not.toBeNull()
    expect(info!.name.length).toBeGreaterThan(0)
    expect(info!.sceneCount).toBe(scenes.length)
    expect(typeof info!.switchedAt).toBe('string')
  })
})
