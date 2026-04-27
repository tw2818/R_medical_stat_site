# Chapter 12 ROC teaching optimization

## Scope

Optimize `data/roc.html` (Chapter 12: ROC 曲线) with concise stat-viz teaching components and audit existing ROC widgets for bugs.

## Constraints

- Preserve original code blocks and R examples (`cb1`–`cb5`, `cb7`–`cb16`; `cb6` is absent in the generated HTML).
- Keep existing components (`confusionmatrix`, `roc`, `roccompare`) but fix renderer bugs if found.
- Use stat-viz style cards + short explanatory paragraphs; avoid large Quarto callouts.
- Use interaction only where it clarifies threshold trade-offs.

## Findings

Existing widgets are well placed but the ROC renderers use simulated data. The old ROC data generation sorted marker values separately from labels, which can break threshold-based TPR/FPR calculation. `roccompare` also displays requested AUC values while drawing stochastic curves that may not match those labels.

Teaching gaps:
- diagnostic metrics are described as long prose;
- threshold trade-off is central but not directly interactive;
- AUC interpretation and pROC reporting need concise guide cards;
- §12.5 prediction model ROC needs a note that ROC uses predicted probabilities, not hard labels.

## Plan

1. Add `tests/roc-content.test.mjs` to guard:
   - code block IDs/count remain stable;
   - existing ROC widgets remain;
   - new guide components exist;
   - no heavy Quarto callouts are introduced;
   - ROC renderer keeps score/label pairs together and computes/display actual AUC.
2. Add `js/viz/roc-guides.js`:
   - `diagnostic-metrics-guide`: static metric map;
   - `roc-threshold-tradeoff`: interactive threshold demo;
   - `auc-interpretation-guide`: static AUC interpretation card;
   - `roc-reporting-guide`: static pROC/reporting guide;
   - `prediction-roc-guide`: static probability vs class guide.
3. Import guide module from `_bundle-presentation-modules.js`.
4. Insert components at §12.2, §12.3, §12.4, and §12.5.
5. Fix ROC renderer data pairing/AUC display issues.
6. Verify targeted/full tests, validation, JS syntax, registry consistency, and HTTP smoke.
