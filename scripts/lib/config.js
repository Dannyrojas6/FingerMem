const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DICTS_DIR = path.join(ROOT_DIR, 'dicts');
const SCENES_SUBDIR = 'scenes';
const ACTIVE_DIR = path.join(ROOT_DIR, 'app', 'src', 'data', 'dicts', 'active');
const MARKER_FILE = path.join(ACTIVE_DIR, '.active-dict.json');

/** 生产默认词典 */
const DEFAULT_DICT = 'basic-850-cognitive';

/** dicts/ 下仅存档、不参与列举与切换 */
const ARCHIVE_DIR = 'archive';

function isArchivedDictName(dictName) {
  if (!dictName) return false;
  const n = dictName.replace(/\\/g, '/');
  return n === ARCHIVE_DIR || n.startsWith(`${ARCHIVE_DIR}/`);
}

function assertActiveDictName(dictName) {
  if (isArchivedDictName(dictName)) {
    throw new Error(`归档词典不参与校验或同步: ${dictName}`);
  }
}

function getDictDir(dictName) {
  return path.join(DICTS_DIR, dictName);
}

function getScenesDir(dictName) {
  return path.join(getDictDir(dictName), SCENES_SUBDIR);
}

module.exports = {
  ROOT_DIR,
  DICTS_DIR,
  SCENES_SUBDIR,
  ACTIVE_DIR,
  MARKER_FILE,
  DEFAULT_DICT,
  ARCHIVE_DIR,
  isArchivedDictName,
  assertActiveDictName,
  getDictDir,
  getScenesDir,
};