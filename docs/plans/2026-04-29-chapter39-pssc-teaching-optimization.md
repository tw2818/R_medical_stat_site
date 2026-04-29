# Chapter 39 Teaching Optimization Plan
# 倾向性评分：回归和分层 (Propensity Score Stratified Analysis/Cox Regression)

## Goal
Optimize chapter 39 (`data/1036-pssc.html`) by adding 7 teaching guide cards without disrupting existing R code blocks (cb1–cb17) or the existing `psdist` interactive widget.

## Chapter Overview
- **File**: `data/1036-pssc.html` (1333 lines)
- **Title**: 倾向性评分：回归和分层 (Propensity Score Stratified Analysis/Cox Regression)
- **Code blocks**: cb1–cb17 (17 contiguous, class="sourceCode cell-code" id="cbN")
- **Existing widget**: `psdist` at line ~728 (section 39.5), registered in `js/viz/advanced.js`
- **Sections**: 39.1 演示数据 → 39.8 参考资料
- **CSS prefix**: `pssc-`

## Constraints
- Preserve all R code block anchors (cb1–cb17) exactly
- Do NOT reorganize generated HTML structure
- Do NOT modify existing `psdist` widget placement (line ~728)
- Keep existing Quarto callout/paragraph content
- New guides use `stat-viz[data-type="pssc-xxx-guide"]` pattern

## Interactive Component Decision
**Static cards suffice** — This chapter teaches PS regression and stratification concepts. Learners need to understand methodology (why PS, how to interpret regression coefficients, stratification thresholds) rather than manipulate parameters. The existing `psdist` widget already provides interactive PS distribution exploration.

## Code Block Summary (verified)

| ID | Line | Content |
|----|------|---------|
| cb1 | ~538 | load ecls data, dim=5548×7 |
| cb2 | ~563 | group_by(catholic) summarize means |
| cb3 | ~577 | t.test c5r2mtsc_std ~ catholic (t=-2.0757, p=0.03809) |
| cb4 | ~592 | group means for 3 continuous covariates |
| cb5 | ~604 | t-tests for 3 covariates (all p < 0.001) |
| cb6 | ~616 | chisq.test race_white × catholic (X²=48.596, p=3.145e-12) |
| cb7 | ~630 | chisq.test w3momed_hsb × catholic (X²=117.24, p<2.2e-16) |
| cb8 | ~653 | glm PS model: catholic ~ 5 covariates, family=binomial() |
| cb9 | ~658 | predict PS, head(prs_df) |
| cb10 | ~671 | ggplot histogram of PS by group |
| cb11 | ~694 | PS regression lm(outcome ~ treatment + PS) → catholic=-0.10772, p=0.000893 |
| cb12 | ~733 | PS range by group (public: 0.037-0.477, catholic: 0.049-0.404) |
| cb13 | ~753 | case_when for ps_level: ≤0.1, 0.1-0.2, 0.2-0.3, >0.3 |
| cb14 | ~782 | stratified t-tests (16 rows: 4 strata × 4 variables) |
| cb15 | ~817 | chisq.test balance check for race_white (all P>0.05) |
| cb16 | ~828 | level_4 count table (sparse cells) |
| cb17 | ~853 | chisq.test balance check for w3momed_hsb (all P>0.05 after excluding level_4) |

## Section Boundaries (line numbers)

| Section | Line Start | Content |
|---------|------------|---------|
| 39.1 演示数据 | 523 | cb1 at 538 |
| 39.2 原始数据的概况 | 559 | cb2–cb7 |
| 39.3 计算倾向性评分 | 648 | cb8–cb10 |
| 39.4 倾向性评分回归 | 690 | cb11 |
| 39.5 倾向性评分分层 | 726 | psdist at 728, cb12–cb13 |
| 39.6 分层后的数据 | 778 | cb14–cb17 |
| 39.7 总结 | 867 | — |
| 39.8 参考资料 | 873 | — |

## 7 Teaching Guide Cards to Add

### 1. `pssc-cathexp-guide` (before section 39.2)
- **Placement**: After line 558 (end of section 39.1), before line 559 (section 39.2 header)
- **Content**: Catholic vs public school example context — why we study school type effects, why baseline imbalance matters
- **Badge**: 案例背景

### 2. `pssc-workflow-guide` (after section 39.1)
- **Placement**: After line 558 (section 39.1 closes), before section 39.2 at line 559
- **Content**: PS overview workflow — why PS needed → PS model → PS distribution → PS regression OR stratification → balance check
- **Badge**: PS 工作流

### 3. `pssc-psmodel-guide` (before section 39.3)
- **Placement**: After line 646 (end of section 39.2 paragraph "控制混杂因素的方法其实是很多的"), before line 647 (section 39.3 header at 648)
- **Content**: PS logistic model — what covariates to include, what the predicted probability means, why binomial family
- **Badge**: PS 模型构建

### 4. `pssc-distribution-guide` (after section 39.3)
- **Placement**: After line 688 (paragraph "可以看出我们这个PS是偏态的..."), before line 690 (section 39.4 header)
- **Content**: PS distribution — overlap/common support, why histogram matters, skewed PS implications
- **Badge**: 分布检查

### 5. `pssc-regression-guide` (before section 39.4)
- **Placement**: After line 689 (section 39.3 ends), before line 690 (section 39.4 header)
- **Content**: PS regression interpretation — coefficient meaning (catholic=-0.10772), what controlling for PS does, how to read lm output
- **Badge**: PS 回归解读

### 6. `pssc-stratification-guide` (in section 39.5, near psdist)
- **Placement**: After line 728 (psdist widget), before line 729 (paragraph "顾名思义，根据PS值进行分层")
- **Content**: PS stratification methodology — how many strata (5-10 typical), equal-interval vs percentile, weight-averaging across strata
- **Badge**: 分层方法

### 7. `pssc-balance-guide` (before section 39.6)
- **Placement**: After line 776 (section 39.5 ends with cb13 output), before line 778 (section 39.6 header)
- **Content**: Balance checking explanation — what makes strata "balanced", P>0.05 goal, why some variables still imbalanced, what to do when stratification fails
- **Badge**: 平衡性检验

## Implementation Plan

### Step 1: Create `docs/plans/2026-04-29-chapter39-pssc-teaching-optimization.md`
This file.

### Step 2: Create TDD test `tests/pssc-content.test.mjs`
- Assert code blocks cb1–cb17 present and contiguous
- Assert existing `psdist` widget preserved at line ~728
- Assert new 7 guide placeholders present:
  - `pssc-cathexp-guide`
  - `pssc-workflow-guide`
  - `pssc-psmodel-guide`
  - `pssc-distribution-guide`
  - `pssc-regression-guide`
  - `pssc-stratification-guide`
  - `pssc-balance-guide`
- Assert no stale teaching markers from other chapters

### Step 3: Create renderer `js/viz/pssc-guides.js`
- Follow established pattern: `GUIDE_CARDS` config + `renderGuide()` + scoped CSS id guard
- CSS prefix: `pssc-` (e.g., `.pssc-guide-card`, `.pssc-guide-head`)
- Register all 7 guide types
- Import `registerViz` from `_core.js`

### Step 4: Add HTML placeholders in `data/1036-pssc.html`
Insert 7 `<div class="stat-viz" data-type="pssc-xxx-guide">` placeholders at planned locations above.

### Step 5: Update imports
- `js/viz/_bundle-presentation-modules.js`: add `import './pssc-guides.js';`

### Step 6: Verify
```bash
node --test tests/pssc-content.test.mjs
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" || exit 1; done
python3 - <<'PY'
from pathlib import Path
import re, collections
root=Path('.')
regs=collections.defaultdict(list)
for p in (root/'js/viz').glob('*.js'):
    txt=p.read_text(errors='ignore')
    for m in re.finditer(r"registerViz\(['\"]([^'\"]+)['\"]", txt):
        regs[m.group(1)].append(str(p))
used=set()
for f in (root/'data').glob('*.html'):
    used.update(re.findall(r'class=["\'][^"\']*stat-(?:viz|calc)[^"\']*["\'][^>]*data-type=["\']([^"\']+)["\']', f.read_text(errors='ignore')))
print('duplicate registrations', {k:v for k,v in regs.items() if len(v)>1})
print('unregistered used', sorted(used-set(regs)))
PY
```

## Dependencies
- References Logistic regression (ch21) for glm binomial concept
- References PS matching chapter (ch35/1035-psm.html) for general PS workflow context
- Uses existing `psdist` widget at line 728 for interactive PS distribution

## Code Block Sequence (verified)
cb1 → cb2 → cb3 → cb4 → cb5 → cb6 → cb7 → cb8 → cb9 → cb10 → cb11 → cb12 → cb13 → cb14 → cb15 → cb16 → cb17

## Existing Widget
- `psdist` at section 39.5 (line ~728): `<div class="stat-viz" data-type="psdist" data-title="倾向评分分层分布"></div>`

## Placeholder Placement Summary

| Guide | Insert After Line | Context |
|-------|-------------------|---------|
| pssc-cathexp-guide | 558 | End of 39.1, before 39.2 |
| pssc-workflow-guide | 558 | End of 39.1, before 39.2 |
| pssc-psmodel-guide | 646 | End of 39.2 text, before 39.3 |
| pssc-distribution-guide | 688 | End of 39.3 text, before 39.4 |
| pssc-regression-guide | 689 | Start of 39.4, before cb11 |
| pssc-stratification-guide | 728 | After psdist widget, before paragraph |
| pssc-balance-guide | 776 | End of 39.5, before 39.6 |
