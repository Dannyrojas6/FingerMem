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
  const normalizedInput = cleanTarget(input.trimEnd());
  return normalizedInput === target;
}

/**
 * @deprecated Use `isInputComplete` instead.
 * This function previously contained "strict anti-cheat" logic that has been removed.
 * It now delegates to the new simple completion rule.
 */
export function isSentenceCompleted(value: string, effectiveTarget: string): boolean {
  // Temporary bridge during migration. Will be removed after all callers are updated.
  return isInputComplete(value, effectiveTarget);
}
