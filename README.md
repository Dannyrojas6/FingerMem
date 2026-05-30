# FingerMem

一个支持词典切换的打字练习工具。

虽然最初是围绕基础英语 850 词设计的，但核心目标是做一个**通用的词表练习平台**，你可以轻松切换不同的词典（词汇表）来进行打字训练。

## 特性

- 支持多个词典自由切换
- 实时打字反馈 + 防作弊机制
- 极简的练习界面
- 数据与应用分离，便于扩展新词典

## 项目结构

```
.
├── app/                  # 前端应用（Vite + React + TypeScript + Tailwind）
├── dicts/                # 词典数据目录（每个子文件夹是一个独立词典）
│   └── basic-850/        # 示例：基础英语 850 词
├── scripts/
│   └── sync-dicts.js     # 词典同步脚本
├── English-基础850词.md  # 官方 850 词表参考
└── README.md
```

## 快速开始

```bash
cd app
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可开始练习。

## 添加新词典

1. 在 `dicts/` 目录下新建一个文件夹（例如 `dicts/my-wordlist/`）
2. 按照 `dicts/basic-850/` 的格式放入 JSON 文件
3. 运行同步脚本（可选）
4. 重启应用即可在界面中切换词典

## 技术栈

- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router

## 开发说明

- 词典数据与应用代码完全分离
- 所有练习逻辑集中在 `app/src/pages/Practice.tsx`
- 欢迎贡献新的词典或功能

---

**项目原名**：basic-eng-850（现已更名为 FingerMem，以体现对多词典的支持）
