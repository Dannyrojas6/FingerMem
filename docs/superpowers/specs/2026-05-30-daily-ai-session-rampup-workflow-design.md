# Daily AI Session Ramp-up Workflow 设计文档

**日期**: 2026-05-30  
**项目**: basic-eng-850  
**状态**: 设计阶段（已获用户确认）  
**作者**: Grok + 用户协作设计

---

## 1. 背景与目标

### 1.1 问题背景
- 项目目前没有 git 仓库（计划初始化）。
- 使用 AI Agent 进行开发时，不同会话之间上下文容易丢失。
- 每天让新 Agent 从零阅读代码库成本高、效率低。
- 已有一次完整的 /understand 分析，生成了高质量的 knowledge-graph.json。

### 1.2 核心目标
让**第二天新的 Agent 或新的会话**能够**快速读懂整个项目**，实现高效的“热启动”，而不是每次都重新分析代码库。

---

## 2. 已确定的设计决策

| 维度           | 最终选择          | 说明 |
|----------------|-------------------|------|
| 日常刷新策略   | 混合模式 (C)      | 大部分日子轻量，重大变化时完整刷新 |
| 存档策略       | 混合模式 (3)      | 平时单最新 + 重大变化时日期化归档 |
| 轻量 EOD 模式  | 最轻量模式 (A)    | 不强制运行完整 /understand |
| EOD 核心产出   | 选项 A            | 较新的 knowledge-graph + Current State 快照 |
| 状态快照内容   | 当前任务 + 项目状态 | 可相对详细 |
| 状态快照位置   | 项目根目录        | CURRENT_STATE.md |
| 重大变化归档位置 | .understand-snapshots/YYYY-MM-DD/ | |
| 第一落地动作   | Git 仓库初始化    | 设计确认后立即执行 |

---

## 3. 推荐方案：方案一（简洁实用）

### 3.1 设计理念
- 以“帮助新 session 快速建立项目整体理解”为核心目标。
- 日常操作尽量轻量，降低使用摩擦。
- 利用已有的 knowledge-graph.json 作为主要结构化理解来源。
- 通过一个维护良好的 CURRENT_STATE.md 提供“当前上下文”。

### 3.2 文件结构

`
basic-eng-850/
├── CURRENT_STATE.md                 # 每天 EOD 更新，第二天新 session 必读
├── English-基础850词.md
├── app/
├── dicts/
├── .understand-anything/
│   ├── knowledge-graph.json
│   ├── fingerprints.json
│   ├── meta.json
│   ├── config.json
│   └── .understandignore
└── .understand-snapshots/           # 仅在重大变化时创建
    └── 2026-06-15/
        ├── knowledge-graph.json
        ├── fingerprints.json
        └── CURRENT_STATE.md
`

---

## 4. EOD 工作流（End of Day）

### 4.1 普通日子（轻量模式）

**触发方式**：用户在结束工作前主动让 Agent 执行。

**Agent 应执行的动作**（按优先级）：

1. 读取现有的 .understand-anything/knowledge-graph.json 和 ingerprints.json，建立当前项目理解。
2. 分析今天有哪些文件被修改（主要通过文件修改时间 + 项目上下文判断）。
3. **撰写 / 更新** 项目根目录下的 CURRENT_STATE.md，内容包括：
   - 当前正在做的任务 / 目标（可详细描述）
   - 项目当前整体状态（架构稳定性、热点模块、已知问题等）
   - 今天对项目结构或理解的影响（如果有）
   - 开放问题 / 注意事项
   - 下一步建议关注的方向（可选）
4. 如果发现明显的结构变化，更新 ingerprints.json。
5. **不主动触发** 完整的 /understand 流程。

### 4.2 重大变化日（完整模式）

当出现以下情况时，用户手动触发完整流程：
- 架构调整
- 新增重要模块
- 重构核心逻辑
- 长时间未做完整分析

**动作**：
- 执行完整 /understand（或加 --full）
- 将 .understand-anything/ 下的关键文件复制到 .understand-snapshots/YYYY-MM-DD/
- 同时复制当时的 CURRENT_STATE.md

---

## 5. SOD 工作流（Start of Day）

新 Agent / 新会话在开始工作时的推荐阅读顺序：

1. **首先阅读** CURRENT_STATE.md（根目录）
   - 快速建立“现在在干什么 + 项目是什么状态”的认知。
2. **然后阅读** .understand-anything/knowledge-graph.json
   - 获得完整的结构化项目理解（分层、组件关系、导览等）。
3. 必要时再阅读具体源码文件。
4. 如果存在 .understand-snapshots/，可根据需要参考历史快照。

**推荐的 Agent 初始指令模板**（后续可放入文档）：
> “请先阅读项目根目录下的 CURRENT_STATE.md，然后阅读 .understand-anything/knowledge-graph.json，建立对项目的整体理解。理解完成后，再询问我今天想继续做什么。”

---

## 6. Git 集成计划

### 6.1 第一步（设计确认后立即执行）
- 初始化 git 仓库。
- 编写合理的 .gitignore（包含 node_modules、dist、.understand-snapshots/ 是否提交等决策）。
- 提交当前所有有意义的文件，包括 .understand-anything/。

### 6.2 Git 启用后的影响
- EOD 轻量模式可以结合 git status 和 git diff 更准确地判断当天改动。
- ingerprints.json 的增量能力会显著增强。
- 可以考虑在 config.json 中开启 utoUpdate。

---

## 7. 未来演进路径（可选）

- 当项目变大后，可考虑把 CURRENT_STATE.md 拆分为更结构化的形式。
- 引入 SESSION_NOTES.md 记录更详细的思考过程。
- 结合 git hook 或定时任务，实现半自动化 EOD 提醒。
- 当 git 稳定后，可探索把知识图谱与 git commit 强关联的方案。

---

## 8. 开放问题（待后续讨论）

- CURRENT_STATE.md 是否需要提交到 git？（推荐提交）
- .understand-snapshots/ 是否提交到 git？（推荐不提交，体积可能增长）
- 是否需要为 CURRENT_STATE.md 提供一个简易的模板？

---

**设计确认状态**：已获用户明确认可方案一及相关细节。

下一步：等待用户最终确认本设计文档后，执行第一个落地动作 —— Git 仓库初始化。
