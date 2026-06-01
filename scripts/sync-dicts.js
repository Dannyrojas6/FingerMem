#!/usr/bin/env node

/**
 * 词典切换脚本
 *
 * 功能：将 dicts/<name>/ 下的场景数据复制到 app/src/data/dicts/active/ 作为当前激活词典。
 * 应用始终只从 active/ 加载数据，实现词典的脚本化切换。
 *
 * 使用方式：
 *   - 列出可用词典 + 当前激活状态：
 *       node scripts/sync-dicts.js
 *       npm run sync-dicts
 *
 *   - 切换到指定词典：
 *       npm run sync-dicts basic-english-850-words
 *       npm run sync-dicts basic-850
 *
 * 要求：目标词典文件夹下至少包含一个 .json 场景文件。
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DICTS_DIR = path.join(ROOT_DIR, 'dicts');
const ACTIVE_DIR = path.join(ROOT_DIR, 'app', 'src', 'data', 'dicts', 'active');
const MARKER_FILE = path.join(ACTIVE_DIR, '.active-dict.json');

function log(message) {
  console.log(`[sync-dicts] ${message}`);
}

function error(message) {
  console.error(`[sync-dicts] 错误：${message}`);
  process.exit(1);
}

/**
 * 获取所有有效词典（包含至少一个 .json 文件的文件夹）
 */
function getAvailableDicts() {
  if (!fs.existsSync(DICTS_DIR)) return [];

  return fs.readdirSync(DICTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      const dirPath = path.join(DICTS_DIR, name);
      try {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        return files.length > 0;
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * 读取当前激活词典信息
 */
function getCurrentActive() {
  if (!fs.existsSync(MARKER_FILE)) return null;
  try {
    const content = fs.readFileSync(MARKER_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 切换到指定词典
 */
function switchToDict(dictName) {
  const sourceDir = path.join(DICTS_DIR, dictName);

  if (!fs.existsSync(sourceDir)) {
    const available = getAvailableDicts().join(', ');
    error(`词典不存在: ${dictName}\n可用词典: ${available || '(无)'}`);
  }

  const jsonFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
  if (jsonFiles.length === 0) {
    error(`词典 "${dictName}" 下没有找到任何 .json 场景文件`);
  }

  // 确保 active 目录存在
  if (!fs.existsSync(ACTIVE_DIR)) {
    fs.mkdirSync(ACTIVE_DIR, { recursive: true });
  }

  // 清空 active 目录中的旧数据（.json 和标记文件）
  const existing = fs.readdirSync(ACTIVE_DIR);
  for (const file of existing) {
    if (file.endsWith('.json') || file === '.active-dict.json') {
      fs.unlinkSync(path.join(ACTIVE_DIR, file));
    }
  }

  // 复制新的场景文件
  for (const file of jsonFiles) {
    const src = path.join(sourceDir, file);
    const dest = path.join(ACTIVE_DIR, file);
    fs.copyFileSync(src, dest);
  }

  // 写入标记文件
  const marker = {
    name: dictName,
    sceneCount: jsonFiles.length,
    switchedAt: new Date().toISOString()
  };
  fs.writeFileSync(MARKER_FILE, JSON.stringify(marker, null, 2));

  log(`切换成功：${dictName}（${jsonFiles.length} 个场景）`);
  log(`数据已更新到 ${ACTIVE_DIR}`);
  log('提示：请重启开发服务器或刷新浏览器以加载新数据。');
}

/**
 * 列出可用词典和当前状态
 */
function listDicts() {
  const available = getAvailableDicts();
  const current = getCurrentActive();

  console.log('\n可用词典：');
  if (available.length === 0) {
    console.log('  (暂无包含 .json 场景文件的词典)');
  } else {
    available.forEach(name => {
      console.log(`  - ${name}`);
    });
  }

  if (current) {
    console.log(`\n当前激活：${current.name}（${current.sceneCount} 场景）`);
    console.log(`切换时间：${current.switchedAt}`);
  } else {
    console.log('\n当前没有激活的词典（active/ 目录为空或标记文件不存在）');
  }

  console.log('\n切换命令示例：');
  console.log('  npm run sync-dicts basic-english-850-words');
  console.log('  npm run sync-dicts basic-850\n');
}

// ==================== 主入口 ====================

const args = process.argv.slice(2);
const dictName = args[0];

if (!dictName) {
  listDicts();
} else {
  switchToDict(dictName);
}
