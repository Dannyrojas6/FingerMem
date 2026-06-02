/**
 * Typing exercise core utility functions.
 * These are pure functions to make them easy to test.
 *
 * Philosophy (Phase 1): Completion is a simple normalized exact match.
 * We do not use "anti-cheat" rules. The goal is reliable, natural behavior for learning.
 */

/**
 * 去除句子末尾的标点符号（用于匹配和完成判断）
 */
export function cleanTarget(text: string): string {
  return text.replace(/[.,!?;:"']$/, '')
}

/**
 * 可输入区域长度（不含句末标点）。与 Practice 渲染的有效字符数一致。
 */
export function getEffectiveLength(sentenceEn: string): number {
  return cleanTarget(sentenceEn).length
}

/**
 * 丢弃超出有效长度的输入（含句末标点之后的键入）。
 */
export function clampInputToEffectiveLength(input: string, effectiveTarget: string): string {
  return input.slice(0, effectiveTarget.length)
}

/** 单次输入长度突变（浏览器自动补全/连字），不应写入练习状态 */
export function isUnexpectedInputJump(
  previousInput: string,
  nextInput: string,
  maxAppend = 1
): boolean {
  return nextInput.length > previousInput.length + maxAppend
}

/**
 * 计算当前输入和目标匹配的最长正确前缀长度（逐字符严格匹配）
 */
export function getMatchedPrefixLength(input: string, target: string): number {
  const maxLen = Math.min(input.length, target.length)
  let match = 0
  for (let i = 0; i < maxLen; i++) {
    if (input[i] === target[i]) {
      match++
    } else {
      break
    }
  }
  return match
}

/**
 * Returns whether the user's input (after normalization) exactly matches the target.
 *
 * This is the single source of truth for sentence completion in Phase 1.
 *
 * Normalization rules (kept minimal for predictability):
 * - Trim trailing whitespace
 * - Remove one trailing punctuation mark (via cleanTarget)
 */
export function isInputComplete(input: string, target: string): boolean {
  const clamped = clampInputToEffectiveLength(input, target)
  const normalizedInput = cleanTarget(clamped.trimEnd())
  if (normalizedInput !== target) return false
  return getMatchedPrefixLength(clamped, target) === target.length
}
