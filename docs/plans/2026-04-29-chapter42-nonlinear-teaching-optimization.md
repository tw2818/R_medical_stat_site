# Chapter 42 多项式拟合 Teaching Optimization Plan

## Overview
Optimize chapter 42 (data/1039-nonlinear.html) — polynomial fitting — following the TDD workflow from 优化手册.md Section 18+.

## Chapter Content Verified
- Code blocks: cb1–cb11 (contiguous, no gaps)
- Existing widget: dose at line ~514
- Section flow: USPop data → linear fit (bad) → quadratic → cubic → anova comparison → piecewise dataset → 6th degree → poly() → ggplot2 → closing

## Teaching Components to Add
4 new guide cards following PSM card style (`.psm-guide-*` CSS):

| data-type | Badge | Title | Insert Position |
|---|---|---|---|
| nonlinear-workflow-guide | 多项式拟合 | 何时使用多项式/分段/样条 | Before cb1 (~line 515) |
| nonlinear-poly-formula-guide | 公式写法 | I()语法 vs poly()函数 | After cb4 (~line 580) |
| nonlinear-degree-guide | 模型选择 | 如何根据P值选择多项式次数 | After cb6 (~line 630) |
| nonlinear-poly-glm-guide | GLM扩展 | 多项式在GLM/Cox回归中的应用 | After cb11 (~line 725) |

## Card Content

### nonlinear-workflow-guide
- badge: '多项式拟合'
- icon: 'WF'
- title: '何时使用多项式 / 分段 / 样条'
- lead: '非线性关系的建模有三种常用方法，各有适用场景。'
- steps:
  - ['多项式回归', '数据光滑且单调时适用；优点是简单，缺点是两端容易外推不佳']
  - ['分段回归', '当数据在某些节点有明显转折时适用；需预先确定节点位置']
  - ['样条回归', '灵活性高，无需指定函数形式；限制性立方样条是文献中最常用的方法']
- note: '本章重点介绍多项式回归，下一章（样条回归）将介绍样条方法'

### nonlinear-poly-formula-guide
- badge: '公式写法'
- icon: 'PF'
- title: '多项式回归的两种公式写法'
- lead: 'R语言中多项式回归有两种写法：I()语法和poly()函数。'
- steps:
  - ['I()语法', 'lm(y ~ x + I(x^2) + I(x^3))，显式写出每项，公式较长']
  - ['poly()函数', 'lm(y ~ poly(x, 3))，更简洁；poly()生成正交多项式，避免多重共线性']
  - ['正交多项式优点', '系数间不相关，统计推断更稳定；次数越高越容易过拟合']
- note: '推荐使用poly()，尤其是次数较高时；若需解释原始尺度系数，可用 raw=poly()'

### nonlinear-degree-guide
- badge: '模型选择'
- icon: 'DG'
- title: '如何根据统计检验选择多项式次数'
- lead: '通过似然比检验（或ANOVA）逐次比较相邻次数模型的拟合优度。'
- steps:
  - ['线性 vs 二次', 'P<0.001，二次项显著优于线性，说明数据存在弯曲趋势']
  - ['二次 vs 三次', 'P=0.082，在α=0.05水平下不显著，三次项无额外贡献']
  - ['决策', '选择二次项（degree=2）：最简单的充分模型，避免过拟合']
- note: '原则：选择使模型改善有统计学意义的最低次数'

### nonlinear-poly-glm-guide
- badge: 'GLM扩展'
- icon: 'GL'
- title: '多项式在 GLM / Cox 回归中的应用'
- lead: '多项式项同样可以纳入广义线性模型和Cox回归，只需更换连接函数。'
- steps:
  - ['Logistic回归', 'glm(y ~ poly(x,2), family=binomial)，用于非线性概率建模']
  - ['Cox回归', 'coxph(Surv(time,status) ~ poly(x,2))，用于非线性生存分析']
  - ['解读', '与普通OLS回归相同——关注系数方向和显著性，以及预测曲线形态']
- note: '多项式结构不变，只需将lm()替换为glm()或coxph()'

## HTML Insertion Details
After existing dose widget (line ~514), insert nonlinear-workflow-guide with paragraph.
After cb4 closing (line ~580), insert nonlinear-poly-formula-guide with paragraph.
After cb6 closing (line ~630), insert nonlinear-poly-formula-guide with paragraph.
After cb11 closing (line ~725), insert nonlinear-poly-glm-guide with paragraph.

## Files to Create/Modify
1. `js/viz/nonlinear-guides.js` — new renderer module (4 guide cards)
2. `js/stats-viz.js` — add import
3. `js/viz/_bundle-presentation-modules.js` — add import
4. `data/1039-nonlinear.html` — insert 4 widgets + paragraphs
5. `tests/nonlinear-content.test.mjs` — content test

## Verification
```bash
node --test tests/nonlinear-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
```

## Constraints
- Preserve ALL 11 code blocks exactly (cb1–cb11)
- Preserve existing dose widget
- Do NOT add heavy callout blocks
- Use short explanatory paragraphs after each widget
- Use PSM card style (.psm-guide-*) — same as all other guide modules