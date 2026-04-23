# App Shell Refactor Plan

> For Hermes: execute this plan incrementally with tests first, preserving behavior.

**Goal:** Reduce `js/app.js` coupling by extracting app-shell responsibilities into focused ES modules without changing UI behavior.

**Architecture:** Keep the site as a vanilla-JS static SPA. Introduce `js/app/` modules for state, theme, navigation, chapter loading, chapter interactions, search, and lightbox. Keep `js/app.js` as the entrypoint/orchestrator in this phase.

**Tech Stack:** Native ES modules, Node built-in test runner, existing validation script.

---

## Phase 1 scope

1. Add a lightweight test harness for pure app/registry behavior.
2. Extract pure/shared logic first.
3. Extract DOM-facing modules second.
4. Keep public behavior and file paths stable.
5. Verify with `node --test` and `npm run validate`.

## Planned module split

- `js/app/state.js`
- `js/app/theme.js`
- `js/app/navigation.js`
- `js/app/chapter-loader.js`
- `js/app/chapter-content.js`
- `js/app/search.js`
- `js/app/lightbox.js`
- `js/app/dom.js`

## Guardrails

- No framework migration in this phase.
- No content path reorganization in this phase.
- No patch-mechanism redesign in this phase.
- Keep `window.showWelcome` and `window.showToast` compatibility for now.

## Verification

- `node --test tests/**/*.test.mjs`
- `npm run validate`
- `git diff --stat`
