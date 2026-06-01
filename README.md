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
├── dicts/                # 词典数据源（每个子文件夹是一个独立词典）
│   ├── basic-850/        # 示例：基础英语 850 词（10 场景）
│   └── basic-english-850-words/  # 30 场景词典
├── scripts/
│   └── sync-dicts.js     # 词典切换脚本（推荐使用方式）
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
2. 放入符合格式的场景 JSON 文件（每个文件包含 `name` 和 `sentences` 数组）
3. 使用切换脚本激活该词典：
   ```bash
   cd app
   npm run sync-dicts my-wordlist
   ```
4. 重启/刷新开发服务器即可使用新词典数据

**注意**：目前不提供界面内切换词典的功能，全部通过脚本控制。

## 切换词典

在 `app/` 目录下执行：

```bash
npm run sync-dicts basic-english-850-words   # 切换到 30 场景词典
npm run sync-dicts basic-850                 # 切换回 10 场景词典
```

不带参数时会列出所有可用词典及当前激活状态：

```bash
npm run sync-dicts
```

切换后需要刷新浏览器（或重启 dev server）。

应用始终只从 `app/src/data/dicts/active/` 加载数据，该目录由脚本维护并被 git 忽略。

## 技术栈

- React 19 + Vite
- TypeScript
- Tailwind CSS
- React Router

## 开发说明

- 词典数据源位于 `dicts/` 目录，每个子文件夹是一个独立词典
- 使用 `npm run sync-dicts <name>` 将词典激活到 `app/src/data/dicts/active/`
- 应用代码（`scenes.ts` 等）始终从 `active/` 加载，不关心具体词典名称
- 测试已尽量做到与具体词典数据解耦（切换词典不应导致大量测试失败）
- 欢迎贡献新的词典或功能

---

**项目原名**：basic-eng-850（现已更名为 FingerMem，以体现对多词典的支持）
