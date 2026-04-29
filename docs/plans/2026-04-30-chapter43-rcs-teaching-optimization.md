# Chapter 43 RCS Teaching Optimization Plan

**Date:** 2026-04-30
**Chapter:** 43 — 样条回归 / Restricted Cubic Spline Regression
**File:** `data/1040-rcs.html`
**Prev optimized:** Chapter 42 (nonlinear-guides.js)

---

## Constraints

- Preserve all 13 code blocks (cb1–cb13) exactly
- Preserve existing `splinercs` interactive widget
- Do NOT reorganize generated HTML structure
- Use PSM card style (`.psm-guide-*` CSS classes) matching `nonlinear-guides.js`
- Short explanatory paragraphs after each widget (`⬆ ...`)

---

## Code Block Sequence (verified)

- cb1–cb4: 线性立方样条 section (43.0.1)
- cb5–cb7: 逻辑回归立方样条 section (43.0.2)
- cb8–cb13: Cox回归立方样条 section (43.0.3)
- No cb14+

---

## Teaching Guide Cards to Add

### 1. `rcs-workflow-guide`
- **Placement:** Before cb1 (~line 527, before splinercs widget)
- **Badge:** 样条回归
- **Title:** 何时使用限制性立方样条 (RCS)
- **Content:** RCS vs 多项式 vs 分段回归的适用场景；线性/Logistic/Cox三种回归的RCS工作流

### 2. `rcs-knot-formula-guide`
- **Placement:** After cb3 (~line 588, after rcs() function intro paragraph)
- **Badge:** 公式写法
- **Title:** rcs() 函数的节点选择
- **Content:** `rcs(x, knots)` 语法；节点数选择（3-6个，默认4）；Harrell文献参考

### 3. `rcs-nonlinear-guide`
- **Placement:** After cb6 (~line 663, after anova() Nonlinear P-value paragraph)
- **Badge:** 非线性检验
- **Title:** 如何判断是否符合非线性：ANOVA 的 Nonlinear 项
- **Content:** anova(f) 输出中 Nonlinear P值的含义；P<0.05说明符合非线性；与多项式回归的选择

### 4. `rcs-interpretation-guide`
- **Placement:** After cb7 (~line 677, after Logistic RCS OR plot paragraph)
- **Badge:** 结果解读
- **Title:** RCS 结果解读：HR / OR 与临床意义
- **Content:** HR=1参考线的意义；HR>1/HR<1的风险/保护解读；节点处HR突变与临床拐点

---

## Existing Component: `splinercs`

- **Registered:** `js/viz/advanced.js` → `registerViz('splinercs', renderSplineRCS)`
- **Location in HTML:** Line 527 (before cb1)
- **Status:** Functional interactive demo with knot slider (2–6 nodes)
- **Minor issue:** Legend text says "阴影: 95% CI" but CI band is light blue fill — fix to "浅蓝: 95% CI"

---

## Implementation Steps

1. Create `docs/plans/2026-04-30-chapter43-rcs-teaching-optimization.md` (this file)
2. Create `tests/rcs-content.test.mjs` (node:test, test() not describe/it)
3. Create `js/viz/rcs-guides.js` with 4 guide cards
4. Add import to `js/stats-viz.js`: `import './viz/rcs-guides.js';`
5. Add import to `js/viz/_bundle-presentation-modules.js`: `import './rcs-guides.js';`
6. Insert 4 guide widgets into `data/1040-rcs.html`
7. Fix legend text in `js/viz/advanced.js` line 397
8. Run verification suite

---

## Bundle Import Pattern (verified from nonlinear-guides.js)

```js
// js/stats-viz.js
import './viz/rcs-guides.js';

// js/viz/_bundle-presentation-modules.js
import './rcs-guides.js';
```

---

## CSS Style (from nonlinear-guides.js / p4trend-guides.js)

`.psm-guide-card` style with:
- Light gray/off-white outer card (`#f6f7fb`)
- White inner surface
- Subtle border + shadow
- Rounded corners (18px)
- Dark blue-gray titles (`#1e293b`)
- Purple/blue gradient icon badge
- `escapeHtml()` for dataset.title interpolation
- `ensureStyles()` with id guard
