# Draft: UI Overhaul + Marketplace Flow Fix

## Requirements (confirmed)
- Branch: `feat/ui-overhaul` (new worktree)
- Visual direction: **Minimal Editorial** — clean, generous whitespace, magazine-feel typography
- Include marketplace wallet guard flow fix: **YES**
- Automated tests: **NO** — hackathon stage, agent QA scenarios only
- Periodic commits: **YES** — commit after each major skill pass

## Technical Decisions
- Font: Replace Inter with distinctive editorial pairing (display + body)
- Color: Move away from `#00d4aa` teal-on-dark AI slop. Tint neutrals toward brand hue.
- Layout: Break card-in-card pattern. Use typography + spacing for hierarchy instead of boxes.
- Session page: Add life — smooth number animation, proof pulse effects, kinetic feel
- Wallet flow: State-aware button (Connect Wallet to Start / Start Session / Starting…)

## Skill Execution Order (from critique)
1. `/bolder` + `/colorize` — Visual identity overhaul (palette, fonts, neutrals)
2. `/distill` + `/arrange` — Card hierarchy cleanup, flatten box nesting
3. `/animate` + `/overdrive` — Session page comes alive
4. `/harden` + `/onboard` — Dead-end states, loading skeletons, error states
5. `/clarify` — UX copy pass
6. Marketplace flow fix — wallet guard + createSession integration

## Scope Boundaries
- INCLUDE: All frontend components, layout, globals, tailwind config
- INCLUDE: Marketplace wallet flow (AgentDetailModal, session page)
- EXCLUDE: Backend changes
- EXCLUDE: Smart contract changes
- EXCLUDE: SIWE/signature auth (noted as TODO)
- EXCLUDE: On-chain preflight checks (balance, allowance — noted as TODO)
- EXCLUDE: Mobile responsive (separate pass)

## Research Findings
- Wagmi + RainbowKit already set up in providers.tsx
- `useConnectModal()` from RainbowKit available for programmatic modal open
- `createSession()` exists in lib/api.ts but never called from frontend
- Curator layout has wallet guard pattern to copy from
- Session page SSE streaming already works with real session IDs

## Open Questions
- None — all decisions made
