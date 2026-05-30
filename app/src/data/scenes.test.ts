import { describe, it, expect } from 'vitest'
import { scenes, getScene } from './scenes'

describe('scenes data layer', () => {
  it('应该加载所有 10 个场景', () => {
    expect(scenes).toHaveLength(10)
  })

  it('场景顺序应符合预期（日常对话排第一）', () => {
    expect(scenes[0].id).toBe('daily-life')
    expect(scenes[0].name).toBe('日常对话')

    expect(scenes[9].id).toBe('place')
    expect(scenes[9].name).toBe('地点与方向')
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

  it('getScene 应该能根据 id 正确获取场景', () => {
    const dailyLife = getScene('daily-life')
    expect(dailyLife).toBeDefined()
    expect(dailyLife?.name).toBe('日常对话')
    expect(dailyLife?.sentences).toHaveLength(10)
  })

  it('getScene 对不存在的 id 应该返回 undefined', () => {
    expect(getScene('non-existent')).toBeUndefined()
    expect(getScene('')).toBeUndefined()
    expect(getScene('daily-life-extra')).toBeUndefined()
  })

  it('所有场景的句子数量都应该是 10 条', () => {
    scenes.forEach(scene => {
      expect(scene.sentences).toHaveLength(10)
    })
  })
})
