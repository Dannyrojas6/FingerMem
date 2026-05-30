# basic-eng-850

基础英语 850 词 · 打字练习应用

一个基于 C.K. Ogden 基础英语 850 词构建的打字练习 React 应用，支持 10 个日常场景的句子练习。

## 项目结构

- `AI_DAILY_WORKFLOW.md` — AI 辅助开发的日常工作流（EOD / SOD）
- `English-基础850词.md` — 官方 850 词表
- `dicts/basic-850/` — **唯一数据源**（10 个场景练习句子，编辑后需运行同步脚本）
- `scripts/sync-dicts.js` — 数据同步脚本（将 `dicts/basic-850/` 同步到应用内）
- `app/` — Vite + React + TypeScript + Tailwind 应用（通过 `import.meta.glob` 消费数据）

## 快速开始

```bash
cd app
npm install
npm run dev
```

## AI 工作流

每天结束前执行轻量 EOD，第二天新会话通过 `CURRENT_STATE.md` + 知识图谱快速建立上下文。

详细说明见 `AI_DAILY_WORKFLOW.md`。

## 技术栈

- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router
