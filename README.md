# FingerMem

支持词典切换的打字练习应用。当前生产词典为 **basic-850-cognitive**（53 场景，认知递进设计）。

## 特性

- 多词典架构（脚本切换，无应用内切换）
- 实时打字反馈
- 词典数据与前端分离

## 项目结构

```
.
├── app/                         # Vite + React + TypeScript
├── dicts/
│   ├── basic-850-cognitive/     # 生产词典（scenes/ + word-index.json）
│   └── archive/                 # 旧词典存档，脚本不扫描、不参与校验/同步
├── scripts/
│   ├── lib/                     # 共用配置、场景加载、练习规则
│   ├── validate-dict.js         # 校验：结构 · 索引 · 练习
│   └── sync-dicts.js            # 同步 scenes → app/.../active/
└── README.md
```

## 快速开始

```bash
cd app
npm install
npm run validate-dict
npm run sync-dicts
npm run dev
```

浏览器打开 `http://localhost:5173`。

## 改词典后的流程

在 `app/` 目录：

```bash
npm run validate-dict    # 结构 · 索引 · 练习
npm run sync-dicts       # 写入 active/（须先校验通过）
npm run dev              # 或部署前 npm run build
```

指定其他非归档词典：`npm run validate-dict -- my-dict`、`npm run sync-dicts -- my-dict`。

## 校验说明

| 段 | 说明 | 未通过时 |
|----|------|----------|
| **结构** | `scenes/`、文件名、`name` / `sentences` / `en` / `zh` | 失败 |
| **索引** | `word-index.json` 与场景交叉引用；无 index 则跳过硬检查 | 失败 |
| **练习** | 一条 `en` 一句；去句末标点后有效长度 &lt; 50（与 `typing.ts` 一致） | 失败 |
| **阶段提示** | Phase 1/3 语法启发式 | 仅提示，不阻断 |

不检查：48–49 字、句首逗号、`, but` / `, so` 等观感项。`dicts/archive/` 不参与任何脚本。

## 部署（Cloudflare Pages）

- **Root directory**: `app`
- **Build command**:

```bash
npm ci && npm run validate-dict && npm run sync-dicts && npm run build
```

应用从 `app/src/data/dicts/active/` 加载数据（由 `sync-dicts` 生成，通常不入库）。

## 添加新词典

1. 在 `dicts/` 下新建文件夹，内含 `scenes/*.json`
2. `npm run validate-dict -- <name>`
3. `npm run sync-dicts -- <name>`

## 技术栈

React 19 · Vite · TypeScript · Tailwind CSS · React Router

---

项目原名 basic-eng-850，现名 FingerMem。