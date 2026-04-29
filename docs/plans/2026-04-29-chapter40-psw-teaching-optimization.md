# Chapter 40 PSW Teaching Optimization Plan

**Date:** 2026-04-29
**Chapter:** 1037-psw.html (倾向性评分：加权)
**Pattern:** Per optimization manual §18 + pssc-guides.js precedent

## Scope

- **Preserve:** ALL original R code blocks (cb1–cb12), existing `psdist` widget, HTML structure
- **Add:** 6 compact teaching guide cards (stat-viz components) with short explanatory paragraphs
- **Do NOT:** add heavy callout blocks, reorganize generated HTML, touch source Quarto files

## Code Block Sequence

`cb1`–`cb12` (contiguous, no gaps):
- cb1: lindner data loading + str()
- cb2: CreateTableOne unadjusted
- cb3: cobalt::bal.tab unadjusted
- cb4: glm() PS model
- cb5: IPTW weight calculation
- cb6: bal.tab IPTW adjusted
- cb7: survey::svydesign + svyCreateTableOne IPTW
- cb8: weighted glm logistic regression
- cb9: PSweight data preparation
- cb10: PSweight overlap weighting
- cb11: SumStat effective sample size
- cb12: SumStat balance summary

## Teaching Components (6 cards)

| data-type | badge | Insertion point |
|---|---|---|
| `psw-workflow-guide` | workflow | After intro paragraph "主要介绍两种加权方法..." |
| `psw-iptw-guide` | IPTW | Before cb5 weight calculation |
| `psw-balance-guide` | 平衡 | After cb6 output, before "可以看到除了lifepres之外..." |
| `psw-survey-guide` | 分析 | Before cb7 library(survey) |
| `psw-overlap-guide` | 重叠加权 | In §40.3 after overlap weight formulas |
| `psw-comparison-guide` | 对比 | Before cb9 data preparation |

## Renderer Module

`js/viz/psw-guides.js`:
- Pattern: `GUIDE_CARDS` config + `renderGuide()` + scoped CSS id guard + `escapeHtml()`
- Imports: `js/viz/_bundle-presentation-modules.js` + `js/stats-viz.js`

## Interactive Component Check

Static cards suffice — no sliders/select needed. `psdist` is the only existing interactive component.

## Verification

```bash
node --test tests/psw-content.test.mjs  # 6/6 pass
npm test                                 # 257/257 pass
npm run validate                         # pass
for f in js/*.js js/viz/*.js tests/*.mjs; do node --check "$f"; done  # pass
python3 registry check                   # {} + []
python3 -m http.server 8000 && curl /data/1037-psw.html /js/stats-viz.js /js/viz/psw-guides.js  # 200/200/200
```