# FingerMem UI Redesign - Proper Full-Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correctly implement the complete locked dark visual design from the 2026-06-01 spec (`docs/superpowers/specs/2026-06-01-fingermem-interface-redesign.md`) across the *entire running application*, including the root shell in App.tsx, so the real `npm run dev` experience matches the approved visuals.

**Critical Lesson from Previous Attempt:** The previous plan only modified the three page components. The real app renders inside a light `bg-gray-50` + white header shell in App.tsx. All visual mocks were standalone HTML. This plan explicitly expands scope to the full render tree and mandates verification using the *real* App shell in Visual Companion.

**Architecture:**
- Global dark theme (`#161616` background, light text) applied at the root `<App>` level.
- Persistent light header in App.tsx is removed or fully adapted for dark theme (Practice page header remains hidden per spec).
- Three pages receive the exact locked component designs from the spec.
- Theme tokens from `app/src/styles/theme.ts` are either used or all colors stay strictly consistent with the spec table.
- Tests are updated to match new DOM and new text content.
- Every visual task includes a mandatory step: create/update a full-shell Visual Companion mock (including the real App header area + background) and verify against the locked spec.

**Tech Stack:** React 19 + TypeScript + Tailwind + React Router + Vite (existing).

**Mandatory Rule for All Visual Work:**
> Every time a visual change is made (especially App shell, cards, typography, modal), a Visual Companion HTML must be created/updated that renders the *complete current App shell* (header + main + the modified component). Isolated component mocks are forbidden for final verification.

---

## Task 0: Preparation & Context Setup

**Files:**
- Review: `docs/superpowers/specs/2026-06-01-fingermem-interface-redesign.md`
- Review: current `app/src/App.tsx`, the three pages, and their tests
- Review: `app/src/styles/theme.ts`

- [ ] **Step 1: Read the locked spec completely**
- [ ] **Step 2: Confirm current light state of the app**
  Run:
  ```bash
  cd app && npm run dev
  ```
  Open http://localhost:5173 (or whatever port) and take a mental note of the light gray + white header + old components. This is the "before" baseline.

- [ ] **Step 3: Create initial full-shell Visual Companion baseline**
  Create a static HTML file (e.g. in a temporary folder or docs/superpowers/visual/) that copies the current rendered structure of App + one page (e.g. SceneList) as closely as possible using Tailwind CDN or extracted classes. This will be the starting point for all later full-shell mocks.

- [ ] **Step 4: Commit preparation**
  ```bash
  git add -A
  git commit -m "chore: prepare for proper full-shell UI redesign (read spec + baseline)"
  ```

---

## Task 1: Apply Global Dark Theme at Root Shell (App.tsx)

**Files:**
- Modify: `app/src/App.tsx`
- Possibly: `app/src/style.css` (for html/body if needed)

**Spec References:** Main background #161616, text colors, overall dark language.

- [ ] **Step 1: Write failing visual/layout test (or manual checklist)**
  Document the current light shell behavior.

- [ ] **Step 2: Update App.tsx to dark theme**
  Change the root wrapper and header to match the locked dark language while keeping layout structure.

  Exact target (example — adapt precisely):
  ```tsx
  // app/src/App.tsx
  return (
    <div className="min-h-screen bg-[#161616] text-[#f4f4f5]">
      <header className="border-b border-[#2a2a2a] bg-[#1f1f1f]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#f4f4f5]">基础英语 850 · 打字练习</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        ...
      </main>
    </div>
  )
  ```

- [ ] **Step 3: Run the app and create full-shell Visual Companion mock**
  - Start dev server.
  - Create a new full HTML mock that includes the updated App header + main area + a sample page.
  - Push to Visual Companion (localhost:64153 or whatever the current visual server is).
  - Verify against spec: background #161616, header treatment, text colors.

- [ ] **Step 4: Run full test suite (expect some failures due to color/text changes)**
  ```bash
  cd app && npm run test:run
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add app/src/App.tsx
  git commit -m "feat: apply global dark theme at root App shell per spec"
  ```

---

## Task 2: Redesign SceneList with Locked Card Design

**Files:**
- Modify: `app/src/pages/SceneList.tsx`
- Modify: `app/src/pages/SceneList.test.tsx` (update text assertions)

**Spec References:** Section 4 — 2-column cards, 16px scene name, "X 个句子 · 点击开始练习" at 13px #888, no blue on the action text.

- [ ] **Step 1: Update SceneList component to exact locked design**
  Replace the old white cards and text with:
  - Dark card `bg-[#1f1f1f] rounded-[10px] border border-[#2a2a2a]`
  - Scene name 16px font-semibold
  - Subtitle `text-[13px] text-[#888]`

- [ ] **Step 2: Update tests for new text content**
  Change expectations from old "点击开始连续练习" to the locked "点击开始练习".

- [ ] **Step 3: Full-shell visual verification (mandatory)**
  Create/update a Visual Companion mock that shows the *entire current App* (dark header + this page's new cards).
  Verify spacing, colors, typography against spec.

- [ ] **Step 4: Run SceneList tests**
  ```bash
  cd app && npm run test:run -- SceneList.test.tsx
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add app/src/pages/SceneList.tsx app/src/pages/SceneList.test.tsx
  git commit -m "feat(scenelist): implement locked dark card design with full-shell verification"
  ```

---

## Task 3: Redesign SceneDetail with Locked Vertical Card List

**Files:**
- Modify: `app/src/pages/SceneDetail.tsx`
- Modify: `app/src/pages/SceneDetail.test.tsx`

**Spec References:** Section 5 — top bar with name + count + "连续练习本场景" button, divider, independent rounded cards (#252525, 10px radius), 13px en / 12px zh, right "练习" button (#232323, 8px radius).

- [ ] **Step 1: Implement the full locked structure**
  Top info + button, h-px divider, vertical gap cards with exact colors and paddings.

- [ ] **Step 2: Update tests** for new button text and structure.

- [ ] **Step 3: Mandatory full-shell Visual Companion verification**
  Build a mock that renders the real App shell + this exact SceneDetail layout. Compare side-by-side with the approved design.

- [ ] **Step 4: Run tests**
  ```bash
  cd app && npm run test:run -- SceneDetail.test.tsx
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add app/src/pages/SceneDetail.tsx app/src/pages/SceneDetail.test.tsx
  git commit -m "feat(scenedetail): implement locked vertical card list with full-shell verification"
  ```

---

## Task 4: Redesign Practice Page (Minimal + Hidden Header + Typography + Modal)

**Files:**
- Modify: `app/src/pages/Practice.tsx`
- Modify: `app/src/pages/Practice.test.tsx` (major updates expected)

**Spec References:** Section 3 — header completely hidden, subtle #1f1f1f container, 12px English with tracking, 10px Chinese, specific completion modal with trophy + scene name + two exact buttons.

- [ ] **Step 1: Properly hide the old header section**
  Remove the visible scene name + progress (update or delete related test queries instead of using `display:none` hack if possible).

- [ ] **Step 2: Apply the locked container + typography**
  English: `text-[12px] tracking-[0.5px]`
  Wrap content in `bg-[#1f1f1f] rounded-[10px]`

- [ ] **Step 3: Update the completion modal** to exact spec (🏆 icon, "XX场景完成！", two buttons with #1f1f1f / #f5f5f5, rounded-[12px], py-1.5 padding).

- [ ] **Step 4: Update all affected tests**
  Remove or adjust assertions that relied on the old visible header, old progress bar classes, old modal text.

- [ ] **Step 5: Mandatory full-shell visual verification**
  Create a Visual Companion mock of the *full running Practice screen* (including whatever header treatment we decided for App) showing the minimal centered sentence area and the new modal.

- [ ] **Step 6: Run Practice tests**
  ```bash
  cd app && npm run test:run -- Practice.test.tsx
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add app/src/pages/Practice.tsx app/src/pages/Practice.test.tsx
  git commit -m "feat(practice): apply locked minimal design with proper header handling and full-shell verification"
  ```

---

## Task 5: Test, Polish & Full Verification

**Files:** All changed files + possibly global styles.

- [ ] **Step 1: Run the complete test suite**
  ```bash
  cd app && npm run test:run
  ```

- [ ] **Step 2: Type check + lint**
  ```bash
  cd app && npm run typecheck && npm run lint
  ```

- [ ] **Step 3: Full manual + Visual Companion verification (mandatory)**
  - Start dev server.
  - For each of the three main screens, create/update a **full App shell** Visual Companion mock.
  - Walk through the flows (SceneList → SceneDetail → Practice → completion modal).
  - Confirm every detail against the 2026-06-01 spec (colors, sizes, spacing, no blue action text where forbidden, etc.).

- [ ] **Step 4: Final consistency commit**
  ```bash
  git add -A
  git commit -m "chore: full test + visual verification pass for proper UI redesign"
  ```

---

## Summary of Deliverables

- Global dark theme correctly applied at root (App.tsx).
- All three pages match the locked spec exactly when viewed inside the real application.
- Every visual decision verified with **full-shell** Visual Companion mocks (not isolated components).
- All tests passing.
- Clean git history with focused commits.

**Plan complete.**

After this plan is approved, we will execute it using **subagent-driven-development** with fresh context per task and the mandatory full-shell visual checks.

---

**Self-Review against original spec (2026-06-01):**
- Main background #161616: Covered in Task 1 (App shell).
- Practice header hidden + container + 12px/10px typography + modal: Task 4.
- SceneList cards + exact subtitle text: Task 2.
- SceneDetail vertical cards + top bar + button treatment: Task 3.
- Color table and radius rules: Referenced in every task + verification steps.
- Scope expanded beyond the original narrow "three pages" line to include the shell (this was the root cause of previous failure).

All gaps from the first attempt have been explicitly addressed.