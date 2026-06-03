const { getEffectiveLength } = require('./typing-rules');

const MAX_EFFECTIVE_LENGTH = 50;

/** 句号前常见缩写（偏严多句检测的例外） */
const ABBREV_BEFORE_DOT =
  /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|U\.S|A\.M|P\.M|i\.e|e\.g)\.$/i;

/**
 * 去掉引号内正文，避免引语中的 ". She" 误判为第二句
 */
function maskQuotedSpans(text) {
  return text
    .replace(/'[^']*'/g, match => match.replace(/\./g, '\u0001'))
    .replace(/"[^"]*"/g, match => match.replace(/\./g, '\u0001'));
}

function isAbbreviationPeriod(text, dotIndex) {
  const before = text.slice(0, dotIndex + 1);
  const tail = before.slice(Math.max(0, before.length - 14));
  if (ABBREV_BEFORE_DOT.test(tail)) return true;
  if (/\b[A-Z]\.$/.test(tail)) return true;
  return false;
}

/**
 * 一条 en 是否含多个练习句（偏严）
 */
function hasMultipleSentences(en) {
  const raw = en.trim();
  if (!raw) return false;

  const t = maskQuotedSpans(raw);

  if (/\? +[A-Za-z]/.test(t)) return true;
  if (/! +[A-Za-z]/.test(t)) return true;

  let searchFrom = 0;
  while (searchFrom < t.length) {
    const slice = t.slice(searchFrom);
    const rel = slice.search(/\. +[A-Z]/);
    if (rel === -1) break;

    const dotIndex = searchFrom + rel;
    if (!isAbbreviationPeriod(t, dotIndex)) {
      return true;
    }
    searchFrom = dotIndex + 2;
  }

  return false;
}

function isPracticeLengthExceeded(en) {
  return getEffectiveLength(en) >= MAX_EFFECTIVE_LENGTH;
}

module.exports = {
  MAX_EFFECTIVE_LENGTH,
  hasMultipleSentences,
  isPracticeLengthExceeded,
};