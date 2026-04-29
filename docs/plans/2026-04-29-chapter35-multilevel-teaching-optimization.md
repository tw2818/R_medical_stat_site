# Chapter 35 Multilevel Teaching Optimization Plan

## Objective
Optimize Chapter 35 (多水平模型 / Multilevel Models) by adding compact teaching guide components following the established pattern from other chapters (cluster, logistic, etc.)

## Constraints
- Preserve all original R code blocks and anchors (cb1-cb20)
- Preserve existing prose and explanations
- Do not reorganize generated HTML structure
- Use existing widget placement pattern (stat-viz placeholders)
- Follow the proven guide module pattern

## Chapter Analysis

### Section Structure
- 35.1 理论知识 - Theory introduction (recommends 冯国双's articles)
- 35.2 数据探索 - Data exploration with heck2011.csv (419 schools, 6871 students)
- 35.3 空模型 - Null model, ICC = 0.138
- 35.4 添加1级水平的固定效应 - Random intercept model with ses, ICC = 0.052
- 35.5 添加2级水平的固定效应 - Adding public (not significant)
- 35.6 具有随机斜率的MLM - Random slope model with ses, correlation = -1
- 35.7 具有交互效应的MLM - Cross-level interaction ses:public
- 35.8 重复测量数据的MLM - Repeated measures example (10 patients)
- 35.9 广义混合效应模型 - Brief intro to generalized MLM
- 35.10 参考资料

### Code Block Anchors (Verified)
cb1 through cb20 (no gaps in sequence)

### Key Teaching Points
1. **2-level hierarchy**: students (level 1) nested within schools (level 2)
2. **ICC (组内相关系数)**: measures between-cluster variance / total variance
3. **Random intercept model**: same slope, different intercepts per cluster
4. **Random slope model**: both intercept and slope vary by cluster
5. **Cross-level interaction**: level-1 predictor interacting with level-2 predictor
6. **Model comparison**: AIC, BIC, R², ICC changes

## Guide Components to Create

### 1. `multilevel-workflow-guide`
- **Badge**: workflow
- **Icon**: MLM
- **Title**: 多水平模型的主线：先看层次，再分解方差
- **Lead**: 学生嵌套于学校，测量嵌套于患者——多水平模型的核心是把总体方差分解到不同层次。
- **Steps**:
  - ['1. 识别层次', '本章：学生(水平1)嵌套于学校(水平2)；重复测量中，时间点(水平1)嵌套于患者(水平2)']
  - ['2. 空模型', '先拟合无预测变量的模型，用 ICC = σ²_学校 / (σ²_学校 + σ²_残差) 衡量组间变异占比']
  - ['3. 逐步加入预测变量', '先加水平1变量(ses)，再加水2变量(public)，观察 ICC 和 AIC/BIC 变化']
  - ['4. 检验随机效应', '根据研究问题决定是否加入随机斜率；交叉水平交互项用 1|cluster + x|cluster 语法']
- **Note**: 本章示例均用 lme4 + lmerTest；lmerTest 提供 P 值，lme4 本身不提供。

### 2. `multilevel-icc-guide`
- **Badge**: ICC
- **Icon**: ρ
- **Title**: 组内相关系数：群体间变异占总变异的比例
- **Lead**: ICC = σ²_群体间 / (σ²_群体间 + σ²_群体内)，取值 0~1，ICC 越大说明群体效应越明显。
- **Steps**:
  - ['ICC = 0', '群体间无差异，等同于普通线性回归，无需使用多水平模型']
  - ['ICC ≈ 0.05', '弱群体效应，但仍值得用多水平模型；本章空模型 ICC = 0.138，说明 13.8% 的成绩变异来自学校间差异']
  - ['ICC > 0.10', '强群体效应，必须用多水平模型，否则标准误会被低估']
- **Note**: 加入预测变量后 ICC 会下降，因为新变量解释了原本归于群体间的部分变异。本章 ses_l1 模型的 ICC 从 0.138 降到 0.052。

### 3. `multilevel-random-intercept-guide`
- **Badge**: random intercept
- **Icon**: ∩₁
- **Title**: 随机截距模型：每个群体有自己的基准线
- **Lead**: 随机截距模型假设所有群体的斜率相同，但截距不同。截距的变异由随机效应 σ²_截距 量化。
- **Steps**:
  - ['公式', 'math ~ ses + (1|schcode)：1 表示随机截距，schcode 是分组变量']
  - ['截距含义', '57.60 是所有学校的平均成绩；各学校的实际截距围绕此值波动，σ = 3.26']
  - ['与普通回归对比', '普通回归只有一个截距；随机截距模型允许截距随群体变化，等于给每个群体加了一个随机偏移']
- **Note**: 随机截距模型又叫方差成分模型，是最简单的多水平模型。

### 4. `multilevel-random-slope-guide`
- **Badge**: random slope
- **Icon**: ↗↘
- **Title**: 随机斜率模型：每个群体的效应大小不同
- **Lead**: 随机斜率模型不仅截距随群体变化，斜率也随群体变化。ses 对成绩的影响在不同学校可能完全不同。
- **Steps**:
  - ['公式', 'math ~ ses + (ses|schcode)：ses 的系数也作为随机效应估计']
  - ['斜率变异', 'σ_ses = 0.88 表示不同学校 ses 斜率的标准差；有些学校斜率大，有些小']
  - ['相关结构', 'Corr = -1.00：截距越高，ses 斜率越低——好学校截距高但 SES 效应反而弱']
  - ['边界奇异性', 'corr = -1 是边界解，说明模型可能过度参数化；但仍提供了有价值的教学信息']
- **Note**: 随机斜率模型比随机截距模型更复杂，收敛可能有问题。`boundary (singular) fit` 提示检查是否真的需要如此复杂的随机结构。

### 5. `multilevel-crosslevel-interaction-guide`
- **Badge**: interaction
- **Icon**: ×
- **Title**: 交叉水平交互：学校类型调节 SES 对成绩的影响
- **Lead**: 水平1变量(ses)与水平2变量(public)的交互叫交叉水平交互，检验的是高一层变量对低一层变量效应大小的调节。
- **Steps**:
  - ['交互项含义', 'ses:public = -0.625：SES 对成绩的影响在公立学校比私立学校弱 0.625 分']
  - ['简单斜率', '私立学校(public=0)：SES 每增1分，成绩增 4.42 分；公立学校(public=1)：增 3.80 分']
  - ['报告规范', '必须同时报告主效应和交互效应；解释时需分不同水平阐述，不能只读主效应']
- **Note**: 交叉水平交互的检验需要将水平1变量中心化(如用 femses)以减少多重共线性，但本章为教学简单使用原始 ses。

### 6. `multilevel-model-comparison-guide`
- **Badge**: model comparison
- **Icon**: ≃
- **Title**: 模型比较：AIC、BIC、ICC、R² 一起看
- **Lead**: 多水平模型没有单一的 R²，需要用 ICC、R²_marginal、R²_conditional、AIC/BIC 组合评价。
- **Steps**:
  - ['ICC', '空模型 0.138 → ses_l1 0.052：加入 ses 后学校间差异解释力下降，因为 ses 部分解释了学校差异']
  - ['AIC/BIC', '越小越好；ses_l1 (48219) vs null_model (48882)：差 663，AIC 大幅改善']
  - ['R² conditional', '包含随机效应解释的总变异；R² marginal 只含固定效应']
  - ['REM vs ML', 'REML 是限制性最大似然估计，默认用 REML；比较固定效应时可用 ML']
- **Note**: performance::icc() 自动计算调整后 ICC，lme4 默认 REML 估计。

## HTML Placeholder Placement

| Section | Guide Type | Rationale |
|---------|------------|-----------|
| 35.2 (after data description) | `multilevel-workflow-guide` | Workflow before practice |
| 35.3 (after ICC explanation) | `multilevel-icc-guide` | ICC concept clarification |
| 35.4 (after random intercept model) | `multilevel-random-intercept-guide` | Random intercept concept |
| 35.6 (after random slope model) | `multilevel-random-slope-guide` | Random slope concept |
| 35.5 (after model comparison output) | `multilevel-model-comparison-guide` | AIC/BIC, ICC, marginal/conditional R² interpretation |
| 35.7 (after cross-level interaction) | `multilevel-crosslevel-interaction-guide` | Interaction concept plus borderline p-value/singular-fit caveat |

## Implementation Order

1. Create `docs/plans/YYYY-MM-DD-chapter35-multilevel-teaching-optimization.md` (this file)
2. Create `tests/multilevel-content.test.mjs`
3. Create `js/viz/multilevel-guides.js`
4. Add placeholders to `data/multilevel.html`
5. Update `js/viz/_bundle-presentation-modules.js`
6. Update `js/stats-viz.js`
7. Run verification

## Interactive Component Audit

No interactive component was added for this chapter. The core learning goals are reading fixed/random-effect output, ICC, model comparison, singular-fit warnings, and cross-level interaction terms; these are better served by compact static guide cards tied to the surrounding R output. No threshold or scenario manipulation is needed beyond the fixed chapter examples.

## Verification Commands

```bash
node --test tests/multilevel-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
python3 -m http.server 8000 &
sleep 2
curl -s http://127.0.0.1:8000/data/multilevel.html | grep -c 'stat-viz'
curl -s http://127.0.0.1:8000/js/viz/multilevel-guides.js | head -5
kill %1 2>/dev/null
```

Expected: 6+ stat-viz placeholders, multilevel-guides.js serves correctly.

## File Inventory

| File | Action |
|------|--------|
| `docs/plans/2026-04-29-chapter35-multilevel-teaching-optimization.md` | Create |
| `tests/multilevel-content.test.mjs` | Create |
| `js/viz/multilevel-guides.js` | Create |
| `data/multilevel.html` | Edit (add placeholders) |
| `js/viz/_bundle-presentation-modules.js` | Edit (add import) |
| `js/stats-viz.js` | Edit (add import) |