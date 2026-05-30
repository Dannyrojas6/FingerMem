#!/usr/bin/env node

/**
 * 同步脚本：将 dicts/basic-850/ 作为唯一数据源，复制到 app/src/data/dicts/basic-850/
 * 
 * 使用方式：
 *   - 在项目根目录运行：node scripts/sync-dicts.js
 *   - 在 app/ 目录运行：npm run sync-dicts
 * 
 * 每次修改场景句子后，必须执行本脚本。
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'dicts', 'basic-850');
const TARGET_DIR = path.join(ROOT_DIR, 'app', 'src', 'data', 'dicts', 'basic-850');

function log(message) {
  console.log(`[sync-dicts] ${message}`);
}

function sync() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[sync-dicts] 错误：来源目录不存在 -> ${SOURCE_DIR}`);
    process.exit(1);
  }

  // 确保目标目录存在
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // 清空目标目录中的旧文件（保证完全同步）
  const existingFiles = fs.readdirSync(TARGET_DIR);
  for (const file of existingFiles) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(TARGET_DIR, file));
    }
  }

  // 复制所有 JSON 文件
  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json'));
  let copiedCount = 0;

  for (const file of sourceFiles) {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(TARGET_DIR, file);
    fs.copyFileSync(srcPath, destPath);
    copiedCount++;
  }

  log(`同步完成：从 ${SOURCE_DIR} 复制了 ${copiedCount} 个场景文件到 ${TARGET_DIR}`);
  log('提示：修改数据后请重新运行本脚本，并刷新浏览器。');
}

sync();
