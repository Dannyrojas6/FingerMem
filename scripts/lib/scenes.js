const fs = require('fs');
const path = require('path');
const {
  DICTS_DIR,
  ARCHIVE_DIR,
  getScenesDir,
  isArchivedDictName,
  assertActiveDictName,
} = require('./config');

const SCENE_FILE_RE = /^(\d{2})-([a-z0-9-]+)\.json$/;

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

function listSceneJsonFiles(dictName) {
  const scenesDir = getScenesDir(dictName);
  if (!fs.existsSync(scenesDir)) return [];
  return fs.readdirSync(scenesDir).filter(f => f.endsWith('.json'));
}

/**
 * dicts/ 下可用词典（跳过 archive/，不递归归档内容）
 */
function getAvailableDicts() {
  if (!fs.existsSync(DICTS_DIR)) return [];

  return fs
    .readdirSync(DICTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => name !== ARCHIVE_DIR && !isArchivedDictName(name))
    .filter(name => listSceneJsonFiles(name).length > 0)
    .sort();
}

/**
 * @returns {Map<string, object> | null}
 */
function loadSceneFiles(dictName, { onError, onWarn }) {
  assertActiveDictName(dictName);

  const scenesDir = getScenesDir(dictName);
  if (!fs.existsSync(scenesDir)) {
    onError('结构', `缺少目录: ${scenesDir}`);
    return null;
  }

  const files = fs.readdirSync(scenesDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    onError('结构', 'scenes/ 下没有 .json 场景文件');
    return null;
  }

  const scenes = new Map();

  for (const file of files.sort()) {
    const id = sceneIdFromFile(file);
    if (!id) {
      onError('结构', `场景文件名不符合 NN-slug.json: ${file}`);
      continue;
    }
    if (scenes.has(id)) {
      onError('结构', `重复场景 id: ${id}`);
      continue;
    }

    const fullPath = path.join(scenesDir, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (e) {
      onError('结构', `${file}: JSON 解析失败 — ${e.message}`);
      continue;
    }

    if (typeof data.name !== 'string' || !data.name.trim()) {
      onError('结构', `${file}: 缺少非空 name`);
    }
    if (!Array.isArray(data.sentences)) {
      onError('结构', `${file}: sentences 必须是数组`);
      scenes.set(id, { file, data: null, sentences: [], phase: scenePhase(id) });
      continue;
    }

    data.sentences.forEach((s, i) => {
      if (!s || typeof s.en !== 'string' || !s.en.trim()) {
        onError('结构', `${file}: sentences[${i}] 缺少 en`);
      }
      if (!s || typeof s.zh !== 'string' || !s.zh.trim()) {
        onError('结构', `${file}: sentences[${i}] 缺少 zh`);
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

module.exports = {
  SCENE_FILE_RE,
  sceneIdFromFile,
  scenePhase,
  listSceneJsonFiles,
  getAvailableDicts,
  loadSceneFiles,
};