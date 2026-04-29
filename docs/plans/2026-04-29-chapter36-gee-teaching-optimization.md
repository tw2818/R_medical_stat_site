# Chapter 36 GEE Teaching Optimization Plan

## Goal
Add teaching guide components to Chapter 36 (广义估计方程 / GEE) following the established guide module pattern, without breaking existing widgets or R code blocks.

## Chapter Overview
- **File**: `data/gee.html` (1182 lines)
- **Sections**: 36.1 理论知识, 36.2 数据探索, 36.3 建立GEE, 36.4 结果解读, 36.5 计算QIC, 36.6 边际效应
- **Code blocks**: cb1–cb7 (verified contiguous)
- **Existing widgets**: `samplesizecalc` (line 521), `autocorrelation` (line 649)

## Constraints
- Preserve all original R code blocks and anchors (cb1–cb7)
- Preserve existing prose and explanations
- Preserve existing `samplesizecalc` and `autocorrelation` widgets
- Use CSS prefix `gee-` for guide cards
- Follow the established pattern: `GUIDE_CARDS` config + shared `renderGuide()` + scoped CSS id guard

## 6 Guide Components

| ID | Badge | Title | Placement |
|----|-------|-------|-----------|
| `gee-workflow-guide` | workflow | GEE 主线：GLM 的推广 | After 36.1 (before cb1) |
| `gee-correlation-guide` | correlation | 5种作业相关矩阵如何选 | After 36.3 (after corstr list, before autocorrelation widget) |
| `gee-interpretation-guide` | interpretation | GEE 系数解读：从 logit 到 OR | After 36.4 (after cb5, before cb6) |
| `gee-interaction-guide` | interaction | drug×time 交互项解读 | After 36.4 interpretation prose |
| `gee-qic-guide` | QIC | QIC 模型选择：越小越好 | After 36.5 (after cb7) |
| `gee-marginal-effect-guide` | marginal | 边际效应 vs 条件效应 | After 36.6 (at end of section) |

## Placeholder Placement Details

1. **After line 542** (end of 36.1, before cb1): `gee-workflow-guide`
2. **After line 648** (end of corstr list, before autocorrelation): `gee-correlation-guide`
3. **After line 677** (after cb5 summary output): `gee-interpretation-guide`
4. **After line 685** (after coefficient interpretation list, before cb6): `gee-interaction-guide`
5. **After line 721** (after QIC prose): `gee-qic-guide`
6. **After line 726** (after 36.6 prose): `gee-marginal-effect-guide`

## Implementation Steps

1. Create `js/viz/gee-guides.js` with 6 `GUIDE_CARDS`
2. Import in `js/viz/_bundle-presentation-modules.js`
3. Import in `js/stats-viz.js`
4. Add 6 stat-viz placeholders to `data/gee.html`
5. Create `tests/gee-content.test.mjs`
6. Run verification

## Verification Commands

```bash
node --test tests/gee-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
python3 -m http.server 8000 &
sleep 2
curl -s http://127.0.0.1:8000/data/gee.html | grep -c 'stat-viz'
curl -s http://127.0.0.1:8000/js/viz/gee-guides.js | head -3
kill %1
```