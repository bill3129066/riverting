# UI Overhaul + Marketplace Flow Fix

## TL;DR

> **Quick Summary**: Complete frontend visual redesign from AI-slop dark dashboard to minimal editorial aesthetic, plus fix the broken "Start Session" wallet flow that currently dead-ends users.
> 
> **Deliverables**:
> - New design system: editorial palette, distinctive fonts, semantic Tailwind tokens
> - All 10 pages/components restyled to minimal editorial look
> - Session page with kinetic animations (salary ticker, proof heartbeat pulses)
> - Working wallet-aware "Start Session" flow (connect → create → navigate)
> - Loading skeletons, meaningful empty states, polished UX copy
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: T1 → T2 → T3 → T8/T9 (parallel) → T11 → T12 → F1-F4

---

## Context

### Original Request
User identified that: (1) the entire frontend looks like textbook AI-generated slop (teal-on-dark, Inter font, identical card grids), and (2) clicking "Start Session" on the marketplace without a wallet leads to a dead-end page. Requested applying design critique skills in order (`/bolder`, `/colorize`, `/distill`, `/arrange`, `/animate`, `/overdrive`, `/harden`, `/onboard`, `/clarify`) and fixing the wallet flow — all in a new git worktree with periodic commits.

### Interview Summary
**Key Discussions**:
- **Visual direction**: Minimal Editorial — clean, generous whitespace, magazine-feel typography. NOT the teal-on-dark crypto dashboard.
- **Branch**: `feat/ui-overhaul` in a new git worktree
- **Include wallet flow fix**: Yes, combined with visual overhaul
- **Automated tests**: No — hackathon stage, agent QA scenarios only
- **Periodic commits**: Yes, after each major wave

**Research Findings**:
- 22 frontend files total (14 pages/components + 8 config/lib/css)
- `createSession()` exists in `lib/api.ts` but is NEVER called — modal uses inline `fetch` with `Date.now()` as session ID
- `lib/api.ts` hardcodes rates (`1300/1000/300`) instead of using agent data
- Curator layout has wallet guard pattern (`useAccount()` + `isConnected`) to replicate
- `useConnectModal()` from RainbowKit available for programmatic modal open
- `formatRate()` duplicated in 3 files, `PLATFORM_FEE` in 3 files
- Every page redundantly sets `min-h-screen bg-[#0a0a0a]` despite root layout already setting background
- RainbowKit theme in `providers.tsx` hardcodes `#00d4aa` — must update with new palette
- Query page (224 lines) is the largest — included in scope for visual consistency

### Metis Review
**Identified Gaps** (addressed):
- AgentDetailModal bug is worse than described — uses `Date.now()` as session ID, not `createSession()` from `lib/api.ts`
- Double `min-h-screen bg-[#0a0a0a]` on every page — must clean up before restyling
- RainbowKit theme will clash if not updated with new palette
- `formatRate()` and `PLATFORM_FEE` duplicated across 3 files each — extract first
- Font must load via `next/font` (not `<link>` or `@import`) to avoid FOUT
- Session page animation dev needs mock data since backend SSE may not be running
- `/bolder` then `/distill` in sequence could create rework — merged into single design system pass

---

## Work Objectives

### Core Objective
Transform the Riverting frontend from generic AI-slop dark dashboard into a distinctive minimal editorial design, and fix the broken marketplace session flow so users can actually start sessions.

### Concrete Deliverables
- `.impeccable.md` — Design context file for future consistency
- Updated `tailwind.config.ts` with full semantic token set + new palette
- All 10 page/component files restyled
- `AgentDetailModal.tsx` with wallet-aware "Start Session" button
- `lib/api.ts` `createSession()` with dynamic rates
- `lib/utils.ts` with shared utilities
- Session page with CSS + optional Framer Motion animations

### Definition of Done
- [ ] `bun run build` in `frontend/` exits with code 0
- [ ] Zero instances of `#00d4aa`, `#0a0a0a`, `bg-[#111]` outside `tailwind.config.ts`
- [ ] Zero instances of `Inter` font import
- [ ] `grep -r "function formatRate" frontend/` returns exactly 1 match
- [ ] `AgentDetailModal.tsx` imports `useAccount` and `useConnectModal`
- [ ] `AgentDetailModal.tsx` contains NO inline `fetch` to `/api/sessions`
- [ ] Navigating to `/session/new` does NOT show dead-end page

### Must Have
- New distinctive font pair loaded via `next/font`
- All hardcoded hex colors migrated to semantic Tailwind tokens
- Wallet-aware Start Session button (3 states: connect / start / starting)
- `createSession()` called with agent's actual rates
- Session page salary ticker with smooth animation (not jumping numbers)
- Loading skeletons on marketplace + curator pages
- Meaningful empty states (not just "nothing here")

### Must NOT Have (Guardrails)
- ❌ No backend code changes (files outside `frontend/`)
- ❌ No mobile responsive styles (separate pass)
- ❌ No SIWE/signature authentication (TODO comment only)
- ❌ No session ownership verification (hackathon scope)
- ❌ No dark/light mode toggle — dark only
- ❌ No new routes or pages
- ❌ No toast/notification system
- ❌ No test framework or test files
- ❌ No page transition / route animations
- ❌ No Framer Motion EXCEPT on session page (CSS animations elsewhere)
- ❌ No loading shell for SSR-disabled provider mount
- ❌ No `@ts-ignore` or `as any` additions
- ❌ No chain-switching logic beyond native RainbowKit

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None
- **QA method**: Agent-executed build verification + visual inspection via Playwright + grep assertions

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build verification**: `bun run build` in `frontend/` — exit code 0
- **Token migration**: `grep` for banned hex values — expect 0 matches
- **Visual**: Playwright screenshot of each page after changes
- **Wallet flow**: Playwright interaction with connect modal

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Sequential — Foundation, must complete first):
├── Task 1: Git worktree + extract shared utils + remove bg overrides [quick]
├── Task 2: Design system — .impeccable.md + tailwind tokens + font + RainbowKit theme [deep]
└── Task 3: Bulk hex-to-token migration across all files [unspecified-high]

Wave 1 (Parallel — Page Redesigns, 6 agents):
├── Task 4: Home page editorial redesign [visual-engineering]
├── Task 5: NavBar redesign [quick]
├── Task 6: Marketplace page + AgentCard + CategoryFilter [visual-engineering]
├── Task 7: Curator dashboard + layout + upload form [visual-engineering]
├── Task 8: Query page redesign [visual-engineering]
└── Task 9: Session page structure + layout redesign [visual-engineering]

Wave 2 (Parallel — Animation + Flow Fix, 2 agents):
├── Task 10: Session page animations — SalaryTicker, ProofTimeline, AgentWork [visual-engineering]
└── Task 11: AgentDetailModal wallet flow fix + createSession integration [unspecified-high]

Wave 3 (Parallel — Polish, 2 agents):
├── Task 12: Loading skeletons + empty states across all pages [visual-engineering]
└── Task 13: UX copy pass — labels, microcopy, empty state text [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T2 → T3 → T6 (longest page redesign) → T10 → T12 → F1-F4 → user okay
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | — | T2, T3 | 0 |
| T2 | T1 | T3, T4-T9 | 0 |
| T3 | T2 | T4-T9 | 0 |
| T4 | T3 | T12, T13 | 1 |
| T5 | T3 | T12, T13 | 1 |
| T6 | T3 | T11, T12 | 1 |
| T7 | T3 | T12, T13 | 1 |
| T8 | T3 | T12, T13 | 1 |
| T9 | T3 | T10, T12 | 1 |
| T10 | T9 | T12 | 2 |
| T11 | T6 | T12 | 2 |
| T12 | T4-T11 | F1-F4 | 3 |
| T13 | T4-T11 | F1-F4 | 3 |
| F1-F4 | T12, T13 | — | FINAL |

### Agent Dispatch Summary

- **Wave 0**: **3 tasks** — T1 → `quick`, T2 → `deep`, T3 → `unspecified-high`
- **Wave 1**: **6 tasks** — T4,T6,T7,T8,T9 → `visual-engineering`, T5 → `quick`
- **Wave 2**: **2 tasks** — T10 → `visual-engineering`, T11 → `unspecified-high`
- **Wave 3**: **2 tasks** — T12 → `visual-engineering`, T13 → `writing`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Foundation: Git worktree + extract shared utils + remove background overrides

  **What to do**:
  - Create a new git worktree at `../riverting-ui-overhaul` on branch `feat/ui-overhaul`
  - Create `frontend/lib/utils.ts` with shared utilities:
    - `formatRate(microUnits: number): string` — extracted from `AgentCard.tsx:13-15`
    - `formatUSDC(microUnits: number): string` — extracted from `SalaryTicker.tsx:6-8`
    - `truncateAddress(addr: string): string` — `${addr.slice(0,6)}...${addr.slice(-4)}`
    - `PLATFORM_FEE = 300` constant
  - Update ALL files that define `formatRate`, `formatUSDC`, `PLATFORM_FEE`, or inline `addr.slice()` to import from `lib/utils.ts`:
    - `components/marketplace/AgentCard.tsx` — remove local `formatRate` + `PLATFORM_FEE`
    - `components/marketplace/AgentDetailModal.tsx` — remove local `formatRate` + `PLATFORM_FEE`
    - `components/session/SalaryTicker.tsx` — remove local `formatUSDC`
    - `components/session/CostBreakdown.tsx` — remove local `formatRate`
    - `app/curator/page.tsx` — remove local `PLATFORM_FEE`
  - Remove redundant `min-h-screen bg-[#0a0a0a] text-white` wrappers from every page that sets its own background (since root `layout.tsx` already provides `min-h-screen bg-background text-text`):
    - `app/page.tsx:5` — remove `min-h-screen bg-[#0a0a0a] text-white` from wrapper div
    - `app/marketplace/page.tsx:25` — remove from wrapper div
    - `app/curator/page.tsx:26` — remove from wrapper div
    - `app/curator/agents/new/page.tsx:67` — remove from wrapper div
    - `app/query/page.tsx:77` — remove from wrapper div
    - `app/session/[id]/page.tsx:81,94` — remove from both wrapper divs

  **Must NOT do**:
  - Do NOT change any logic or behavior — purely structural cleanup
  - Do NOT rename components or exports
  - Do NOT modify the root `layout.tsx` yet (that's Task 2)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical extraction and find-replace across known files. No creative decisions.
  - **Skills**: []
    - No specialized skills needed — this is pure refactoring.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 0 (sequential)
  - **Blocks**: T2, T3, and all subsequent tasks
  - **Blocked By**: None (first task)

  **References**:

  **Pattern References**:
  - `frontend/components/marketplace/AgentCard.tsx:11-15` — `PLATFORM_FEE` and `formatRate` to extract
  - `frontend/components/marketplace/AgentDetailModal.tsx:4-8` — Same duplication
  - `frontend/components/session/SalaryTicker.tsx:6-8` — `formatUSDC` to extract
  - `frontend/components/session/CostBreakdown.tsx:5-7` — Another `formatRate` copy
  - `frontend/app/curator/page.tsx:8` — `PLATFORM_FEE = 300` duplicate

  **Why Each Reference Matters**:
  - Each file contains an identical copy of `formatRate` or `PLATFORM_FEE` — extract once to `lib/utils.ts`, then import everywhere
  - The `min-h-screen bg-[#0a0a0a]` pattern on every page's root div creates the double-background issue Metis flagged

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Shared utils extracted and imported correctly
    Tool: Bash (grep)
    Preconditions: Worktree created, files modified
    Steps:
      1. grep -r "function formatRate" frontend/ --include="*.ts" --include="*.tsx" | wc -l
      2. Assert output is exactly "1" (only in lib/utils.ts)
      3. grep -r "PLATFORM_FEE = 300" frontend/ --include="*.ts" --include="*.tsx" | wc -l
      4. Assert output is exactly "1" (only in lib/utils.ts)
      5. grep -r "min-h-screen bg-\[#0a0a0a\]" frontend/app --include="*.tsx" | wc -l
      6. Assert output is "0" (all removed)
    Expected Result: formatRate defined once, PLATFORM_FEE defined once, no per-page bg overrides
    Failure Indicators: Count > 1 for formatRate/PLATFORM_FEE, or > 0 for bg override
    Evidence: .sisyphus/evidence/task-1-utils-extraction.txt

  Scenario: Build still passes after extraction
    Tool: Bash
    Preconditions: All files updated
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Build succeeds with zero errors
    Failure Indicators: Non-zero exit code, TypeScript errors about missing imports
    Evidence: .sisyphus/evidence/task-1-build-verify.txt
  ```

  **Commit**: YES
  - Message: `chore(frontend): extract shared utils, remove duplicate bg overrides`
  - Files: `frontend/lib/utils.ts`, all modified pages/components
  - Pre-commit: `cd frontend && bun run build`

- [ ] 2. Design System: `.impeccable.md` + Tailwind tokens + font + RainbowKit theme

  **What to do**:
  - Create `.impeccable.md` at project root with complete design context:
    - **Users**: DeFi traders, AI enthusiasts, hackathon judges evaluating the product
    - **Brand personality**: Precise, editorial, trustworthy
    - **Aesthetic direction**: Minimal editorial — think Bloomberg Terminal meets Monocle magazine. Dense information presented with typographic clarity. NOT the generic crypto dashboard.
    - **Design principles**: (1) Typography drives hierarchy, not boxes (2) Whitespace is structural, not decorative (3) Color is functional, not decorative (4) Motion signals state, not decoration
  - Update `frontend/tailwind.config.ts` with comprehensive semantic token set:
    - Replace `#0a0a0a` background with a warm-tinted near-black (e.g., `#09090b` with slight blue tint)
    - Replace `#00d4aa` primary with a more editorial accent color — consider warm tones (amber, coral) or a sophisticated cool tone that isn't the default AI teal
    - Replace untinted grays (`#888`, `#666`, etc.) with hue-tinted neutral scale
    - Add semantic tokens: `surface`, `surface-elevated`, `border-subtle`, `border-strong`, `text-primary`, `text-secondary`, `text-tertiary`, `accent`, `accent-muted`, `success`, `warning`, `error`
    - Remove the old 5-color palette entirely
  - Update `frontend/app/layout.tsx`:
    - Replace `Inter` font with a distinctive editorial font pair via `next/font/google`
    - Display font: something with character (e.g., `DM Serif Display`, `Playfair Display`, `Source Serif 4`, or `Newsreader`) for headings
    - Body font: something clean but NOT Inter/Roboto/Open Sans (e.g., `DM Sans`, `IBM Plex Sans`, `Outfit`, `Plus Jakarta Sans`)
    - Export font class names for use in components
  - Update `frontend/app/providers.tsx`:
    - Change RainbowKit `darkTheme` `accentColor` to match new primary/accent color
    - Update `accentColorForeground` if needed for contrast
  - Update `frontend/app/globals.css` if needed for new base styles or CSS custom properties

  **Must NOT do**:
  - Do NOT restyle any page/component yet — only establish the design system
  - Do NOT add responsive breakpoints
  - Do NOT import fonts via `<link>` tag or CSS `@import` — must use `next/font`

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires creative design decisions (palette, font pairing) balanced with technical correctness (next/font, tailwind config). Needs good judgment.
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Provides anti-slop guidelines, typography references, color theory. Essential for choosing a palette that ISN'T the AI default.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 0 (sequential, after T1)
  - **Blocks**: T3, and all Wave 1 tasks
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - `frontend/tailwind.config.ts:8-22` — Current 5-color palette to replace entirely
  - `frontend/app/layout.tsx:2,7,21` — Current Inter font import + usage pattern to follow with new font
  - `frontend/app/providers.tsx:16-19` — RainbowKit darkTheme config to update

  **External References**:
  - `next/font` docs: https://nextjs.org/docs/app/building-your-application/optimizing/fonts — Font loading pattern
  - Tailwind semantic tokens: standard approach is extending `theme.extend.colors` with descriptive names
  - RainbowKit theming: https://www.rainbowkit.com/docs/theming — `darkTheme()` customization API

  **Why Each Reference Matters**:
  - `tailwind.config.ts` is the single source of truth for the entire design system — every subsequent task depends on these tokens
  - `layout.tsx` font import pattern must use `next/font` to avoid FOUT (Flash of Unstyled Text)
  - `providers.tsx` RainbowKit theme will clash visually if not updated alongside the new palette

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New font loaded, Inter removed
    Tool: Bash (grep)
    Preconditions: layout.tsx updated
    Steps:
      1. grep -r "Inter" frontend/app/layout.tsx
      2. Assert 0 matches
      3. grep -r "next/font/google" frontend/app/layout.tsx
      4. Assert ≥ 1 match
    Expected Result: Inter completely gone, new font loaded via next/font
    Failure Indicators: Inter still referenced, or font loaded via <link>
    Evidence: .sisyphus/evidence/task-2-font-check.txt

  Scenario: Old teal palette removed from config
    Tool: Bash (grep)
    Preconditions: tailwind.config.ts updated
    Steps:
      1. grep "#00d4aa" frontend/tailwind.config.ts
      2. Assert 0 matches
      3. grep "#0a0a0a" frontend/tailwind.config.ts
      4. Assert 0 matches (new background should be a different value)
    Expected Result: No remnants of old AI-slop palette in config
    Failure Indicators: Old hex values still present
    Evidence: .sisyphus/evidence/task-2-palette-check.txt

  Scenario: RainbowKit theme uses new accent
    Tool: Bash (grep)
    Preconditions: providers.tsx updated
    Steps:
      1. grep "#00d4aa" frontend/app/providers.tsx
      2. Assert 0 matches
    Expected Result: RainbowKit accent matches new palette
    Failure Indicators: Old teal still in providers
    Evidence: .sisyphus/evidence/task-2-rainbowkit-check.txt

  Scenario: Build passes with new design system
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): establish editorial design system — palette, fonts, tokens`
  - Files: `.impeccable.md`, `frontend/tailwind.config.ts`, `frontend/app/layout.tsx`, `frontend/app/providers.tsx`, `frontend/app/globals.css`
  - Pre-commit: `cd frontend && bun run build`

- [ ] 3. Bulk hex-to-token migration across all files

  **What to do**:
  - Systematically replace ALL hardcoded hex color values in every `.tsx` file under `frontend/app/` and `frontend/components/` with the semantic Tailwind tokens established in Task 2
  - Common replacements (exact hex → token mapping depends on T2's output, but pattern is):
    - `bg-[#111]` / `bg-[#111111]` → `bg-surface` or `bg-card` (semantic name from T2)
    - `bg-[#0a0a0a]` → `bg-background` (if any remain after T1)
    - `border-[#1a1a1a]` / `border-[#222]` / `border-[#222222]` → `border-border` or `border-subtle`
    - `text-[#888]` / `text-[#aaa]` → `text-secondary`
    - `text-[#666]` → `text-tertiary`
    - `text-[#555]` / `text-[#444]` / `text-[#333]` → `text-tertiary` or `text-muted`
    - `text-[#00d4aa]` / `bg-[#00d4aa]` → `text-accent` / `bg-accent`
    - `hover:bg-[#00b894]` → `hover:bg-accent/80` or `hover:bg-accent-hover`
    - `bg-[#00d4aa]/10` → `bg-accent/10`
    - `border-[#00d4aa]/30` → `border-accent/30`
    - `focus:border-[#00d4aa]` → `focus:border-accent`
    - `placeholder-[#444]` → `placeholder-muted`
  - Use `ast_grep_replace` or systematic find-replace for bulk migration
  - After migration, verify ZERO hardcoded hex values remain in component files (only `tailwind.config.ts` should have hex)
  - Do NOT change layout structure, component hierarchy, or any logic — purely color token migration

  **Must NOT do**:
  - Do NOT redesign layouts or change component structure (that's Wave 1)
  - Do NOT change animation or interaction behavior
  - Do NOT rename CSS classes beyond hex → token replacement

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Tedious but requires careful attention — wrong token mapping breaks visual hierarchy. Needs to read T2's output to know exact token names.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 0 (sequential, after T2)
  - **Blocks**: All Wave 1 tasks (T4-T9)
  - **Blocked By**: T2

  **References**:

  **Pattern References**:
  - `frontend/tailwind.config.ts` (as updated by T2) — Source of truth for token names
  - Every `.tsx` file in `frontend/app/` and `frontend/components/` — Files to migrate

  **Why Each Reference Matters**:
  - T2's tailwind config defines the exact token names — this task mechanically applies them everywhere

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero hardcoded hex colors in components
    Tool: Bash (grep)
    Preconditions: All files migrated
    Steps:
      1. grep -rE "\[#[0-9a-fA-F]{3,8}\]" frontend/app/ frontend/components/ --include="*.tsx" | grep -v "tailwind.config" | wc -l
      2. Assert output is "0"
    Expected Result: No hardcoded hex values in any component file
    Failure Indicators: Count > 0
    Evidence: .sisyphus/evidence/task-3-hex-migration.txt

  Scenario: Build passes after migration
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: All token references resolve correctly
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES
  - Message: `refactor(frontend): migrate all hardcoded hex to semantic tokens`
  - Files: All `.tsx` files
  - Pre-commit: `cd frontend && bun run build`

- [ ] 4. Home page editorial redesign

  **What to do**:
  - Completely rethink `app/page.tsx` layout with minimal editorial aesthetic:
    - **Hero**: Replace centered-everything layout with asymmetric editorial composition. Left-aligned headline with dramatic typography using the display font. Subtext should breathe with generous line-height.
    - **Three-party section**: Break the identical 3-card grid. Consider editorial approach — columns with varying widths, or stacked sections with typographic differentiation. Remove emoji icons (🧠⚡💰) — they're AI-slop tells. Use typography or subtle marks instead.
    - **Stats bar**: Remove the "hero metric" layout (big number, small label in a grid). Integrate stats as inline running text or a footnote-style bar — editorial, not dashboard.
    - **CTAs**: Primary action should be unmistakable. Secondary should be clearly subordinate. No rounded-xl pill buttons — consider more editorial button styles.
  - Follow the `.impeccable.md` design principles throughout
  - Use semantic tokens from `tailwind.config.ts` — no hardcoded hex
  - Load the `frontend-design` skill for anti-slop guidelines

  **Must NOT do**:
  - Do NOT change the routes or links — same destinations, new presentation
  - Do NOT add animations (that's Wave 2)
  - Do NOT add responsive breakpoints

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Full page redesign requiring strong design judgment + implementation
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Anti-slop guidelines, typography principles, layout composition rules

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T5, T6, T7, T8, T9)
  - **Blocks**: T12, T13
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/app/page.tsx` (full file, 92 lines) — Current implementation to completely redesign
  - `.impeccable.md` — Design context and principles (created by T2)
  - `frontend/tailwind.config.ts` — Semantic tokens to use (from T2)

  **External References**:
  - Monocle magazine / Bloomberg Terminal — editorial density inspiration
  - https://stripe.com — clean information hierarchy reference

  **Why Each Reference Matters**:
  - Current `page.tsx` shows what NOT to do — centered hero, emoji icons, identical cards, metric grid
  - `.impeccable.md` provides the design direction this page must follow

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Home page renders with new editorial design
    Tool: Playwright
    Preconditions: Dev server running on port 3000
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for page load (timeout: 10s)
      3. Screenshot full page
      4. Assert: no elements with text "🧠" or "⚡" or "💰" visible (emoji removed)
      5. Assert: page contains text "AI Agents" or "Pay Per Second" (core messaging preserved)
      6. Assert: "Browse Agents" link exists and points to /marketplace
    Expected Result: Editorial layout visible, no emoji, links functional
    Failure Indicators: Emoji still visible, links broken, old layout remnants
    Evidence: .sisyphus/evidence/task-4-home-page.png

  Scenario: No AI-slop patterns on home page
    Tool: Bash (grep)
    Steps:
      1. grep -c "rounded-xl" frontend/app/page.tsx
      2. Note count (should be dramatically reduced from current ~8)
      3. grep -c "grid-cols-3" frontend/app/page.tsx
      4. Assert: no uniform 3-column grids (editorial uses varied layouts)
    Expected Result: Card-heavy patterns replaced with typographic hierarchy
    Evidence: .sisyphus/evidence/task-4-slop-check.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign home page — editorial layout`
  - Files: `frontend/app/page.tsx`
  - Pre-commit: `cd frontend && bun run build`

- [ ] 5. NavBar redesign

  **What to do**:
  - Restyle `components/NavBar.tsx` to match editorial aesthetic:
    - "Riverting" wordmark: use display font, consider all-caps or small-caps with letter-spacing
    - Navigation links: editorial style — could be uppercase small text, or serif with proper weight
    - Active state: replace `text-[#00d4aa]` with subtle editorial indicator (underline, weight change, or dot) — not colored text
    - `ConnectWalletButton`: RainbowKit provides its own styling via the theme (updated in T2). Ensure it fits the nav visually. May need a wrapper with spacing adjustments.
    - Overall: flat, minimal, no heavy borders. Consider a subtle bottom separator or none at all.
  - Use semantic tokens — no hardcoded hex

  **Must NOT do**:
  - Do NOT change navigation structure or routes
  - Do NOT modify `ConnectWalletButton.tsx` internals (RainbowKit component)
  - Do NOT add hamburger menu or mobile nav

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small component (39 lines), straightforward restyling
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Typography and navigation best practices

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T4, T6, T7, T8, T9)
  - **Blocks**: T12, T13
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/components/NavBar.tsx` (full file, 39 lines) — Current nav to restyle
  - `.impeccable.md` — Design direction

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: NavBar renders with editorial styling
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Screenshot the nav area (top 80px)
      3. Assert: "Riverting" text visible
      4. Assert: "Browse Agents" link visible
      5. Assert: "Upload Agent" link visible
    Expected Result: Clean editorial nav, no teal accents
    Evidence: .sisyphus/evidence/task-5-navbar.png

  Scenario: No old hex colors in NavBar
    Tool: Bash (grep)
    Steps:
      1. grep -c "\[#" frontend/components/NavBar.tsx
      2. Assert output is "0"
    Expected Result: All colors use semantic tokens
    Evidence: .sisyphus/evidence/task-5-tokens.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign NavBar — editorial style`
  - Files: `frontend/components/NavBar.tsx`

- [ ] 6. Marketplace page + AgentCard + CategoryFilter redesign

  **What to do**:
  - Redesign `app/marketplace/page.tsx`:
    - Page title: editorial typography, left-aligned, generous spacing
    - Subtitle: refined, not the generic gray text
  - Redesign `components/marketplace/AgentCard.tsx`:
    - Break the identical-cards pattern — cards should still be a grid but with more editorial feel
    - Remove the "card in card" nesting (no inner border boxes)
    - Category tag: instead of pill badge, consider editorial label (italic, small-caps, or simple text)
    - Pricing: cleaner presentation, less dashboard-like
    - Hover: more intentional — not just a border color change
  - Redesign `components/marketplace/CategoryFilter.tsx`:
    - Pill filters can stay as interactive elements but should match editorial tone
    - Active state: editorial indicator, not filled teal pill
  - Ensure `AgentCard` still triggers `onClick` prop correctly (opens modal)

  **Must NOT do**:
  - Do NOT change `AgentDetailModal.tsx` layout (that's T11 for flow fix)
  - Do NOT change data model or props
  - Do NOT add pagination or search

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Multi-component redesign requiring cohesive visual language across card, filter, and page
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Card design anti-patterns, visual hierarchy principles

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T4, T5, T7, T8, T9)
  - **Blocks**: T11, T12
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/app/marketplace/page.tsx` (48 lines) — Page wrapper
  - `frontend/components/marketplace/AgentCard.tsx` (52 lines) — Card to redesign
  - `frontend/components/marketplace/CategoryFilter.tsx` (24 lines) — Filter to restyle
  - `frontend/lib/utils.ts` (created by T1) — Import `formatRate`, `PLATFORM_FEE`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Marketplace renders with editorial card design
    Tool: Playwright
    Preconditions: Dev server running, backend serving agents
    Steps:
      1. Navigate to http://localhost:3000/marketplace
      2. Wait for agents to load (timeout: 10s)
      3. Screenshot full page
      4. Click first agent card
      5. Assert: AgentDetailModal opens (modal visible)
    Expected Result: Editorial card layout, click still opens modal
    Failure Indicators: Old teal cards, click handler broken, modal doesn't open
    Evidence: .sisyphus/evidence/task-6-marketplace.png

  Scenario: No hardcoded hex in marketplace components
    Tool: Bash (grep)
    Steps:
      1. grep -c "\[#" frontend/components/marketplace/AgentCard.tsx frontend/components/marketplace/CategoryFilter.tsx frontend/app/marketplace/page.tsx
      2. Assert all counts are "0"
    Expected Result: Pure semantic tokens
    Evidence: .sisyphus/evidence/task-6-tokens.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign marketplace — editorial cards and filters`
  - Files: `frontend/app/marketplace/page.tsx`, `frontend/components/marketplace/AgentCard.tsx`, `frontend/components/marketplace/CategoryFilter.tsx`

- [ ] 7. Curator dashboard + layout + upload form redesign

  **What to do**:
  - Restyle `app/curator/layout.tsx` wallet guard page:
    - Replace 🔒 emoji with typographic or iconographic solution
    - Make the "connect wallet" prompt feel editorial and trustworthy, not generic
  - Restyle `app/curator/page.tsx` dashboard:
    - Break the 3-metric card grid (Total Earned / Active Agents / Pending Payout) — use editorial layout
    - Agent list: more like a table/register than card list. Each agent row should be scannable.
    - "Upload Agent" CTA: clear but not screaming
    - Empty state: editorial "No agents yet" — guide user with personality
  - Restyle `app/curator/agents/new/page.tsx` upload form:
    - Form inputs: editorial form styling — clean borders, proper labels, refined spacing
    - Button states: the existing 3-state button pattern (`loading ? 'Uploading...' : !address ? 'Connect Wallet First' : 'Upload Agent →'`) is good — keep it, just restyle
    - **Token-level update + layout refinement only** — don't overhaul the form structure
  - Use semantic tokens throughout

  **Must NOT do**:
  - Do NOT change form validation logic or API calls
  - Do NOT change the wallet guard logic (if/else `isConnected`)
  - Do NOT add new form fields

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Three related pages forming the curator experience — need cohesive design
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Form design, dashboard patterns, empty state guidelines

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T4, T5, T6, T8, T9)
  - **Blocks**: T12, T13
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/app/curator/layout.tsx` (25 lines) — Wallet guard with 🔒 emoji to replace
  - `frontend/app/curator/page.tsx` (91 lines) — Dashboard with metric cards and agent list
  - `frontend/app/curator/agents/new/page.tsx` (153 lines) — Upload form with state-aware button at line 143-148
  - `frontend/lib/utils.ts` — Import shared formatRate, PLATFORM_FEE

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Curator pages render with editorial design
    Tool: Playwright
    Preconditions: Dev server running, wallet NOT connected
    Steps:
      1. Navigate to http://localhost:3000/curator
      2. Assert: Wallet guard page visible (not 🔒 emoji)
      3. Screenshot wallet guard page
      4. Navigate to http://localhost:3000/curator/agents/new
      5. Assert: Form elements visible
      6. Screenshot form page
    Expected Result: Editorial guard page (no emoji), clean form design
    Evidence: .sisyphus/evidence/task-7-curator.png

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Zero errors
    Evidence: .sisyphus/evidence/task-7-build.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign curator dashboard and upload form`
  - Files: `frontend/app/curator/layout.tsx`, `frontend/app/curator/page.tsx`, `frontend/app/curator/agents/new/page.tsx`

- [ ] 8. Query page redesign

  **What to do**:
  - Restyle `app/query/page.tsx` (224 lines — largest page):
    - Page header: editorial typography
    - Agent selector: clean dropdown, not the dark card wrapper
    - Query type selector: break the 3-card grid. Consider radio-like selection, tab-style, or segmented control — something more editorial than "3 identical cards"
    - Question input (for "ask" type): editorial text input — generous padding, clean border
    - State transitions (idle → requires-payment → paying → paid → error):
      - `idle`: Clean CTA button
      - `requires-payment`: Payment info displayed clearly, not in a card-box. Amount prominent.
      - `paying`: Spinner is fine but should match editorial style (not the `animate-spin border-[#00d4aa]` tell)
      - `paid`: Result displayed with clear typography. Proof hashes in a refined monospace section.
      - `error`: Clear, helpful, non-alarming error state
  - This page has a good multi-state flow — preserve all states, just restyle them

  **Must NOT do**:
  - Do NOT change API calls or state machine logic
  - Do NOT change the x402 payment flow
  - Do NOT restructure the state machine

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex page with 5 states — each needs distinct editorial treatment
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Multi-state UI patterns, form design, loading states

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T4, T5, T6, T7, T9)
  - **Blocks**: T12, T13
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/app/query/page.tsx` (224 lines) — Full page to redesign, preserving all state logic
  - Lines 7-11: `QUERY_TYPES` constant — data source for query options
  - Lines 26-71: `handleQuery` and `handlePay` — logic to preserve exactly
  - Lines 96-113: Query type selector cards — break this pattern
  - Lines 126-220: State-dependent UI blocks — restyle each

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Query page renders all states correctly
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/query
      2. Screenshot idle state
      3. Assert: agent selector visible, query type options visible, submit button visible
      4. Assert: no elements with class containing "[#00d4aa]" (old accent)
    Expected Result: Editorial design, all interactive elements present
    Failure Indicators: Old teal accent, broken selector, missing states
    Evidence: .sisyphus/evidence/task-8-query-idle.png

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Zero errors
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign query page — editorial multi-state UI`
  - Files: `frontend/app/query/page.tsx`

- [ ] 9. Session page structure + layout redesign

  **What to do**:
  - Redesign `app/session/[id]/page.tsx` LAYOUT AND STRUCTURE (not animations — that's T10):
    - Break the 3-column identical card grid into a more editorial information hierarchy
    - Header: session ID + status badge — editorial, not the card-header pattern
    - Salary display area: make it the clear focal point — large, prominent, not just another card
    - Agent work timeline: editorial presentation — think newspaper column or feed, not card-box
    - Proof heartbeat timeline: compact, data-dense section — think terminal log or ticker tape
    - Settlement section (shown on stop): clear, prominent, trustworthy display of financial info
  - Restyle session sub-components:
    - `components/session/SalaryTicker.tsx` — layout and typography (NOT animation yet)
    - `components/session/ProofHeartbeatTimeline.tsx` — list layout, entry formatting
    - `components/session/AgentWorkTimeline.tsx` — timeline layout, step formatting, kind-color mapping to use semantic tokens
    - `components/session/StreamStatusBadge.tsx` — editorial status indicator
    - `components/session/CostBreakdown.tsx` — clean rate display
  - Add static mock data in the component for when `id !== 'new'` but no SSE stream is connected — so dev can see the layout with content. Wrap in a `const MOCK_DATA = ...` at top of file, used only when `steps.length === 0 && process.env.NODE_ENV === 'development'`.

  **Must NOT do**:
  - Do NOT add animations or transitions (that's T10)
  - Do NOT change SSE connection logic
  - Do NOT change the data model or props

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Multi-component page redesign, needs editorial composition skills
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Information hierarchy, data visualization, editorial layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T4, T5, T6, T7, T8)
  - **Blocks**: T10 (animation depends on structure)
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - `frontend/app/session/[id]/page.tsx` (147 lines) — Page structure to redesign
  - `frontend/components/session/SalaryTicker.tsx` (28 lines) — Ticker layout
  - `frontend/components/session/ProofHeartbeatTimeline.tsx` (32 lines) — Proof list layout
  - `frontend/components/session/AgentWorkTimeline.tsx` (37 lines) — Work step timeline, `KIND_COLORS` at lines 8-14 need semantic token migration
  - `frontend/components/session/StreamStatusBadge.tsx` (14 lines) — Status pill, `STATUS_CONFIG` at lines 1-5
  - `frontend/components/session/CostBreakdown.tsx` (28 lines) — Rate breakdown

  **Why Each Reference Matters**:
  - The session page is the **demo showcase** — this is where judges will spend the most time. The layout must make the streaming payment concept viscerally clear.
  - `KIND_COLORS` and `STATUS_CONFIG` have hardcoded hex that must map to semantic tokens

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Session page renders with editorial layout and mock data
    Tool: Playwright
    Preconditions: Dev server running (backend NOT needed — mock data present)
    Steps:
      1. Navigate to http://localhost:3000/session/demo-test
      2. Screenshot full page
      3. Assert: salary display visible and prominent
      4. Assert: page does NOT have three identical card boxes side by side
      5. Assert: mock data entries visible (development mode)
    Expected Result: Editorial session layout, focal point on salary, data-dense proof section
    Failure Indicators: Three identical cards, old layout remnants, empty/blank sections
    Evidence: .sisyphus/evidence/task-9-session-layout.png

  Scenario: Session fallback for invalid ID
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/session/new
      2. Assert: NOT showing dead "No Active Session" text
      3. Assert: user is redirected to /marketplace OR shown a helpful message with link
    Expected Result: No dead-end page
    Evidence: .sisyphus/evidence/task-9-session-fallback.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): redesign session page — editorial layout with mock data`
  - Files: `frontend/app/session/[id]/page.tsx`, all session component files

- [ ] 10. Session page animations — SalaryTicker, ProofTimeline, AgentWork

  **What to do**:
  - Add kinetic, alive-feeling animations to the session page components (built on T9's editorial layout):
  - **SalaryTicker animation**:
    - Smooth number counting animation — digits should roll/interpolate, not jump
    - Consider CSS `@property` for animating CSS custom properties (number interpolation)
    - OR: use `requestAnimationFrame` with easing for smooth value transitions
    - The active state's pulse should feel organic — subtle breathing, not the basic `animate-pulse`
    - When status changes (active → paused → stopped), the transition should be visible and smooth
  - **ProofHeartbeatTimeline animation**:
    - New proof entries should animate IN from top/left with a subtle slide+fade
    - Each proof dot should flash/pulse briefly on arrival then settle
    - Consider a subtle "heartbeat" rhythm — a recurring visual pulse that shows the system is alive
    - The timeline should feel like a live ticker, not a static list
  - **AgentWorkTimeline animation**:
    - New steps should animate in with staggered entrance (each step appears with slight delay)
    - Different `kind` types (api, rpc, metric, commentary, finding) could have subtly different entrance styles
    - The border-left indicator should draw/grow on entrance
  - **StreamStatusBadge animation**:
    - Status changes should transition smoothly (color cross-fade)
    - Active state: subtle pulsing glow or breathing animation
    - Paused: gentle warning pulse
  - **Framer Motion**: Allowed ONLY on this page. Install if not present (`bun add framer-motion` in frontend). Use for entrance animations on timeline items. Use CSS animations for everything else (ticker, pulse, transitions).
  - **Performance**: All animations must use `transform` and `opacity` only — no animating layout properties (width, height, padding, margin)

  **Must NOT do**:
  - Do NOT use Framer Motion outside session page components
  - Do NOT animate layout properties
  - Do NOT use bounce or elastic easing — use smooth deceleration (ease-out-quart or similar)
  - Do NOT add `animate-pulse` on anything — create custom animations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex animation work requiring both creative vision and technical performance awareness
  - **Skills**: [`frontend-design`, `animate`]
    - `frontend-design`: Motion design principles, performance guidelines
    - `animate`: Specialized animation implementation guidance

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T11)
  - **Blocks**: T12
  - **Blocked By**: T9

  **References**:

  **Pattern References**:
  - `frontend/components/session/SalaryTicker.tsx` (as redesigned by T9) — Add number animation
  - `frontend/components/session/ProofHeartbeatTimeline.tsx` (as redesigned by T9) — Add entry animations
  - `frontend/components/session/AgentWorkTimeline.tsx` (as redesigned by T9) — Add step entrance
  - `frontend/components/session/StreamStatusBadge.tsx` (as redesigned by T9) — Add status transitions

  **External References**:
  - CSS `@property` for number animation: https://developer.mozilla.org/en-US/docs/Web/CSS/@property
  - Framer Motion `AnimatePresence` for list items: https://www.framer.com/motion/animate-presence/

  **Why Each Reference Matters**:
  - Session page is the demo showcase — animations make "streaming payment" tangible and exciting
  - `@property` enables pure CSS number interpolation for the salary ticker (no JS overhead)
  - `AnimatePresence` handles enter/exit animations for dynamically added timeline items

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Salary ticker animates smoothly
    Tool: Playwright
    Preconditions: Dev server running, session page with mock data
    Steps:
      1. Navigate to http://localhost:3000/session/demo-test
      2. Wait 3 seconds
      3. Take 3 screenshots at 1-second intervals
      4. Compare salary display value across screenshots — should show incrementing numbers
      5. Verify no layout shift during number changes
    Expected Result: Numbers visually interpolate/count up, no jumping
    Failure Indicators: Numbers jump discretely, layout shifts on digit change
    Evidence: .sisyphus/evidence/task-10-ticker-animation-1.png, task-10-ticker-animation-2.png, task-10-ticker-animation-3.png

  Scenario: Proof entries animate in
    Tool: Playwright
    Preconditions: Dev server, mock proofs loading
    Steps:
      1. Navigate to http://localhost:3000/session/demo-test
      2. Observe proof heartbeat section
      3. Screenshot after initial load
      4. Assert: proof entries are visible with styling
    Expected Result: Proof entries present with visual distinction
    Evidence: .sisyphus/evidence/task-10-proof-animation.png

  Scenario: No animate-pulse in session components
    Tool: Bash (grep)
    Steps:
      1. grep -r "animate-pulse" frontend/components/session/ --include="*.tsx"
      2. Assert 0 matches
    Expected Result: No default pulse animations — all custom
    Evidence: .sisyphus/evidence/task-10-no-pulse.txt

  Scenario: Build passes with framer-motion
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Build succeeds
    Evidence: .sisyphus/evidence/task-10-build.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): add kinetic animations to live session page`
  - Files: All session component files, `frontend/package.json` (framer-motion dep)
  - Pre-commit: `cd frontend && bun run build`

- [ ] 11. AgentDetailModal wallet flow fix + createSession integration

  **What to do**:
  - Complete rewrite of `components/marketplace/AgentDetailModal.tsx` click handler:
    - Import `useAccount` from `wagmi` and `useConnectModal` from `@rainbow-me/rainbowkit`
    - Import `createSession` from `@/lib/api`
    - Add state: `const [starting, setStarting] = useState(false)` and `const [error, setError] = useState('')`
    - Read wallet state: `const { isConnected, address } = useAccount()`
    - Read connect modal: `const { openConnectModal } = useConnectModal()`
    - **Button logic** (3 states):
      - `!isConnected` → label: "Connect Wallet to Start", onClick: `openConnectModal?.()` — open RainbowKit modal, do nothing else
      - `isConnected && !starting` → label: "Start Session →", onClick: call `handleStartSession()`
      - `starting` → label: "Starting…", disabled
    - **`handleStartSession` function**:
      ```
      setStarting(true); setError('')
      try {
        const session = await createSession(agent.id, address!, agent.curator_rate_per_second)
        router.push(`/session/${session.id}`)
      } catch (e) {
        setError(e.message || 'Failed to create session')
        setStarting(false)
      }
      ```
    - **Error display**: Inline error text below the button when `error` is non-empty
    - **Remove** the old inline `fetch` / `Date.now()` logic entirely
  - Also restyle the modal to match editorial design (from T2/T3 tokens):
    - Clean typography for agent name, description, pricing
    - The pricing breakdown should be clean and trustworthy
    - Modal backdrop: subtle, not heavy `bg-black/80`
    - Close button: refined, not the raw `×` character
  - Update `frontend/lib/api.ts`:
    - Change `createSession` signature to accept dynamic rates:
      ```typescript
      export async function createSession(agentId: number, userWallet: string, curatorRate: number) {
        const totalRate = curatorRate + PLATFORM_FEE
        const res = await fetch(`${API_BASE}/api/sessions/0/spawn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            userWallet,
            totalRate,
            curatorRate,
            platformFee: PLATFORM_FEE,
            depositAmount: totalRate * 3600, // 1 hour deposit
          }),
        })
        if (!res.ok) throw new Error('Failed to create session')
        return res.json()
      }
      ```
    - Import `PLATFORM_FEE` from `./utils`
  - Update `frontend/app/session/[id]/page.tsx`:
    - When `id === 'new'`: redirect to `/marketplace` using `router.replace('/marketplace')` instead of showing dead-end page
    - Keep the existing SSE streaming logic for valid session IDs

  **Must NOT do**:
  - Do NOT auto-chain `openConnectModal` → `createSession` (Oracle explicitly warned against this)
  - Do NOT add SIWE/signature verification (just pass address as-is, add TODO comment)
  - Do NOT add chain-switching logic (RainbowKit handles this natively)
  - Do NOT add balance/allowance checks (add TODO comment for production)
  - Do NOT modify the backend endpoint contract

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Mix of logic fix (wallet flow) + API integration + UI restyling. Needs careful state management.
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Modal design, button state patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T10)
  - **Blocks**: T12
  - **Blocked By**: T6 (needs marketplace components restyled first)

  **References**:

  **Pattern References**:
  - `frontend/components/marketplace/AgentDetailModal.tsx` (full file) — Complete rewrite of handler
  - `frontend/app/curator/agents/new/page.tsx:143-148` — State-aware button pattern to follow: `loading ? 'X' : !address ? 'Y' : 'Z'`
  - `frontend/app/curator/layout.tsx:3-7` — `useAccount` import and usage pattern
  - `frontend/lib/api.ts:15-23` — `createSession` function to update
  - `frontend/lib/utils.ts` (from T1) — `PLATFORM_FEE` to import
  - `frontend/app/session/[id]/page.tsx:79-91` — Dead-end fallback to replace with redirect

  **API/Type References**:
  - `frontend/components/marketplace/AgentCard.tsx:1-9` — Agent interface definition with `curator_rate_per_second`

  **External References**:
  - RainbowKit `useConnectModal`: https://www.rainbowkit.com/docs/modal-hooks — Programmatic modal control
  - wagmi `useAccount`: https://wagmi.sh/react/api/hooks/useAccount — Wallet state hook

  **Why Each Reference Matters**:
  - `curator/agents/new/page.tsx` button pattern is the existing best-practice in this codebase for state-aware wallet buttons — copy this pattern exactly
  - `curator/layout.tsx` shows the `useAccount` import pattern already used in the project
  - `lib/api.ts` createSession has the right endpoint but wrong parameter handling — must be updated

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Button shows "Connect Wallet" when disconnected
    Tool: Playwright
    Preconditions: Dev server running, wallet NOT connected
    Steps:
      1. Navigate to http://localhost:3000/marketplace
      2. Wait for agents to load
      3. Click first agent card
      4. Assert: modal opens
      5. Assert: button text contains "Connect Wallet" (not "Start Session")
      6. Screenshot modal
    Expected Result: Button prompts wallet connection when disconnected
    Failure Indicators: Button says "Start Session" without wallet, or modal doesn't open
    Evidence: .sisyphus/evidence/task-11-disconnected-modal.png

  Scenario: No inline fetch in AgentDetailModal
    Tool: Bash (grep)
    Steps:
      1. grep -c "fetch(" frontend/components/marketplace/AgentDetailModal.tsx
      2. Assert output is "0" (all API calls go through lib/api.ts)
      3. grep -c "Date.now()" frontend/components/marketplace/AgentDetailModal.tsx
      4. Assert output is "0" (no timestamp as session ID)
    Expected Result: No inline fetch, no Date.now() hack
    Evidence: .sisyphus/evidence/task-11-no-inline-fetch.txt

  Scenario: createSession uses dynamic rates
    Tool: Bash (grep)
    Steps:
      1. grep "totalRate: 1300" frontend/lib/api.ts
      2. Assert 0 matches (no hardcoded 1300)
      3. grep "curatorRate" frontend/lib/api.ts
      4. Assert ≥ 1 match (parameter used)
    Expected Result: Rates derived from agent, not hardcoded
    Evidence: .sisyphus/evidence/task-11-dynamic-rates.txt

  Scenario: /session/new redirects to marketplace
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/session/new
      2. Wait for redirect (timeout: 5s)
      3. Assert: current URL is http://localhost:3000/marketplace
    Expected Result: No dead-end page, clean redirect
    Failure Indicators: Still shows "No Active Session" dead page
    Evidence: .sisyphus/evidence/task-11-redirect.png

  Scenario: Modal shows error on API failure
    Tool: Playwright
    Preconditions: Dev server running, backend DOWN
    Steps:
      1. Navigate to /marketplace, open agent modal
      2. If connected, click "Start Session"
      3. Assert: error message appears in modal (not a page crash)
      4. Assert: button returns to "Start Session →" (not stuck on "Starting…")
    Expected Result: Graceful error handling in modal
    Evidence: .sisyphus/evidence/task-11-error-state.png

  Scenario: useAccount and useConnectModal are imported
    Tool: Bash (grep)
    Steps:
      1. grep "useAccount" frontend/components/marketplace/AgentDetailModal.tsx
      2. Assert ≥ 1 match
      3. grep "useConnectModal" frontend/components/marketplace/AgentDetailModal.tsx
      4. Assert ≥ 1 match
    Expected Result: Both hooks imported and used
    Evidence: .sisyphus/evidence/task-11-hooks.txt
  ```

  **Commit**: YES
  - Message: `fix(frontend): wallet-aware Start Session with createSession integration`
  - Files: `frontend/components/marketplace/AgentDetailModal.tsx`, `frontend/lib/api.ts`, `frontend/app/session/[id]/page.tsx`
  - Pre-commit: `cd frontend && bun run build`

- [ ] 12. Loading skeletons + empty states across all pages

  **What to do**:
  - Add loading skeletons (replacing bare "Loading..." text) to:
    - `app/marketplace/page.tsx` — skeleton card grid while agents load
    - `app/curator/page.tsx` — skeleton rows while agent list loads
    - `app/query/page.tsx` — skeleton for agent selector while loading
  - Redesign empty states to be helpful and guide users:
    - `app/marketplace/page.tsx` — if no agents: explain what agents are, link to curator
    - `app/curator/page.tsx` — if no agents: "Upload your first agent" with clear CTA and brief explanation of what curators earn
    - `app/session/[id]/page.tsx` — waiting states ("Waiting for agent output...", "Waiting for proofs...") should feel intentional, not broken
    - `app/query/page.tsx` error state — more helpful, suggest retry
  - Loading skeletons should use CSS animations (shimmer/pulse) with semantic tokens — no hardcoded colors
  - Create skeleton components inline (no separate component library — keep it simple for hackathon)
  - Empty states should have editorial tone — helpful, not clinical

  **Must NOT do**:
  - Do NOT add a toast/notification system
  - Do NOT create a separate skeleton component library
  - Do NOT add loading spinners (use skeleton shimmer instead, except for the paying state spinner in query page which is fine)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Visual implementation of loading/empty states with editorial design sensibility
  - **Skills**: [`frontend-design`, `harden`]
    - `frontend-design`: Empty state guidelines, loading pattern best practices
    - `harden`: Edge case handling, resilience patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T13)
  - **Blocks**: F1-F4
  - **Blocked By**: T4-T11 (all page redesigns must be complete)

  **References**:

  **Pattern References**:
  - `frontend/app/marketplace/page.tsx:32-33` — Current bare "Loading agents..." text to replace
  - `frontend/app/curator/page.tsx:62-69` — Current minimal empty state
  - `frontend/components/session/ProofHeartbeatTimeline.tsx:15-16` — "Waiting for proofs..." text
  - `frontend/components/session/AgentWorkTimeline.tsx:21-23` — "Waiting for agent output..." text
  - `frontend/app/query/page.tsx:215-219` — Error state with bare "Query failed" text

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Marketplace shows skeleton while loading
    Tool: Playwright
    Preconditions: Dev server running, slow network simulation or backend delay
    Steps:
      1. Navigate to http://localhost:3000/marketplace
      2. Screenshot immediately (before agents load)
      3. Assert: skeleton elements visible (not "Loading agents..." text)
    Expected Result: Shimmer skeleton cards visible during load
    Failure Indicators: Bare "Loading agents..." text still present
    Evidence: .sisyphus/evidence/task-12-marketplace-skeleton.png

  Scenario: No bare "Loading..." strings remain
    Tool: Bash (grep)
    Steps:
      1. grep -rn "Loading\.\.\." frontend/app/ frontend/components/ --include="*.tsx"
      2. Assert 0 matches (all replaced with skeletons)
    Expected Result: No generic loading text
    Evidence: .sisyphus/evidence/task-12-no-loading-text.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(frontend): add loading skeletons and meaningful empty states`
  - Files: All page files, session components
  - Pre-commit: `cd frontend && bun run build`

- [ ] 13. UX copy pass — labels, microcopy, empty state text

  **What to do**:
  - Review and improve all user-facing text across the entire frontend:
    - **Page titles**: Make them editorial and distinctive, not generic ("Agent Marketplace" → something with more personality)
    - **Subtitles/descriptions**: Should add value, not repeat the title
    - **Button labels**: Clear, action-oriented, consistent verb forms across pages
    - **Empty states**: Helpful, guiding, with personality (written by T12 — this task refines the copy)
    - **Error messages**: Non-blaming, actionable ("Failed to create session" → "Couldn't start the session — the server may be busy. Try again?")
    - **Status labels**: StreamStatusBadge labels (RUNNING, PAUSED, STOPPED) — consider more descriptive alternatives
    - **Wallet guard text**: curator layout's "Connect wallet to access..." — make it welcoming, not blocking
    - **Form labels**: curator upload form — helpful, clear, no jargon without explanation
    - **Pricing labels**: "Curator rate", "Platform fee", "You pay" — are these clear to first-time users?
  - **Tone**: Precise but approachable. Not corporate, not casual. Think Bloomberg meets Stripe — authoritative but human.
  - **Meta description**: Update `app/layout.tsx` metadata description if it's generic

  **Must NOT do**:
  - Do NOT change component structure or styling (only text content)
  - Do NOT add tooltips or help popovers (scope creep)
  - Do NOT translate to other languages

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Pure UX writing task — no code structure changes, only text content
  - **Skills**: [`clarify`]
    - `clarify`: UX copy improvement, microcopy best practices, label clarity

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T12)
  - **Blocks**: F1-F4
  - **Blocked By**: T4-T11 (all pages must be restyled first so copy context is clear)

  **References**:

  **Pattern References**:
  - Every page file — all user-facing strings
  - `frontend/app/layout.tsx:9-12` — Metadata title and description
  - `frontend/components/session/StreamStatusBadge.tsx:2-4` — Status labels
  - `frontend/app/curator/layout.tsx:14-17` — Wallet guard copy
  - `frontend/app/query/page.tsx:7-11` — Query type labels and descriptions

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No generic "Loading..." or "No data" copy
    Tool: Bash (grep)
    Steps:
      1. grep -rn "Loading\.\.\." frontend/ --include="*.tsx"
      2. grep -rn "No data" frontend/ --include="*.tsx"
      3. grep -rn "nothing here" frontend/ --include="*.tsx"
      4. Assert all return 0 matches
    Expected Result: All generic copy replaced with meaningful alternatives
    Evidence: .sisyphus/evidence/task-13-copy-check.txt

  Scenario: Error messages are actionable
    Tool: Bash (grep)
    Steps:
      1. grep -rn "Failed to" frontend/ --include="*.tsx"
      2. Review each match — should include recovery guidance, not just failure statement
    Expected Result: Error messages guide user toward resolution
    Evidence: .sisyphus/evidence/task-13-error-copy.txt

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
      2. Assert exit code 0
    Expected Result: Zero errors (text-only changes shouldn't break build)
    Evidence: .sisyphus/evidence/task-13-build.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(frontend): UX copy polish — clearer labels, editorial tone`
  - Files: All page files with text changes
  - Pre-commit: `cd frontend && bun run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + `npx tsc --noEmit`. Review all changed files for: `as any` additions, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: are hardcoded hex values gone? Are semantic tokens used consistently? Any Inter font remnants?
  Output: `Build [PASS/FAIL] | TypeCheck [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for UI, load skill `frontend-design` for anti-slop check)
  Start dev server. Navigate every page: `/`, `/marketplace`, `/curator`, `/curator/agents/new`, `/query`, `/session/test-id`. Screenshot each. Verify: no teal `#00d4aa`, no `bg-[#111]` card walls, new font visible, animations working on session page. Test wallet flow: click Start Session without wallet → should show connect prompt. Save screenshots to `.sisyphus/evidence/final-qa/`.
  Output: `Pages [N/N pass] | Wallet Flow [PASS/FAIL] | Anti-Slop [PASS/FAIL] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 match. Check "Must NOT do" compliance: no backend changes, no mobile styles, no new routes, no test files. Flag any unaccounted changes.
  Output: `Tasks [N/N compliant] | Must-NOT [CLEAN/N violations] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

Each wave gets its own commit(s):

| Wave | Commit Message | Files |
|------|---------------|-------|
| 0-T1 | `chore(frontend): extract shared utils, remove duplicate bg overrides` | `lib/utils.ts`, all pages |
| 0-T2 | `feat(frontend): establish editorial design system — palette, fonts, tokens` | `.impeccable.md`, `tailwind.config.ts`, `app/layout.tsx`, `app/providers.tsx` |
| 0-T3 | `refactor(frontend): migrate all hardcoded hex to semantic tokens` | All component files |
| 1 | `feat(frontend): redesign all pages to minimal editorial style` | All page files |
| 2-T10 | `feat(frontend): add kinetic animations to live session page` | Session component files |
| 2-T11 | `fix(frontend): wallet-aware Start Session with createSession integration` | `AgentDetailModal.tsx`, `lib/api.ts`, `session/[id]/page.tsx` |
| 3 | `feat(frontend): add loading skeletons, empty states, UX copy polish` | All pages |

---

## Success Criteria

### Verification Commands
```bash
cd frontend && bun run build          # Expected: exit 0
cd frontend && npx tsc --noEmit       # Expected: exit 0
grep -r "#00d4aa" frontend/app frontend/components --include="*.tsx" | wc -l  # Expected: 0
grep -r "#0a0a0a" frontend/app frontend/components --include="*.tsx" | wc -l  # Expected: 0
grep -r 'bg-\[#111\]' frontend/app frontend/components --include="*.tsx" | wc -l  # Expected: 0
grep -r "from 'next/font/google'" frontend/app/layout.tsx  # Expected: 1 match (new font)
grep -r "function formatRate" frontend/ --include="*.ts" --include="*.tsx" | wc -l  # Expected: 1
grep -r "useAccount" frontend/components/marketplace/AgentDetailModal.tsx | wc -l  # Expected: ≥1
grep -r "useConnectModal" frontend/components/marketplace/AgentDetailModal.tsx | wc -l  # Expected: ≥1
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build passes
- [ ] TypeScript passes
- [ ] No hardcoded hex colors in components
- [ ] New font visible on all pages
- [ ] Wallet flow works end-to-end
- [ ] Session page animations visible
