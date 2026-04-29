# Chapter 35 Teaching Optimization Plan
# 倾向性评分：匹配 (Propensity Score Matching)

## Goal
Optimize chapter 35 (`data/1035-psm.html`) following Section 18 workflow, adding teaching guide cards without disrupting existing R code blocks or the `psdist` interactive widget.

## Chapter Overview
- **File**: `data/1035-psm.html`
- **Title**: 倾向性评分：匹配 (Chapter 38 in book numbering)
- **Code blocks**: cb1–cb27 (contiguous, no gaps)
- **Existing widget**: `psdist` (registered in `advanced.js`, preserves interactive PS distribution explorer)
- **Sections**: 38.1 准备数据 → 38.8 参考资料

## Constraints
- Preserve all R code block anchors (cb1–cb27) exactly
- Do NOT reorganize generated HTML structure
- Do NOT modify existing `psdist` widget placement
- Keep existing Quarto callout/paragraph content except where stale text needs correction
- New guides use `stat-viz[data-type="psm-xxx-guide"]` pattern

## Interactive Component Decision
**Static cards suffice** — This chapter teaches PSM concepts and workflow. Learners need to understand terminology (SMD, caliper, cobalt), not manipulate thresholds. The existing `psdist` widget already provides interactive PS distribution exploration.

## Teaching Guide Cards to Add

### 1. `psm-concept-guide` (after 38.1 intro paragraph)
- **Placement**: After "倾向性评分的一般步骤" section (line ~538)
- **Content**: PS concept, 4-step workflow, why reduce dimensionality
- **Badge**: PS concept

### 2. `psm-balance-metrics-guide` (before 38.4 平衡性检验 section)
- **Placement**: Before section 38.4 (around line 872)
- **Content**: SMD < 0.1 means balanced; VR close to 1 means balanced; interpretation rules
- **Badge**: 平衡性指标

### 3. `psm-matching-method-guide` (in section 38.3)
- **Placement**: After matching method parameters description (around line 795)
- **Content**: method/caliper/replace/ratio parameters explained simply
- **Badge**: 匹配参数

### 4. `psm-cobalt-guide` (in section 38.4.1)
- **Placement**: After cobalt包 introduction (around line 957)
- **Content**: Why cobalt is preferred over default summary(); bal.tab() interpretation
- **Badge**: cobalt

### 5. `psm-visualization-guide` (in section 38.5)
- **Placement**: After the `psdist` widget (line ~1058)
- **Content**: Love plot, balance plot interpretation; what good matching looks like
- **Badge**: 可视化

### 6. `psm-imbalance-guide` (in section 38.6)
- **Placement**: Start of 不平衡怎么办 section
- **Content**: Strategies when imbalance persists: increase caliper, use 1:n matching, try different PS estimation, use cobalt
- **Badge**: 应对策略

## Implementation Plan

### Step 1: Create `docs/plans/2026-04-29-chapter35-psm-teaching-optimization.md`
This file.

### Step 2: Create TDD test `tests/psm-content.test.mjs`
- Assert code blocks cb1–cb27 present and contiguous
- Assert existing `psdist` widget preserved
- Assert new `psm-concept-guide`, `psm-balance-metrics-guide`, `psm-matching-method-guide`, `psm-cobalt-guide`, `psm-visualization-guide`, `psm-imbalance-guide` placeholders present
- Assert no stale teaching markers from other chapters

### Step 3: Create renderer `js/viz/psm-guides.js`
- Follow the established pattern: `GUIDE_CARDS` config + `renderGuide()` + scoped CSS id guard
- Register all 6 guide types
- Import `registerViz` from `_core.js`

### Step 4: Add HTML placeholders in `data/1035-psm.html`
Insert 6 `<div class="stat-viz" data-type="psm-xxx-guide">` placeholders at planned locations.

### Step 5: Update imports
- `js/stats-viz.js`: add `import './viz/psm-guides.js';`
- `js/viz/_bundle-presentation-modules.js`: add `import './psm-guides.js';`

### Step 6: Verify
```bash
node --test tests/psm-content.test.mjs
npm test
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

## Code Block Sequence (verified)
cb1 → cb2 → cb3 → cb4 → cb5 → cb6 → cb7 → cb8 → cb9 → cb10 → cb11 → cb12 → cb13 → cb14 → cb15 → cb16 → cb17 → cb18 → cb19 → cb20 → cb21 → cb22 → cb23 → cb24 → cb25 → cb26 → cb27

## Existing Widget
- `psdist` at section 38.5 (line ~1058): `<div class="stat-viz" data-type="psdist" data-title="倾向评分分布 (匹配前后对比)"></div>`

## Dependencies
- None — this chapter builds on concepts from earlier chapters (Logistic regression ch21) but is self-contained for teaching optimization purposes.