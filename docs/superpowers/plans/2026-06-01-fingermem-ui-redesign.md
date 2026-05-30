# FingerMem UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the finalized visual redesign for Practice, SceneList, and SceneDetail screens according to the approved design spec (2026-06-01-fingermem-interface-redesign.md), using the locked dark theme and component patterns.

**Architecture:** 
- Single cohesive dark theme (`#161616` background) applied across all three screens.
- Practice becomes extremely minimal (header hidden, subtle container, refined typography).
- SceneList and SceneDetail adopt clean card-based layouts with consistent spacing, typography, and button treatment.
- All changes are contained within the three page components + global style tokens.

**Tech Stack:** React + TypeScript + Tailwind CSS (Vite), no new dependencies.

---

## Current Locked Design Decisions (Reference)

See the full spec at `docs/superpowers/specs/2026-06-01-fingermem-interface-redesign.md`. Key points:

**Practice:**
- Background `#161616`
- Header completely hidden
- Content wrapped in subtle `#1f1f1f` container
- English 12px + light letter-spacing, Chinese 10px
- Completion modal with specific structure and button styles

**SceneList:**
- Card grid (2 columns on desktop)
- Scene name large on top
- Single line below: `X 个句子 · 点击开始练习`

**SceneDetail:**
- Top bar with scene name + count (left) + "连续练习本场景" button (right)
- Divider
- Vertical list of independent rounded cards (English above, Chinese below)
- Right side "练习" button per row

**Visual Tokens:**
- Main bg: `#161616`
- Card bg (Practice): `#1f1f1f`
- Card bg (lists): `#252525`
- Button styles as defined in the spec
- Border radius: 12px for primary actions, 8-10px for cards

---

## Task Breakdown

### Task 1: Establish Global Theme Tokens

**Files:**
- Create: `app/src/styles/theme.ts` (or add to existing style file)
- Modify: `app/src/style.css` or `app/tailwind.config.js` if needed

- [ ] **Step 1: Create theme constants file**

```ts
// app/src/styles/theme.ts
export const theme = {
  colors: {
    background: '#161616',
    card: {
      practice: '#1f1f1f',
      list: '#252525',
    },
    text: {
      primary: '#f4f4f5',
      secondary: '#a1a1aa',
      muted: '#888',
    },
    button: {
      secondary: '#1f1f1f',
      primary: '#f5f5f5',
      primaryText: '#161616',
    },
  },
  borderRadius: {
    card: '10px',
    button: '12px',
    smallButton: '8px',
  },
} as const;
```

- [ ] **Step 2: Run type check to verify**

```bash
cd app && npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/src/styles/theme.ts
git commit -m "feat: add theme constants for UI redesign"
```

---

### Task 2: Update Practice Screen

**Files:**
- Modify: `app/src/pages/Practice.tsx`

- [ ] **Step 1: Hide the header section completely**

Remove or conditionally hide the scene name + progress bar section (lines ~142-161 in current file).

- [ ] **Step 2: Wrap the main content in the subtle container**

Apply `bg-[#1f1f1f] rounded-[10px]` (or use theme token) around the sentence + translation area.

- [ ] **Step 3: Update typography**

- English sentence: `text-[12px] tracking-[0.5px]`
- Chinese translation: `text-[10px] text-[#a1a1aa]`

- [ ] **Step 4: Update completion modal styles**

Match the locked design:
- Container: `#1f1f1f`, `rounded-xl` (or 12px)
- Title with icon
- Buttons with exact padding, border-radius 12px, and colors from spec

- [ ] **Step 5: Run existing Practice tests**

```bash
cd app && npm run test:run -- Practice.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/Practice.tsx
git commit -m "feat(practice): apply locked minimal design (hidden header, container, typography)"
```

---

### Task 3: Redesign SceneList

**Files:**
- Modify: `app/src/pages/SceneList.tsx`

- [ ] **Step 1: Switch to card grid layout (2 columns)**

Use the structure from the approved visual (Version 1).

- [ ] **Step 2: Implement card content**

```tsx
<div className="bg-[#1f1f1f] p-4 rounded-[10px] border border-[#2a2a2a]">
  <div className="text-[16px] font-semibold">{scene.name}</div>
  <div className="text-[13px] text-[#888] mt-2">
    {scene.sentences.length} 个句子 · 点击开始练习
  </div>
</div>
```

- [ ] **Step 3: Run SceneList tests**

```bash
cd app && npm run test:run -- SceneList.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add app/src/pages/SceneList.tsx
git commit -m "feat(scenelist): apply locked card design"
```

---

### Task 4: Redesign SceneDetail

**Files:**
- Modify: `app/src/pages/SceneDetail.tsx`

- [ ] **Step 1: Implement top bar**

Left: Scene name + sentence count
Right: "连续练习本场景" button (border-radius 12px)

- [ ] **Step 2: Add divider**

- [ ] **Step 3: Convert list to independent rounded cards**

Each card:
- Background `#252525`
- Border-radius 10px
- English (13px) + Chinese (12px) stacked
- Right side "练习" button with background `#232323`, border-radius 8px

- [ ] **Step 4: Remove any old play icons or outdated elements**

- [ ] **Step 5: Run SceneDetail tests**

```bash
cd app && npm run test:run -- SceneDetail.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/SceneDetail.tsx
git commit -m "feat(scenedetail): apply locked vertical card list design"
```

---

### Task 5: Final Polish & Consistency

**Files:**
- Possibly `app/src/style.css` or shared components

- [ ] **Step 1: Extract any repeated button styles** into a small reusable component or Tailwind variants if it makes sense (keep YAGNI in mind).

- [ ] **Step 2: Run full test suite**

```bash
cd app && npm run test:run
```

- [ ] **Step 3: Run typecheck + lint**

```bash
cd app && npm run typecheck && npm run lint
```

- [ ] **Step 4: Manual verification checklist**

- [ ] Practice screen matches locked spec (header hidden, container, typography, modal)
- [ ] SceneList cards match approved design
- [ ] SceneDetail matches approved vertical card layout
- [ ] Dark theme colors are consistent across all three screens
- [ ] No visual regressions in existing behavior

- [ ] **Step 5: Commit final polish**

```bash
git add -A
git commit -m "chore: final consistency and polish for UI redesign"
```

---

## Summary of Deliverables

- All three screens updated to match the approved design spec
- Consistent dark theme applied
- Existing tests still pass
- Clean git history with focused commits

---

**Plan complete.** 

Ready to execute. Would you like to:
- Use **subagent-driven development** (one subagent per task with review between tasks), or
- Use **inline execution** with checkpoints in this session?

Which approach do you prefer?