# Chapter 33 (偏相关和典型相关分析) Teaching Optimization Plan

**Date**: 2026-04-29
**Chapter**: 33 - 偏相关和典型相关分析
**File**: `data/1016-partialcorrelation.html`

## Constraints

- Preserve original R code blocks (`<div class="sourceCode">`)
- Preserve code block anchor sequences exactly (cb1–cb10)
- Keep existing interactive component `data-type="partialcorr"` at line ~542
- Use `stat-viz`-style compact cards
- Keep text concise
- Escape any `el.dataset.*` value before interpolating into `innerHTML`

## Chapter Structure (2 sections)

| Section | Title | Key Teaching Points |
|---------|-------|---------------------|
| 33.1 | 偏相关（partial correlation） | Partial correlation concept, pcor() vs simple correlation, residual method |
| 33.2 | 典型相关（Canonical Correlation） | Canonical correlation concept, cancor(), canonical variates, redundancy |

## Teaching Guide Cards (5 Static Cards)

| ID | Badge | Title | Insert After Section |
|----|-------|-------|---------------------|
| `partialcorr-concept-guide` | partial | 偏相关的概念 | 33.1 header |
| `partialcorr-vs-simple-guide` | r vs pr | 偏相关与简单相关 | 33.1 header |
| `canonicalcorr-concept-guide` | cancor | 典型相关的概念 | 33.2 header |
| `canonicalcorr-interpretation-guide` | 解读 | 典型相关结果解读 | 33.2 header |
| `canonicalcorr-redundancy-guide` | redundancy | 典型相关系数与冗余度 | 33.2 header |

## Guide Card Content

### 1. partialcorr-concept-guide
- **Badge**: partial
- **Icon**: ⊥
- **Title**: 偏相关的概念
- **Lead**: 偏相关是在控制其他变量影响后，衡量两个变量之间纯相关关系的统计方法。
- **Steps**:
  - [控制变量] 控制第三个（或更多）变量的影响，剥离出两个变量间的"净相关"
  - [公式] 偏相关系数 r_xy.z = (r_xy - r_xz*r_yz) / sqrt((1-r_xz²)(1-r_yz²))
  - [应用] 当变量间存在混杂因素时，简单相关系数会高估或低估真实相关
- **Note**: 偏相关要求数据服从多元正态分布；控制变量不宜过多（样本量的1/10）

### 2. partialcorr-vs-simple-guide
- **Badge**: r vs pr
- **Icon**: Δ
- **Title**: 偏相关与简单相关
- **Lead**: 简单相关系数可能受混杂变量驱动，偏相关系数揭示真实成对关系。
- **Steps**:
  - [简单相关] r_xy：x和y的直接相关性，不考虑其他变量
  - [偏相关] r_xy.z：在控制z后x和y的相关性
  - [差异原因] 混杂变量在两个方向上都与x和y相关时，简单相关会失真
- **Note**: 若简单相关与偏相关差异大，提示存在混杂；差异小说明关系真实

### 3. canonicalcorr-concept-guide
- **Badge**: cancor
- **Icon**: ↔
- **Title**: 典型相关的概念
- **Lead**: 典型相关分析研究两组变量之间的整体相关性，是简单相关向多维扩展。
- **Steps**:
  - [两组变量] 一组因变量(Y1,Y2,...)、一组自变量(X1,X2,...)
  - [典型变量] 每个组合投影为一个典型变量U=a'Y, V=b'X
  - [典型相关系数] 找到使U和V相关性最大的权重(a,b)
- **Note**: 典型相关是Pearson相关的多元扩展；需要足够样本量（每组变量×10）

### 4. canonicalcorr-interpretation-guide
- **Badge**: 解读
- **Icon**: ⊤
- **Title**: 典型相关结果解读
- **Lead**: 典型相关输出包含多个典型相关系数及其显著性检验。
- **Steps**:
  - [典型相关系数] λ1 ≥ λ2 ≥ ...，反映每对典型变量的相关性强度
  - [载荷系数] 原始变量在典型变量上的权重，解释典型变量的含义
  - [显著性检验] Wilks λ / Pillai / Hotelling-Lawley / Roy 检验
- **Note**: 载荷系数的绝对值越大，该变量对典型变量的贡献越大

### 5. canonicalcorr-redundancy-guide
- **Badge**: redundancy
- **Icon**: %
- **Title**: 典型相关系数与冗余度
- **Lead**: 冗余度指数衡量一个典型变量组能解释另一组变量的程度。
- **Steps**:
  - [冗余度指数] 典型变量U能被原始Y组解释的比例
  - [解释能力] 第一典型变量通常解释最多，后续递减
  - [应用] 选择冗余度高、对结果解释力强的典型变量对
- **Note**: 冗余度帮助判断哪些原始变量对canonical correlation贡献最大

## Interactive Component Decision

**Decision**: All 5 guide cards are **static** (no sliders/inputs).

**Rationale**:
- Both partial and canonical correlation are primarily conceptual
- Key outputs (correlation matrices, canonical correlations) are fixed R outputs
- Understanding requires interpreting formulas and output tables, not manipulating parameters
- The existing `partialcorr` interactive component already shows the concept visually

## Implementation Order

1. Create `docs/plans/2026-04-29-partialcorrelation-teaching-optimization.md` (this file)
2. Create `tests/partialcorrelation-content.test.mjs` (TDD test)
3. Create `js/viz/partialcorrelation-guides.js` (guide renderer)
4. Add guide placeholders to `data/1016-partialcorrelation.html`
5. Update `js/stats-viz.js` import
6. Update `js/viz/_bundle-presentation-modules.js` import
7. Run `npm test && npm run validate`
8. Commit and push

## Verification

```bash
node --test tests/partialcorrelation-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" || exit 1; done
```