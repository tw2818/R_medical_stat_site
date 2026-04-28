# Chapter 18 ANOVA attention teaching optimization

## Scope

Target file: `data/1010-anovaattention.html` (Chapter 18: 方差分析 R 语言注意事项).

Goal: improve conceptual scaffolding around balanced/unbalanced designs, Type I/II/III sums of squares, and the random-block vs ANCOVA distinction while preserving all original R code/output examples.

## Constraints

- Preserve original generated HTML structure as much as possible.
- Preserve all original code-block anchors `cb1`–`cb10` with no duplicates or gaps.
- Prefer compact `stat-viz` teaching cards plus short explanatory paragraphs (`⬆ 上方...`).
- Add interaction only where it serves the teaching goal.
- Avoid large callout blocks and broad app-shell refactors.

## Audit summary

- Existing chapter has 10 code blocks (`cb1`–`cb10`).
- Existing chapter has one generic `anova` widget at the start of §18.2.
- Key teaching gaps:
  - learners need a compact rule for when Type I/II/III are identical vs different
  - the current static image needs nearby text explaining sequential / hierarchical / marginal tests
  - the unbalanced random-block example changes conclusions sharply, but lacks a visual comparison of F/P values
  - `y ~ x + group` and `y ~ block + group` look similar in R, so learners need a clear variable-type decision rule
  - ANCOVA’s covariate-first order should be tied back to Type I sequential sums of squares

## Implementation slice

1. Add `tests/anovaattention-content.test.mjs`.
2. Add `js/viz/anova-attention-guides.js` with compact renderers:
   - `anova-type-guide`
   - `anova-balance-guide`
   - `anova-formula-order-guide`
   - `anova-type-result-demo`
   - `anova-block-ancova-guide`
   - `anova-variable-type-decision-demo`
3. Import the renderer from:
   - `js/viz/_bundle-presentation-modules.js`
   - `js/stats-viz.js`
4. Insert `stat-viz` placeholders in chapter 18 at natural teaching points:
   - after the existing generic ANOVA widget in §18.2
   - before the Type I/II/III static image
   - after the unbalanced random-block example result
   - at the ANCOVA transition where the formula similarity is discussed
5. Keep concise explanatory paragraphs after each card.

## Verification

```bash
node --test tests/anovaattention-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node tests/viz-registry-consistency.test.mjs
```
