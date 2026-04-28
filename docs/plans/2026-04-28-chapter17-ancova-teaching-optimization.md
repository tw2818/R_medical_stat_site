# Chapter 17 ANCOVA teaching optimization

## Scope

Target file: `data/1005-ancova.html` (Chapter 17: 协方差分析).

Goal: improve teaching flow and component style while preserving all original R code/output examples.

## Constraints

- Preserve original generated HTML structure as much as possible.
- Preserve all original code-block anchors `cb1`–`cb11` with no duplicates or gaps.
- Prefer compact `stat-viz` teaching cards plus short explanatory paragraphs (`⬆ 上方...`).
- Avoid large Quarto callout blocks and broad app-shell refactors.
- Keep existing scatter examples unless replacing duplicate/unclear placements with better ANCOVA-specific teaching cards.

## Audit summary

- Existing chapter has 11 code blocks (`cb1`–`cb11`).
- Existing chapter has three generic `scatter` widgets, but no ANCOVA-specific teaching cards.
- Key teaching gaps:
  - what ANCOVA adjusts and why adjusted means matter
  - term-by-term reading of `y ~ x + group`
  - covariate assumptions, especially homogeneity/parallel regression slopes
  - how to read the ANCOVA table (`x`, `group`, residuals)
  - how random-block ANCOVA differs: `y ~ x + block + group`
  - what to do after significant adjusted group effect (multiple comparisons / adjusted means)
- Visual issue: generic scatter widgets do not clearly teach group-wise parallel slope logic.

## Implementation slice

1. Add `tests/ancova-content.test.mjs`.
2. Add `js/viz/ancova-guides.js` with compact card renderers:
   - `ancova-workflow-guide`
   - `ancova-formula-guide`
   - `ancova-assumption-guide`
   - `ancova-adjusted-mean-guide`
   - `ancova-result-guide`
   - `ancova-block-guide`
   - `ancova-multcompare-guide`
3. Import the renderer from:
   - `js/viz/_bundle-presentation-modules.js`
   - `js/stats-viz.js`
4. Insert `stat-viz` placeholders in chapter 17 at natural teaching points:
   - after the initial ANCOVA conditions paragraph
   - after long-format conversion output
   - before/after the first `aov(y ~ x + group)` result
   - after `rstatix::anova_test()` output
   - before random-block ANCOVA model
   - after random-block result
5. Keep concise explanatory paragraphs after each card.

## Verification

```bash
node --test tests/ancova-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
python3 -m http.server 8017
curl -I http://127.0.0.1:8017/
curl -s http://127.0.0.1:8017/data/1005-ancova.html | grep -q 'ancova-workflow-guide'
```
