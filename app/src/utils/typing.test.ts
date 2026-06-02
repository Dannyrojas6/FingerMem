import { describe, it, expect } from 'vitest'
import {
  clampInputToEffectiveLength,
  cleanTarget,
  getEffectiveLength,
  getMatchedPrefixLength,
  isUnexpectedInputJump,
  isInputComplete,
} from './typing'

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

describe('isUnexpectedInputJump', () => {
  it('允许单字符追加或删除', () => {
    expect(isUnexpectedInputJump('How are', 'How are ')).toBe(false)
    expect(isUnexpectedInputJump('How are ', 'How are')).toBe(false)
  })

  it('拒绝一次追加多个字符（自动补全）', () => {
    expect(isUnexpectedInputJump('How are', 'How are you today')).toBe(true)
  })
})

describe('clampInputToEffectiveLength', () => {
  it('应截断超出有效长度的输入', () => {
    const target = 'Hello world'
    expect(clampInputToEffectiveLength('Hello world!!!', target)).toBe('Hello world')
    expect(clampInputToEffectiveLength('Hello', target)).toBe('Hello')
  })

  it('getEffectiveLength 与 cleanTarget 长度一致', () => {
    expect(getEffectiveLength('What time is it now?')).toBe(cleanTarget('What time is it now?').length)
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

describe('isInputComplete', () => {
  const target = 'Hello world'

  it('D1/D4: does not auto-complete or synthesize characters', () => {
    expect(isInputComplete('Hello world ', target)).toBe(true) // trailing space is trimmed
    expect(isInputComplete('Hello world  ', target)).toBe(true)
  })

  it('D2: correction on the final character works', () => {
    expect(isInputComplete('Hello worl', target)).toBe(false)
    expect(isInputComplete('Hello world', target)).toBe(true)
  })

  it('D3: multiple trailing spaces are handled predictably', () => {
    expect(isInputComplete('Hello world   ', target)).toBe(true)
  })

  it('respects cleanTarget for trailing punctuation', () => {
    expect(isInputComplete('Hello world.', target)).toBe(true)
  })

  it('错误输入加超长后缀不能误判为完成', () => {
    const wrong = 'Xxxx xxxx xxxx'
    expect(isInputComplete(wrong + '     ', target)).toBe(false)
  })

  describe('Regression: historical bugs', () => {
    const target = 'Thank you very much for your help'

    it('Bug 1: rapid trailing spaces must not cause auto-completion or unwanted auto-advance', () => {
      // Simulate user rapidly pressing space at the end
      expect(isInputComplete('Thank you very much for your help ', target)).toBe(true)
      expect(isInputComplete('Thank you very much for your help  ', target)).toBe(true)
      // The engine should never "fill in" missing characters on its own
    })

    it('Bug 2: error on last character + delete + correct retype must allow completion', () => {
      const almost = 'Thank you very much for your hel'
      expect(isInputComplete(almost + 'p', target)).toBe(true)  // correct retype
      expect(isInputComplete(almost + 'x', target)).toBe(false)
      expect(isInputComplete(almost + 'p', target)).toBe(true)  // still works after error path
    })
  })
})
