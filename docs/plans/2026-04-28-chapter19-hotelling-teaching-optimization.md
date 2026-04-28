# Chapter 19 Hotelling / multivariate inference teaching optimization

## Scope

Optimize `data/hotelling.html` with compact `stat-viz` teaching components while preserving the generated Quarto HTML structure and all original R examples.

## Constraints

- Preserve original code-block anchors `cb1`–`cb34` and their order.
- Do not rewrite or reorder existing R code/output blocks.
- Keep existing `data-type="scatter"` visualization for the correlation example.
- Prefer unified `stat-viz` teaching cards plus short explanatory paragraphs; avoid large callouts.
- Add interactivity only where it directly teaches why multivariate inference can differ from separate univariate tests.

## Audit summary

Chapter 19 currently covers:

1. Multivariate description: mean vector, covariance matrix, correlation matrix.
2. Multivariate normality checks.
3. Hotelling T² for one sample and two samples.
4. MANOVA for more than two groups, including Wilks/Pillai alternatives.
5. Why multivariate tests cannot be replaced by multiple univariate tests.
6. Repeated-measures data as a vector of changes.
7. Profile analysis: parallel, equal levels, flatness.

Existing custom visualization:

- One `scatter` widget for the blood-lipid correlation example.

## Implementation slice

Add `js/viz/hotelling-guides.js` and register six chapter-specific components:

- `hotelling-vector-matrix-guide`
- `hotelling-t2-decision-guide`
- `hotelling-manova-stat-guide`
- `hotelling-univar-multivar-demo`
- `hotelling-repeated-vector-guide`
- `hotelling-profile-guide`

Interactive requirement:

- `hotelling-univar-multivar-demo` should use a slider to show that separation may be weak on each single axis but clear along a multivariate direction. This directly supports section 19.3.4.

## Verification

Run:

```bash
node --test tests/hotelling-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
```
