# Chapter 34 SEM Teaching Optimization Plan

## Scope

Optimize `data/sem.html` (Chapter 34 结构方程模型) as a content-first, behavior-preserving teaching slice.

## Constraints

- Preserve the generated chapter structure and all original R code/output blocks.
- Preserve code block anchors `cb6`–`cb22` exactly; do not renumber or reorder. Earlier inline examples are not emitted as numbered executable code blocks in this chapter.
- Preserve the existing `data-type="sem"` widget registered in `structure-diagrams.js`.
- Add compact `stat-viz` teaching cards plus short paragraphs; avoid large callout-heavy rewrites.
- Chapter sections: 34.1 (理论知识), 34.2 (分析步骤), 34.3 (R语言实战), 34.4 (参考资料).

## Planned teaching additions

Add a dedicated renderer module `js/viz/sem-guides.js` (CSS prefix: `.sem-guide-*`) with these guide cards:

### 1. `sem-concept-guide` — SEM概念与工作流程

- Badge: "SEM概念"
- Icon: "SEM"
- Lead: 结构方程模型(SEM)是基于变量协方差矩阵的多变量统计方法，用于研究可观测变量与潜变量之间的结构关系，同时处理测量误差。
- Steps:
  - ["潜变量与显变量", "潜变量无法直接测量（如"学习能力"），需通过显变量（如"考试成绩"）间接反映"]
  - ["测量模型", "描述观测变量与潜变量之间的关系，用=~表示，如：学习能力=~语文+数学+英语"]
  - ["结构模型", "描述潜变量之间的因果关系，用~表示，如：学习成绩~学习能力+学习态度"]
  - ["SEM工作流程", "模型设定→识别→估计→评价→修正，迭代优化直至模型拟合良好"]
- Note: 本章使用lavaan包进行SEM分析，数据为Stroke-PRO量表（295例脑卒中患者）

### 2. `sem-measurement-structural-guide` — 测量模型与结构模型区别

- Badge: "模型类型"
- Icon: "M/S"
- Lead: SEM包含测量模型（潜变量与显变量的关系）和结构模型（潜变量之间的关系）两大部分。
- Steps:
  - ["测量模型", "用=~定义，表示潜变量由哪些观测变量测量，如：f1=~x1+x2+x3"]
  - ["结构模型", "用~定义，表示潜变量之间的回归关系，如：f2~f1（f1影响f2）"]
  - ["CFA", "只有测量模型，没有结构模型时，称验证性因子分析(CFA)"]
  - ["路径分析", "只有结构模型，没有测量模型时，称路径分析(Path Analysis)"]
- Note: 本章例题中34.3.3是CFA，34.3.4是完整SEM

### 3. `sem-lavaan-syntax-guide` — lavaan语法入门

- Badge: "lavaan"
- Icon: "Lv"
- Lead: lavaan是R中专门用于潜变量分析的包，语法包含4类运算符：~、=~、~~、~1。
- Steps:
  - ["~ 回归", "y~x1+x2，表示y由x1、x2预测（类似普通回归）"]
  - ["=~ 潜变量定义", "f=~x1+x2+x3，表示潜变量f由显变量x1、x2、x3测量"]
  - ["~~ 协方差/方差", "x1~~x2估计协方差；x1~~x1估计方差（残差）"]
  - ["~1 截距", "y~1，~1表示截距项"]
- Note: 完整模型用单引号括起来，如：model <- "f1=~x1+x2; f2~f1"

### 4. `sem-cfa-result-guide` — CFA结果解读

- Badge: "CFA"
- Icon: "CFA"
- Lead: CFA结果主要看三部分：因子载荷（测量模型）、因子间协方差、结构模型拟合指标。
- Steps:
  - ["因子载荷", "Estimate为非标准化载荷，Std.lv为潜变量标准化，Std.all为完全标准化"]
  - ["载荷判断", "载荷绝对值越大（通常>0.4），说明该显变量对潜变量的测量越准确"]
  - ["因子间协方差", "两个潜变量之间的相关程度，P<0.05表示显著相关"]
  - ["R²", "各显变量能被潜变量解释的比例，R²越大测量越准确"]
- Note: 本章CFA例题χ²=630.894, df=164, CFI=0.867, RMSEA=0.098

### 5. `sem-fit-index-guide` — 拟合指标解读

- Badge: "拟合指标"
- Icon: "Fit"
- Lead: 模型拟合评价需综合多个指标，绝不仅是看p值。
- Steps:
  - ["χ²检验", "χ²越小越好，但受样本量影响大，样本量大时容易拒绝好模型"]
  - ["CFI/TLI", "比较拟合指数，CFI>0.9为良好，TLI>0.9为良好"]
  - ["RMSEA", "近似误差均方根，RMSEA<0.05为良好，<0.08为可接受"]
  - ["SRMR", "标准化残差均方根，SRMR<0.08为良好，<0.05为非常好"]
- Note: 单一指标不能判断模型好坏，需综合多个指标以及理论意义

### 6. `sem-model-modification-guide` — 模型修正策略

- Badge: "模型修正"
- Icon: "Mod"
- Lead: 模型拟合不佳时可通过修正指数(MI)指导添加参数，但需有理论依据。
- Steps:
  - ["修正指数MI", "lavaan提供修正指数，提示添加某参数后χ²减少量"]
  - ["先测后结", "修正应先解决测量模型问题，再考虑结构模型问题"]
  - ["一次一项", "每次只做一个修正，避免影响其他参数估计"]
  - ["有据可循", "修正应有理论支持，不能仅凭数据驱动随意添加路径"]
- Note: 模型修正应基于理论和先验知识，不能纯粹数据驱动

## HTML insertion points

1. After 34.1 intro blockquote: sem-concept-guide
2. After 34.2 5-step list: sem-concept-guide (second instance)
3. After 34.1.3 heading: sem-measurement-structural-guide
4. After 34.3.1 lavaan intro: sem-lavaan-syntax-guide
5. After 34.2.4 fit index table: sem-fit-index-guide
6. After 34.3.3 CFA explanation: sem-cfa-result-guide
7. After 34.2.5 model modification section: sem-model-modification-guide

## Tests

Create `tests/sem-content.test.mjs` (11 tests) to protect:

- chapter title and section headings (34.1 理论知识, 34.2 分析步骤, 34.3 R语言实战, 34.4 参考资料)
- code block anchors `cb6`–`cb22` with no duplicates
- representative original R snippets and outputs
- existing `data-type="sem"` widget
- existing `registerViz('sem', ...)` in `structure-diagrams.js`
- the new guide placeholders, registrations, imports, escaping, and interactivity

## Import points

- `js/stats-viz.js` — main viz entry
- `js/viz/_bundle-presentation-modules.js` — presentation bundle

## Verification

Run:

```bash
node --test tests/sem-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
git diff --check
```

Then perform HTTP smoke checks for `/`, `/data/sem.html`, `/js/stats-viz.js`, `/js/viz/_bundle-presentation-modules.js`, and `/js/viz/sem-guides.js`, then clean up the preview server.
