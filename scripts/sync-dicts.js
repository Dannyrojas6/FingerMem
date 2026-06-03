#!/usr/bin/env node

/**
 * 将 dicts/<name>/scenes/ 复制到 app/src/data/dicts/active/
 *
 *   npm run sync-dicts                  # 仅 1 个可用词典时自动同步；≥2 个时列出供选择
 *   npm run sync-dicts basic-850-cognitive
 */

const fs = require('fs');
const path = require('path');
const {
  ACTIVE_DIR,
  MARKER_FILE,
  DEFAULT_DICT,
  getDictDir,
  getScenesDir,
  isArchivedDictName,
  assertActiveDictName,
} = require('./lib/config');
const { getAvailableDicts, listSceneJsonFiles } = require('./lib/scenes');

function log(message) {
  console.log(`[sync-dicts] ${message}`);
}

function fail(message) {
  console.error(`[sync-dicts] 错误：${message}`);
  process.exit(1);
}

function getCurrentActive() {
  if (!fs.existsSync(MARKER_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(MARKER_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function switchToDict(dictName) {
  if (isArchivedDictName(dictName)) {
    fail(`归档词典不参与同步: ${dictName}`);
  }

  try {
    assertActiveDictName(dictName);
  } catch (e) {
    fail(e.message);
  }

  const sourceDir = getDictDir(dictName);
  if (!fs.existsSync(sourceDir)) {
    const available = getAvailableDicts().join(', ');
    fail(`词典不存在: ${dictName}\n可用词典: ${available || '(无)'}`);
  }

  const scenesDir = getScenesDir(dictName);
  if (!fs.existsSync(scenesDir)) {
    fail(`词典 "${dictName}" 缺少 scenes/ 目录`);
  }

  const jsonFiles = listSceneJsonFiles(dictName);
  if (jsonFiles.length === 0) {
    fail(`词典 "${dictName}" 的 scenes/ 下没有找到任何 .json 场景文件`);
  }

  if (!fs.existsSync(ACTIVE_DIR)) {
    fs.mkdirSync(ACTIVE_DIR, { recursive: true });
  }

  const existing = fs.readdirSync(ACTIVE_DIR);
  for (const file of existing) {
    if (file.endsWith('.json') || file === '.active-dict.json') {
      fs.unlinkSync(path.join(ACTIVE_DIR, file));
    }
  }

  for (const file of jsonFiles) {
    const src = path.join(scenesDir, file);
    const dest = path.join(ACTIVE_DIR, file);
    fs.copyFileSync(src, dest);
  }

  const marker = {
    name: dictName,
    sceneCount: jsonFiles.length,
    switchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(MARKER_FILE, JSON.stringify(marker, null, 2));

  log(`切换成功：${dictName}（${jsonFiles.length} 个场景）`);
  log(`数据已更新到 ${ACTIVE_DIR}`);
  log('提示：请重启开发服务器或刷新浏览器以加载新数据。');
}

function listDicts() {
  const available = getAvailableDicts();
  const current = getCurrentActive();

  console.log('\n可用词典：');
  if (available.length === 0) {
    console.log('  (暂无)');
  } else {
    available.forEach(name => console.log(`  - ${name}`));
  }

  if (current) {
    console.log(`\n当前激活：${current.name}（${current.sceneCount} 场景）`);
    console.log(`切换时间：${current.switchedAt}`);
  } else {
    console.log('\n当前没有激活的词典');
  }

  console.log(`\n切换示例：npm run sync-dicts ${DEFAULT_DICT}\n`);
}

const dictName = process.argv.slice(2)[0];

if (!dictName) {
  const available = getAvailableDicts();
  if (available.length === 1) {
    switchToDict(available[0]);
  } else {
    listDicts();
    if (available.length === 0) {
      fail('dicts/ 下没有可用的词典（需含 scenes/*.json，且不在 archive/）');
    }
  }
} else {
  switchToDict(dictName);
}