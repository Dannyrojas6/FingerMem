#!/usr/bin/env node

/**
 * 词典校验（Gate 0 + Gate 2）
 *
 * Gate 0: scenes/ 结构、场景 JSON schema、word-index 与场景交叉引用
 * Gate 2: 覆盖率与阶段递进启发式（需 word-index.json）
 * Gate 1（构建）: 请用 npm run check-dict 或手动 npm run build
 *
 * 用法:
 *   node scripts/validate-dict.js [dict-name]
 *   npm run validate-dict -- basic-850-cognitive
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DICTS_DIR = path.join(ROOT_DIR, 'dicts');
const SCENES_SUBDIR = 'scenes';
const SCENE_FILE_RE = /^(\d{2})-([a-z0-9-]+)\.json$/;

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function getScenesDir(dictName) {
  return path.join(DICTS_DIR, dictName, SCENES_SUBDIR);
}

function sceneIdFromFile(filename) {
  const m = filename.match(SCENE_FILE_RE);
  return m ? `${m[1]}-${m[2]}` : null;
}

function scenePhase(sceneId) {
  const n = parseInt(sceneId.slice(0, 2), 10);
  if (n >= 1 && n <= 10) return 1;
  if (n >= 11 && n <= 41) return 2;
  if (n >= 42 && n <= 53) return 3;
  return 0;
}

const PAST_RE =
  /\b(was|were|had|did|went|came|said|thought|knew|made|got|took|put|kept|let|sent|stayed|saw|wanted|could|would|should)\b|\b\w+ed\b/i;
const NEG_RE = /\b(not|n't|no)\b/i;
const QUESTION_RE = /^\s*(who|what|where|when|why|how|is|are|am|was|were|do|does|did|can|will|may)\b/i;

function loadSceneFiles(dictName) {
  const scenesDir = getScenesDir(dictName);
  if (!fs.existsSync(scenesDir)) {
    err(`缺少目录: ${scenesDir}`);
    return null;
  }

  const files = fs.readdirSync(scenesDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    err(`scenes/ 下没有 .json 场景文件`);
    return null;
  }

  const scenes = new Map();

  for (const file of files.sort()) {
    const id = sceneIdFromFile(file);
    if (!id) {
      err(`场景文件名不符合 NN-slug.json: ${file}`);
      continue;
    }
    if (scenes.has(id)) {
      err(`重复场景 id: ${id}`);
      continue;
    }

    const fullPath = path.join(scenesDir, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (e) {
      err(`${file}: JSON 解析失败 — ${e.message}`);
      continue;
    }

    if (typeof data.name !== 'string' || !data.name.trim()) {
      err(`${file}: 缺少非空 name`);
    }
    if (!Array.isArray(data.sentences)) {
      err(`${file}: sentences 必须是数组`);
      scenes.set(id, { file, data: null, sentences: [] });
      continue;
    }

    data.sentences.forEach((s, i) => {
      if (!s || typeof s.en !== 'string' || !s.en.trim()) {
        err(`${file}: sentences[${i}] 缺少 en`);
      }
      if (!s || typeof s.zh !== 'string' || !s.zh.trim()) {
        err(`${file}: sentences[${i}] 缺少 zh`);
      }
    });

    scenes.set(id, {
      file,
      data,
      sentences: data.sentences || [],
      phase: scenePhase(id),
    });
  }

  return scenes;
}

function validateWordIndex(dictName, sceneIds) {
  const indexPath = path.join(DICTS_DIR, dictName, 'word-index.json');
  if (!fs.existsSync(indexPath)) {
    warn('无 word-index.json，跳过 Gate 2 覆盖率检查');
    return null;
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    err(`word-index.json 解析失败: ${e.message}`);
    return null;
  }

  const words = Object.keys(index);
  if (words.length === 0) {
    err('word-index.json 为空');
    return null;
  }

  let zeroAppear = 0;
  let singleAppear = 0;
  let badSceneRef = 0;
  let badIntroduced = 0;

  for (const word of words) {
    const entry = index[word];
    if (!entry || typeof entry !== 'object') {
      err(`word-index: "${word}" 条目无效`);
      continue;
    }

    const appears = Array.isArray(entry.appears_in) ? entry.appears_in : [];
    if (appears.length === 0) {
      zeroAppear++;
      err(`word-index: "${word}" appears_in 为空`);
    } else if (appears.length === 1) {
      singleAppear++;
    }

    for (const sid of appears) {
      if (!sceneIds.has(sid)) {
        badSceneRef++;
        err(`word-index: "${word}" 引用不存在的场景 "${sid}"`);
      }
    }

    if (entry.introduced_in) {
      if (!sceneIds.has(entry.introduced_in)) {
        badIntroduced++;
        err(`word-index: "${word}" introduced_in 无效场景 "${entry.introduced_in}"`);
      } else if (!appears.includes(entry.introduced_in)) {
        err(`word-index: "${word}" introduced_in 不在 appears_in 中`);
      }
    }
  }

  // 场景是否在 index 中有词「引入」
  const introducedScenes = new Set(
    words.map(w => index[w].introduced_in).filter(Boolean)
  );
  for (const sid of sceneIds) {
    if (!introducedScenes.has(sid)) {
      warn(`场景 ${sid} 没有词 marked introduced_in（可能正常，仅提示）`);
    }
  }

  return {
    wordCount: words.length,
    zeroAppear,
    singleAppear,
    badSceneRef,
    badIntroduced,
  };
}

function validatePhaseHeuristics(scenes) {
  for (const [id, scene] of scenes) {
    if (!scene.data) continue;
    const texts = scene.sentences.map(s => s.en || '');
    const hasPast = texts.some(t => PAST_RE.test(t));
    const hasNeg = texts.some(t => NEG_RE.test(t));
    const hasQ = texts.some(t => QUESTION_RE.test(t) || t.includes('?'));

    if (scene.phase === 1) {
      if (hasPast) warn(`${id}: Phase1 句子含过去时痕迹（启发式）`);
      if (hasNeg) warn(`${id}: Phase1 句子含否定（启发式）`);
      if (hasQ) warn(`${id}: Phase1 句子含疑问（启发式）`);
    }
    if (scene.phase === 3 && !hasPast) {
      warn(`${id}: Phase3 未检测到过去时痕迹（启发式，可能漏检）`);
    }
  }
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
    console.log(`每场景句数: min ${counts[0]}, max ${counts[counts.length - 1]}, avg ${(totalSentences / counts.length).toFixed(1)}`);
  }
  if (indexStats) {
    console.log(`word-index 词条: ${indexStats.wordCount}`);
    console.log(`仅出现 1 个场景的词: ${indexStats.singleAppear}（警告级）`);
  }
}

function main() {
  const dictName = process.argv[2] || 'basic-850-cognitive';
  const dictDir = path.join(DICTS_DIR, dictName);

  if (!fs.existsSync(dictDir)) {
    console.error(`[validate-dict] 词典不存在: ${dictName}`);
    process.exit(1);
  }

  console.log(`[validate-dict] Gate 0+2 → ${dictName}`);

  const scenes = loadSceneFiles(dictName);
  if (!scenes) {
    reportAndExit();
    return;
  }

  const sceneIds = new Set(scenes.keys());
  const indexStats = validateWordIndex(dictName, sceneIds);
  validatePhaseHeuristics(scenes);

  printSummary(dictName, scenes, indexStats);
  reportAndExit();
}

function reportAndExit() {
  if (warnings.length) {
    console.log(`\n警告 (${warnings.length}):`);
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
  if (errors.length) {
    console.log(`\n错误 (${errors.length}):`);
    errors.forEach(e => console.log(`  ✗ ${e}`));
    console.error('\n[validate-dict] 未通过');
    process.exit(1);
  }
  console.log('\n[validate-dict] Gate 0+2 通过');
  process.exit(0);
}

main();