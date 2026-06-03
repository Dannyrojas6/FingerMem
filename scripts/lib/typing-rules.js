/**
 * 与 app/src/utils/typing.ts 保持一致（校验脚本不可 import TS）
 */

function cleanTarget(text) {
  return text.replace(/[.,!?;:"']$/, '');
}

function getEffectiveLength(sentenceEn) {
  return cleanTarget(sentenceEn).length;
}

module.exports = {
  cleanTarget,
  getEffectiveLength,
};