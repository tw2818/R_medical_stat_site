# Chapter 29 PCA teaching optimization

## Scope

Optimize `data/1022-pca.html` (Chapter 29 主成分分析) as a content-first, behavior-preserving teaching slice.

## Constraints

- Preserve the generated chapter structure and all original R code/output blocks.
- Preserve code block anchors `cb1`–`cb16` exactly; do not renumber or reorder.
- Preserve the two existing `data-type="pca"` scree-plot widgets and the existing renderer `registerViz('pca', renderScreePlot)` in `js/viz/hypothesis-remaining.js`.
- Add compact `stat-viz` teaching cards plus short `⬆ ...` paragraphs; avoid large callout-heavy rewrites.
- Because Chapter 30 covers PCA visualization, keep this chapter focused on PCA basics, R output interpretation, and component-number choice.

## Planned teaching additions

Add a dedicated renderer module `js/viz/pca-guides.js` with these guide cards:

1. `pca-workflow-guide` — standardize → correlation/covariance matrix → eigenvalues/loadings → scores → interpretation.
2. `pca-standardization-guide` — why `center = TRUE` and `scale. = TRUE` matter, especially for mixed-scale medical variables.
3. `pca-kmo-bartlett-guide` — distinguish KMO adequacy from Bartlett identity-matrix hypothesis.
4. `pca-loading-formula-guide` — connect `$rotation` columns to the PC formula and clarify loading/eigenvector wording.
5. `pca-loadings-scores-guide` — distinguish loadings (`$rotation`) from sample scores (`$x`).
6. `pca-variance-decision-guide` — interpret eigenvalues, contribution rate, cumulative contribution rate, and the existing scree plots.
7. `pca-component-choice-guide` — compare Kaiser, scree elbow, cumulative variance, and interpretability.
8. `pca-pitfalls-guide` — common PCA interpretation pitfalls: sign flips, unsupervised nature, loadings not causal effects, missing values/scale checks.

## Prose fixes

- Remove repetitive wording about PCA in machine learning.
- Clarify KMO and Bartlett are related but test different questions.
- Explain why standardization and centering are used in `prcomp()`.
- Use exact PC1 coefficients from the shown `$rotation` output.
- Clarify `$rotation` as loading/eigenvector columns and avoid confusing it with feature selection.
- Clarify PC2 as the best remaining orthogonal direction after PC1.
- Replace the dense blockquote for component-choice rules with a compact guide and short explanation.

## Tests

Create `tests/pca-content.test.mjs` to protect:

- chapter title and section headings;
- code block anchors `cb1`–`cb16` with no duplicates;
- representative original R snippets and outputs;
- two existing `data-type="pca"` widgets;
- existing `registerViz('pca', renderScreePlot)`;
- the new guide placeholders, registrations, imports, escaping, and interactivity;
- corrected prose.

## Verification

Run:

```bash
node --test tests/pca-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
git diff --check
```

Then perform HTTP smoke checks for `/`, `/data/1022-pca.html`, `/js/stats-viz.js`, `/js/viz/_bundle-presentation-modules.js`, and `/js/viz/pca-guides.js`, then clean up the preview server.
