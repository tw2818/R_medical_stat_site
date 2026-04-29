# Chapter 41 P-for-trend Teaching Optimization Plan

**Date:** 2026-04-29
**Chapter:** 1038-p4trend.html (p-for-trend/ p-for-interaction/ per-1-sd)
**Pattern:** Per optimization manual §18 + pssc-guides.js precedent

## Scope

- **Preserve:** ALL original R code blocks (cb1–cb8), existing `subgroupforest` widget, HTML structure
- **Add:** 5 compact teaching guide cards (stat-viz components) with short explanatory paragraphs
- **Do NOT:** add heavy callout blocks, reorganize generated HTML, touch source Quarto files

## Code Block Sequence

`cb1`–`cb8` (contiguous, no gaps):
- cb1: df16_2 data loading + str()
- cb2: glm() P for trend x1 as numeric
- cb3: factor(x1) dummy variables for OR/CI
- cb4: exp(coef()) and exp(confint()) OR extraction
- cb5: x17 interaction term creation
- cb6: glm() with x17 interaction term, method 1
- cb7: lrtest() method 2 (likelihood ratio test)
- cb8: scale() standardization for per-1-sd

## Teaching Components (5 cards)

| data-type | badge | Insertion point |
|---|---|---|
| `p4trend-workflow-guide` | workflow | After intro paragraph "本篇主要介绍..." |
| `p4trend-dummy-guide` | 哑变量 | Before cb3 factor conversion |
| `p4trend-interaction-guide` | 交互 | Before cb5 interaction term creation |
| `p4trend-methods-guide` | 方法对比 | After cb6 output (method 1 result) |
| `p4trend-persd-guide` | per 1 sd | Before cb8 scale standardization |

## Renderer Module

`js/viz/p4trend-guides.js`:
- Pattern: `GUIDE_CARDS` config + `renderGuide()` + scoped CSS id guard + `escapeHtml()`
- Imports: `js/viz/_bundle-presentation-modules.js` + `js/stats-viz.js`

## Interactive Component Check

Static cards suffice — no sliders/select needed. `subgroupforest` is the existing interactive component.

## Verification

```bash
node --test tests/p4trend-content.test.mjs  # 6/6 pass
npm test                                 # 257/257 pass
npm run validate                         # pass
for f in js/*.js js/viz/*.js tests/*.mjs; do node --check "$f"; done  # pass
python3 registry check                   # {} + []
python3 -m http.server 8000 && curl /data/1038-p4trend.html /js/stats-viz.js /js/viz/p4trend-guides.js  # 200/200/200
```