import { describe, it, expect } from 'vitest'
import { cleanTarget, getMatchedPrefixLength, isSentenceCompleted } from './typing'

describe('cleanTarget', () => {
  it('应该移除末尾的常见标点', () => {
    expect(cleanTarget('Hello.')).toBe('Hello')
    expect(cleanTarget('How are you?')).toBe('How are you')
    expect(cleanTarget('Great!')).toBe('Great')
    expect(cleanTarget('Yes,')).toBe('Yes')
    expect(cleanTarget('He said "Hi"')).toBe('He said "Hi')
  })

  it('没有标点时应保持不变', () => {
    expect(cleanTarget('Hello')).toBe('Hello')
    expect(cleanTarget('What is this')).toBe('What is this')
  })

  it('空字符串应返回空字符串', () => {
    expect(cleanTarget('')).toBe('')
  })
})

describe('getMatchedPrefixLength', () => {
  it('应该返回正确的前缀匹配长度', () => {
    expect(getMatchedPrefixLength('Hello', 'Hello world')).toBe(5)
    expect(getMatchedPrefixLength('Hel', 'Hello')).toBe(3)
    expect(getMatchedPrefixLength('', 'Hello')).toBe(0)
    expect(getMatchedPrefixLength('Hello', 'Hello')).toBe(5)
  })

  it('在第一个不匹配字符处停止', () => {
    expect(getMatchedPrefixLength('Hella', 'Hello')).toBe(4) // 第5个字符 'a' != 'o'
    expect(getMatchedPrefixLength('Hxllo', 'Hello')).toBe(1)
  })

  it('输入比目标长时只匹配到目标长度', () => {
    expect(getMatchedPrefixLength('Hello world', 'Hello')).toBe(5)
  })
})

describe('isSentenceCompleted', () => {
  const target = 'Hello world'

  it('完全匹配且最后字符不是空格时返回 true', () => {
    expect(isSentenceCompleted('Hello world', target)).toBe(true)
    expect(isSentenceCompleted('Hello world.', target)).toBe(false) // 标点未清理的情况（实际使用中会先 clean）
  })

  it('最后输入是空格时返回 false（防作弊）', () => {
    expect(isSentenceCompleted('Hello world ', target)).toBe(false)
    expect(isSentenceCompleted('Hello world  ', target)).toBe(false)
  })

  it('内容不完全匹配时返回 false', () => {
    expect(isSentenceCompleted('Hello worl', target)).toBe(false)
    expect(isSentenceCompleted('Hello world!', target)).toBe(false) // 标点不同
  })

  it('空输入时返回 false', () => {
    expect(isSentenceCompleted('', target)).toBe(false)
  })
})
