/**
 * 打字练习核心工具函数
 * 这些函数是纯函数，便于单元测试
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
 * 判断是否完成当前句子（严格防作弊规则）
 * 必须同时满足：
 * 1. 去掉末尾空格后内容完全等于目标（去除标点后的）
 * 2. 最后输入的字符不能是空格（防止狂按空格把长度顶上去）
 */
export function isSentenceCompleted(value: string, effectiveTarget: string): boolean {
  const trimmedValue = value.trimEnd()
  const lastTypedChar = value.length > 0 ? value[value.length - 1] : ''

  return trimmedValue === effectiveTarget && lastTypedChar !== ' '
}
