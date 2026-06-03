#!/usr/bin/env node

/**
 * 词典校验：结构 · 索引 · 练习（阶段提示仅 warn）
 *
 * 用法:
 *   node scripts/validate-dict.js [dict-name]
 *   npm run validate-dict
 *   npm run validate-dict -- basic-850-cognitive
 */

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_DICT,
  getDictDir,
  isArchivedDictName,
  assertActiveDictName,
} = require('./lib/config');
const { loadSceneFiles } = require('./lib/scenes');
const { getEffectiveLength } = require('./lib/typing-rules');
const {
  hasMultipleSentences,
  isPracticeLengthExceeded,
  MAX_EFFECTIVE_LENGTH,
} = require('./lib/practice-rules');

const SECTIONS = ['结构', '索引', '练习'];
const errors = [];
const hints = [];

function err(section, msg) {
  errors.push({ section, msg });
}

function hint(msg) {
  hints.push(msg);
}

const PAST_RE =
  /\b(was|were|had|did|went|came|said|thought|knew|made|got|took|put|kept|let|sent|stayed|saw|wanted|could|would|should)\b|\b\w+ed\b/i;
const NEG_RE = /\b(not|n't|no)\b/i;
const QUESTION_RE =
  /^\s*(who|what|where|when|why|how|is|are|am|was|were|do|does|did|can|will|may)\b/i;

function validateIndex(dictName, sceneIds) {
  const indexPath = path.join(getDictDir(dictName), 'word-index.json');
  if (!fs.existsSync(indexPath)) {
    hint('无 word-index.json，已跳过索引硬检查');
    return null;
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    err('索引', `word-index.json 解析失败: ${e.message}`);
    return null;
  }

  const words = Object.keys(index);
  if (words.length === 0) {
    err('索引', 'word-index.json 为空');
    return null;
  }

  let singleAppear = 0;

  for (const word of words) {
    const entry = index[word];
    if (!entry || typeof entry !== 'object') {
      err('索引', `word-index: "${word}" 条目无效`);
      continue;
    }

    const appears = Array.isArray(entry.appears_in) ? entry.appears_in : [];
    if (appears.length === 0) {
      err('索引', `word-index: "${word}" appears_in 为空`);
    } else if (appears.length === 1) {
      singleAppear++;
    }

    for (const sid of appears) {
      if (!sceneIds.has(sid)) {
        err('索引', `word-index: "${word}" 引用不存在的场景 "${sid}"`);
      }
    }

    if (entry.introduced_in) {
      if (!sceneIds.has(entry.introduced_in)) {
        err('索引', `word-index: "${word}" introduced_in 无效场景 "${entry.introduced_in}"`);
      } else if (!appears.includes(entry.introduced_in)) {
        err('索引', `word-index: "${word}" introduced_in 不在 appears_in 中`);
      }
    }
  }

  const introducedScenes = new Set(
    words.map(w => index[w].introduced_in).filter(Boolean)
  );
  for (const sid of sceneIds) {
    if (!introducedScenes.has(sid)) {
      hint(`场景 ${sid} 没有词 marked introduced_in（可能正常）`);
    }
  }

  return { wordCount: words.length, singleAppear };
}

function validatePhaseHints(scenes) {
  for (const [id, scene] of scenes) {
    if (!scene.data) continue;
    const texts = scene.sentences.map(s => s.en || '');
    const hasPast = texts.some(t => PAST_RE.test(t));
    const hasNeg = texts.some(t => NEG_RE.test(t));
    const hasQ = texts.some(t => QUESTION_RE.test(t) || t.includes('?'));

    if (scene.phase === 1) {
      if (hasPast) hint(`${id}: Phase1 句子含过去时痕迹（启发式）`);
      if (hasNeg) hint(`${id}: Phase1 句子含否定（启发式）`);
      if (hasQ) hint(`${id}: Phase1 句子含疑问（启发式）`);
    }
    if (scene.phase === 3 && !hasPast) {
      hint(`${id}: Phase3 未检测到过去时痕迹（启发式，可能漏检）`);
    }
  }
}

function validatePractice(scenes) {
  for (const [id, scene] of scenes) {
    if (!scene.data) continue;
    scene.sentences.forEach((s, i) => {
      const en = (s && s.en) || '';
      if (!en.trim()) return;

      if (hasMultipleSentences(en)) {
        err('练习', `${id} sentences[${i}]: 一条 en 只能对应一个练习句`);
      }
      if (isPracticeLengthExceeded(en)) {
        err(
          '练习',
          `${id} sentences[${i}]: 有效长度 ${getEffectiveLength(en)}，须 < ${MAX_EFFECTIVE_LENGTH}（与练习页一致，去句末标点）`
        );
      }
    });
  }
}

function sectionStatus(name) {
  const n = errors.filter(e => e.section === name).length;
  return n === 0 ? '通过' : `未通过（${n}）`;
}

function printSummary(dictName, scenes, indexStats) {
  let totalSentences = 0;
  const counts = [];
  for (const scene of scenes.values()) {
    counts.push(scene.sentences.length);
    totalSentences += scene.sentences.length;
  }
  counts.sort((a, b) => a - b);

  console.log('\n--- 摘要 ---');
  console.log(`词典: ${dictName}`);
  console.log(`场景数: ${scenes.size}`);
  console.log(`句子总数: ${totalSentences}`);
  if (counts.length) {
    console.log(
      `每场景句数: min ${counts[0]}, max ${counts[counts.length - 1]}, avg ${(totalSentences / counts.length).toFixed(1)}`
    );
  }
  if (indexStats) {
    console.log(`word-index 词条: ${indexStats.wordCount}`);
    console.log(`仅出现 1 个场景的词: ${indexStats.singleAppear}`);
  }
}

function reportAndExit() {
  console.log('');
  for (const name of SECTIONS) {
    console.log(`${name} … ${sectionStatus(name)}`);
  }
  if (hints.length) {
    console.log(`阶段提示 … ${hints.length} 条（不阻断）`);
  }

  if (hints.length) {
    console.log('\n阶段提示:');
    hints.forEach(h => console.log(`  ⚠ ${h}`));
  }

  if (errors.length) {
    console.log('\n错误:');
    for (const name of SECTIONS) {
      const list = errors.filter(e => e.section === name);
      if (list.length === 0) continue;
      console.log(`  [${name}]`);
      list.forEach(e => console.log(`    ✗ ${e.msg}`));
    }
    console.error('\n[validate-dict] 校验未通过');
    process.exit(1);
  }

  console.log('\n[validate-dict] 校验通过（结构 · 索引 · 练习）');
  process.exit(0);
}

function main() {
  const dictName = process.argv[2] || DEFAULT_DICT;

  if (isArchivedDictName(dictName)) {
    console.error(`[validate-dict] 归档词典不参与校验: ${dictName}`);
    process.exit(1);
  }

  try {
    assertActiveDictName(dictName);
  } catch (e) {
    console.error(`[validate-dict] ${e.message}`);
    process.exit(1);
  }

  const dictDir = getDictDir(dictName);
  if (!fs.existsSync(dictDir)) {
    console.error(`[validate-dict] 词典不存在: ${dictName}`);
    process.exit(1);
  }

  console.log(`[validate-dict] ${dictName}`);

  const scenes = loadSceneFiles(dictName, { onError: err, onWarn: hint });
  if (!scenes) {
    reportAndExit();
    return;
  }

  const sceneIds = new Set(scenes.keys());
  const indexStats = validateIndex(dictName, sceneIds);
  validatePractice(scenes);
  validatePhaseHints(scenes);

  printSummary(dictName, scenes, indexStats);
  reportAndExit();
}

main();