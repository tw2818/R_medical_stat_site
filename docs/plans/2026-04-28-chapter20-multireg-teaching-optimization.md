# Chapter 20 multiple linear regression teaching optimization

## Scope

Optimize `data/1017-multireg.html` with compact `stat-viz` teaching components while preserving generated Quarto structure and all original R examples.

## Constraints

- Preserve original code-block anchors exactly: `cb1`–`cb17`, then `cb19`–`cb31`; `cb18` is absent in the generated source and should remain absent.
- Keep existing `coefci` and `scatter` visualizations.
- Use compact `stat-viz` teaching cards plus short explanatory paragraphs, not large callouts.
- Add interaction only if it teaches a core regression idea.

## Audit summary

Chapter 20 currently covers:

1. Multiple linear regression formula and `summary(lm())` interpretation.
2. Model evaluation with R², adjusted R², AIC, BIC, RMSE.
3. Regression diagnostics: linearity, normality, homoscedasticity, independence, outliers.
4. Multicollinearity with VIF / `check_collinearity()`.
5. Variable selection: stepwise AIC and all-subsets regression.

Existing custom visualizations:

- `coefci` for coefficient intervals.
- `scatter` for predicted vs observed values.

## Implementation slice

Add `js/viz/multireg-guides.js` and register six components:

- `multireg-formula-guide`
- `multireg-coef-guide`
- `multireg-metrics-guide`
- `multireg-diagnostics-guide`
- `multireg-vif-demo`
- `multireg-selection-guide`

Interactive requirement:

- `multireg-vif-demo` should use a slider to show how predictor correlation increases VIF and inflates coefficient standard errors. This directly supports section 20.3.3.

## Verification

Run:

```bash
node --test tests/multireg-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
```
