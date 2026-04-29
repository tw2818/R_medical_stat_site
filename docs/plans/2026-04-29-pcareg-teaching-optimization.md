# Plan: pcareg.html Teaching Optimization

## Context
Optimize Chapter 31 (主成分回归, pcareg.html) following handbook Section 18 teaching optimization workflow.
Chapter 30 was completed previously with all tests passing (commits f185800, 43743fb).

## Chapter Content Analysis
- **File**: data/pcareg.html
- **Topic**: 主成分回归 (Principal Component Regression)
- **Code blocks**: cb1-cb100 (2 sections)
  - 31.1 pls: cb1-cb8 (basic PCR using pls::pcr)
  - 31.2 tidymodels: cb9-cb13 (advanced PCR using tidymodels workflow)
- **Existing interactive component**: 1 scatter plot with regression (line 521)

## Teaching Structure (from content)
1. **PCR concept**: PCA降维 + 线性回归组合
2. **pls method**: pcr(), prediction, cross-validation
3. **tidymodels method**: recipe + workflow + tune + fit
4. **Component selection**: R2, RMSEP, cross-validation

## Optimization Opportunities (Guide Cards)

### High-Value Guide Cards (teaching-focused)

1. **pcreg-workflow-guide** (STATIC)
   - What: PCR = PCA(降维) + 回归 on scores
   - Why: Clarifies the two-step nature students often confuse
   - Placement: Before cb1

2. **pcreg-pls-tidymodels-guide** (SELECT or STATIC)
   - What: Compare pls (简单) vs tidymodels (复杂但一致)
   - Why: Helps students choose which to use
   - Placement: Between sections 31.1 and 31.2

3. **pcreg-ncomp-selection-guide** (STATIC or SLIDER)
   - What: How to choose number of components (RMSEP, cross-validation)
   - Why: Critical practical skill
   - Placement: After pls results cb5

4. **pcreg-coef-interpretation-guide** (STATIC)
   - What: Regression coefficients from PCR are on PCA score scale
   - Why: Common confusion point
   - Placement: After cb4

### Lower Priority
- **pcreg-vip-guide**: VIP (Variable Importance in Projection) - mentioned in pls but not detailed

## Interactive Component Audit (Section 378)

Current: 1 scatter with regression (line 521)
- Type: scatter + regression line
- Interaction: static display
- Enhancement potential: LOW - already has regression line

## Section 378 Recommendations
- **pcreg-ncomp-slider**: If interactive, show how ncomp affects RMSE
  - Not present in content, would need new visualization
  - Consider: STATIC guide explaining cross-validation approach instead

## Implementation Plan

### Phase 1: TDD Tests
- [ ] Write tests/pcareg-content.test.mjs
- [ ] Tests will FAIL initially (handbook TDD requirement)
- [ ] Run: node --test tests/pcareg-content.test.mjs

### Phase 2: Guide Cards
- [ ] Create js/viz/pcareg-guides.js
- [ ] Add 4 STATIC guide cards
- [ ] No new interactive components needed (content is inherently static teaching content)

### Phase 3: Verification
- [ ] npm test passes
- [ ] npm run validate passes
- [ ] Visual check: page renders correctly

## Dependencies
- None (self-contained chapter)

## Files to Modify
- data/pcareg.html (add guide cards)
- tests/pcareg-content.test.mjs (create - TDD)
- js/viz/pcareg-guides.js (create)
- _quarto.yml (if needed for include-file)

## Files to Reference
- tests/pca-vis-content.test.mjs (test pattern)
- js/viz/pca-vis-guides.js (guide pattern)
- docs/plans/2026-04-28-pca-vis-teaching-optimization.md (completed Ch30 plan)