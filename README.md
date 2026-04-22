# R语言实战医学统计

> 面向医学科研人员的交互式 R 语言统计教程，完全复现孙振球《医学统计学》第5版例题。

**在线访问：** https://r.tweb.one

---

## 功能特点

- **📖 46 个专题章节** — 从基础 t 检验到高级生存分析全覆盖
- **📋 代码可复制** — 所有 R 代码一键复制到剪贴板
- **📊 67 个交互式可视化/计算器组件** — 内置统计图形 + 实时参数调节
- **📱 移动端适配** — 响应式布局，手机/平板可用
- **🔍 章节搜索** — 侧边栏实时搜索
- **✅ 学习进度追踪** — 自动记录已访问章节
- **🧪 轻量验证基线** — 为关键统计计算器保留回归校验样例与可执行脚本

---

## 收录内容

### 基础统计分析（13章）
t检验 · 方差分析 · 离散分布 · 卡方检验 · Cochran-Armitage检验 · 秩转换非参数检验 · 双变量回归与相关 · 三线表绘制 · 统计绘图 · 样本量计算 · 随机分组 · ROC曲线 · tidy流统计分析

### 高级统计分析（23章）
多因素方差分析 · 球对称检验 · 重复测量方差分析 · 协方差分析 · 方差分析注意事项 · 多变量统计描述和统计推断 · 多元线性回归 · Logistic回归 · 对数线性模型 · 泊松回归 · 分类变量重编码 · 生存分析 · 生存曲线可视化 · 判别分析 · 聚类分析 · 主成分分析 · 主成分回归 · 探索性因子分析 · 偏相关和典型相关 · 结构方程模型 · 多水平模型 · 广义估计方程

### 文献常见统计分析（9章）
Fine-Gray检验和竞争风险模型 · 倾向性评分（匹配/回归和分层/加权）· p-for-trend · 多项式拟合 · 样条回归 · 亚组分析及森林图绘制

---

## 交互式可视化组件

统计计算基于 [jStat](https://github.com/jstat/jstat) 库，图形使用 Canvas 2D API 纯前端渲染，无需服务器。

| # | 类型 | 名称 | 所在章节 |
|---|------|------|---------|
| 1 | 📊 | 正态分布 explorer（μ/σ 滑块） | t检验 |
| 2 | 📊 | t 分布 vs 正态分布对比（df 滑块） | t检验 |
| 3 | 📊 | P 值可视化器（点击设定 t 值） | t检验 |
| 4 | 🧮 | t 检验计算器（单样本/双样本） | t检验 |
| 5 | 🧮 | 卡方检验 + Fisher 精确检验计算器 | 卡方检验 |
| 6 | 📊 | 散点图 + 回归直线（n/r 滑块） | 双变量相关 |
| 7 | 📊 | ANOVA 条形图（3 组 means±SD） | 方差分析 |
| 8 | 📊 | F 分布 explorer（df1/df2 滑块） | 方差分析 |
| 9 | 📊 | PCA 碎石图（累积方差线） | 主成分分析 |
| 10 | 📊 | 二项分布 B(n,p) 条形图（n/p 滑块） | 离散分布 |
| 11 | 📊 | 泊松分布 P(λ) 条形图（λ 滑块） | 离散分布 |
| 12 | 📊 | Kaplan-Meier 生存曲线（含截尾标记） | 生存分析 |
| 13 | 📊 | Wilcoxon 符号秩检验图（柱状图+秩次标注） | 秩转换非参数检验 |
| 14 | 📊 | Kruskal-Wallis H 检验箱线图（动态 H/P 值） | 秩转换非参数检验 |
| 15 | 📊 | Friedman M 检验连线图（动态 M/P 值） | 秩转换非参数检验 |

---

## 项目结构

```
R_medical_stat_site/
├── index.html                     # SPA 入口页面
├── manifest.json                  # PWA manifest
├── favicon.svg                    # 网站图标
├── README.md                      # 项目文档
├── package.json                   # 最小开发命令入口（preview / validate）
├── .gitignore
├── css/
│   └── style.css                  # 全站样式
├── js/
│   ├── app.js                     # 主应用逻辑（ES Module）
│   ├── chapters.js                # 46 个章节元数据 + 进度工具（ES Module）
│   ├── stats-viz.js               # 可视化模块加载入口
│   └── viz/                       # 可视化模块（ES Module 拆分）
│       ├── _core.js               # 注册表、init()、setupObserver()
│       ├── distributions.js       # 正态/t/F/二项/泊松分布 explorer
│       ├── hypothesis-nonparametric.js # 非参数检验 + 重复测量交互效应
│       ├── hypothesis-remaining.js     # ANOVA / 散点图 / Q-Q 图 / 交互图 / Bland-Altman
│       ├── clinical-models.js     # Logistic / ROC / Cox / 列线图
│       ├── structure-diagrams.js  # 偏相关 / 聚类树状图 / SEM / 自相关图
│       ├── survival.js            # Kaplan-Meier 生存曲线
│       ├── calculators.js         # 其他计算器组件
│       ├── advanced.js            # 高级可视化
│       ├── visualization.js       # 通用图表组件
│       ├── meta.js                # 配色、工具函数
│       └── overrides.js           # 对 t 检验 / 卡方-Fisher 计算器的精度覆盖修复
├── data/                          # 章节内容 + 关联图片
│   ├── 1001-ttest.html            # t 检验
│   ├── 1002-anova.html            # 方差分析
│   ├── 1006-chisq.html            # 卡方检验
│   ├── discrete.html              # 离散分布
│   ├── 1032-survival.html         # 生存分析
│   ├── plotting.html              # 统计绘图
│   ├── roc.html                   # ROC 曲线
│   ├── *.html                     # 46 个章节 HTML 文件
│   └── *_files/                   # 各章节关联图片
├── tests/                         # 轻量回归校验基线
│   ├── README.md                  # 校验工作流说明
│   ├── run_validation.js          # 零依赖可执行校验脚本
│   └── stat_calculator_cases.json # 关键统计组件验证样例
├── figs/                          # 网站页面用到的独立图片资源
│   └── *.png / *.jpg
└── .vercel/                       # Vercel 部署配置（不上游）
```

---

## 技术架构

### 前端框架
- **纯原生 JavaScript** — 无需前端框架，ES Module 拆分加载
- **SPA 架构** — 章节通过 `fetch()` 动态加载，`DOMParser` 提取正文
- **Canvas 2D API** — 统计图形纯前端自绘，不依赖 Chart.js
- **jStat CDN** — 统计函数库（正态/t/F/卡方分布的 PDF、CDF、逆函数）

### ES Module 模块设计
`stats-viz.js` 作为入口加载器，当前运行路径加载：
- **`viz/_core.js`** — 注册表、`init()` 初始化、`setupObserver()` 动态挂载监听
- **`viz/distributions.js`** — 正态/t/F/二项/泊松分布 explorer
- **`viz/hypothesis-nonparametric.js`** — Wilcoxon、Kruskal-Wallis、Friedman、重复测量交互效应
- **`viz/hypothesis-remaining.js`** — ANOVA、散点图、PCA 碎石图、Q-Q 图、析因交互图、Bland-Altman
- **`viz/clinical-models.js`** — Logistic OR 森林图、ROC/ROC 对比、Cox HR 森林图、列线图
- **`viz/structure-diagrams.js`** — 偏相关、聚类树状图、SEM、自相关图
- **`viz/survival.js`** — Kaplan-Meier 生存曲线
- **`viz/overrides.js`** — 通过 registry 覆盖 `ttest` 和 `chisq` 两个计算器，避免直接硬改大文件

> 目前可视化模块边界已经比最初清晰得多：假设检验、临床建模、结构示意和生存分析都已分离。

### 章节加载机制
1. 用户点击侧边栏 → `navigateToChapter(id)` → 更新 URL hash
2. `loadChapter(file)` → `fetch('data/xxx.html')` → `DOMParser` 提取 `<main id="quarto-document-content">`
3. `setupChapterInteractions()` → `initStatViz()` 扫描 `.stat-viz` / `.stat-calc` 标记，按 `data-type` 分发渲染
4. Quarto 代码复制按钮会在章节内容注入后被替换为站内统一样式按钮，并通过 JS 统一绑定复制行为
5. `chapters.js` 现已改为 ES Module，由 `app.js` 显式导入章节数据与进度工具，而不再依赖全局挂载

### 轻量验证基线
仓库现在包含一个不依赖测试框架的回归校验基线：

- `tests/stat_calculator_cases.json`
- `tests/run_validation.js`
- `tests/README.md`

它的目标不是替代正式自动化测试，而是先把关键统计组件的：

- 输入样例
- 关键输出约束
- 高风险回归点

固化下来，方便后续：

- 手工回归
- Playwright 接入
- Node 脚本校验

当前最小可执行方式：

```bash
npm run validate
# 或
node tests/run_validation.js
```

目前优先覆盖：
- `ttest`
- `chisq` / Fisher exact
- `kruskal`
- `friedman`
- `survival` 的基本不变量

### 可视化组件注册约定
```html
<!-- 可视化图形 -->
<div class="stat-viz" data-type="kruskal" data-title="Kruskal-Wallis H检验"></div>
<!-- 计算器（带输入框） -->
<div class="stat-calc" data-type="ttest" data-title="t检验计算器"></div>
```

---

## 开发

### 添加新的可视化组件

1. 在 `viz/*.js` 中编写渲染函数并调用 `registerViz('typename', renderFn)`
2. 在对应章节的 `.html` 文件中加入 `<div class="stat-viz" data-type="typename">` 标记
3. jStat 提供以下可用分布：`normal`, `studentt`, `chisquare`, `centralF`, `binomial`, `poisson`, `beta`, `gamma`

### 本地开发

```bash
# 克隆
git clone https://github.com/tw2818/R_medical_stat_site.git
cd R_medical_stat_site

# 使用统一命令入口
npm run preview
npm run validate

# 或继续使用任意静态服务器
npx serve .
# 或
python3 -m http.server 8000
```

---

## 部署

项目通过 GitHub 连接到 Vercel，每次推送到 `main` 分支自动触发部署。

```
GitHub (main) → Vercel → https://r.tweb.one
```

无需 `vercel.json` 配置文件，Vercel 会自动检测为静态站点。

---

## 更新日志

### 2026-04-22 — chapters.js 模块化，减少全局依赖
- **模块边界收紧**：将 `chapters.js` 从全局脚本改为 ES Module，显式导出章节数据、分组配置和进度工具
- **应用层同步**：`app.js` 改为通过 import 使用 `CHAPTERS`、`ALL_CHAPTERS`、`GROUP_CONFIG`、`saveProgress()`、`updateProgressBar()`
- **入口同步**：`index.html` 不再单独以普通脚本加载 `chapters.js`，改为由模块脚本驱动
- **意义**：减少加载顺序耦合，让章节数据层与应用层的依赖关系更显式

### 2026-04-22 — 小范围清理核心代码注释与样式
- **注释一致性**：修正 `stats-viz.js` 中已经过期的 `jStat @latest` 注释，和当前固定版本保持一致
- **死代码清理**：删除 `app.js` 中未使用的 `currentChapterData` 变量
- **样式整理**：将 `_core.js` 中的 `jstat-warn` 与 canvas 内联样式改为 CSS class
- **意义**：减少小型历史残留，让核心代码与当前工程状态更加一致

### 2026-04-22 — 重写附录页，使其回到本站定位
- **内容重写**：将 `9999-appendix.html` 从外部资源与公众号导流页，改为本站自己的“站点说明与补充资源”页面
- **内容范围调整**：保留站点定位、使用方式、验证入口、本地开发命令、参考来源与版权说明，移除不必要的外部合集导流内容
- **意义**：让附录页与 `r.tweb.one` 的站点身份、使用场景和工程状态保持一致

### 2026-04-22 — 增加 package.json 并清理代码复制按钮 inline 行为
- **开发入口**：新增最小 `package.json`，统一提供 `npm run preview` 和 `npm run validate`
- **复制按钮整理**：将 Quarto 代码复制按钮的 inline `onclick / onmouseover / onmouseout / style` 移出 HTML 字符串，改为统一 class + JS 绑定 + CSS 样式
- **意义**：进一步降低内联行为，改善可维护性，并为后续更严格的前端策略和测试铺路

### 2026-04-22 — 固定 jStat 版本并清理首页 inline handler
- **依赖稳定性**：将 `jStat` CDN 从 `@latest` 固定为明确版本，降低上游变更带来的线上波动风险
- **交互整理**：把首页欢迎页、顶部栏和“继续学习”按钮这批 inline `onclick` 改为 `data-* + JS 事件委托`
- **意义**：减少 HTML 内联行为，便于后续继续做 CSP、可维护性整理和前端测试

### 2026-04-22 — 增加可执行的轻量验证脚本
- **新增脚本**：`tests/run_validation.js`
- **当前能力**：检查 case JSON 合法性、重复 id、关键输入结构，以及部分基线数值
- **运行方式**：`node tests/run_validation.js`
- **意义**：把原来的“文档化验证基线”推进到“最小可执行验证器”阶段

### 2026-04-22 — 增加轻量验证基线
- **新增目录**：`tests/`
- **新增基线文件**：`tests/stat_calculator_cases.json`
- **新增说明**：`tests/README.md`
- **目的**：为关键统计组件建立低成本回归校验基线，便于后续接入自动化或手工验证

### 2026-04-22 — 删除 legacy regression 文件
- **仓库清理**：删除 `js/viz/regression.js`
- **运行路径收口**：`stats-viz.js` 不再引用 `regression.js`
- **状态收口**：临床建模与结构示意相关代码现在完全由 `clinical-models.js` 与 `structure-diagrams.js` 承担
- **README 同步**：删除对 legacy 文件的引用，更新当前最终模块结构

### 2026-04-22 — regression 模块继续拆结构示意组件
- **新增模块**：`js/viz/structure-diagrams.js`
- **首批迁移**：偏相关、聚类树状图、SEM、自相关图
- **运行路径切换**：`stats-viz.js` 现在在 `regression.js` 后加载 `structure-diagrams.js`，由新模块覆盖对应 registry 项
- **意义**：`regression.js` 进一步摆脱“临床建模 + 结构示意 + 相关分析”混装状态

### 2026-04-22 — regression 模块开始拆临床建模组件
- **新增模块**：`js/viz/clinical-models.js`
- **首批迁移**：Logistic OR 森林图、ROC / ROC 对比、Cox HR 森林图、列线图
- **运行路径切换**：`stats-viz.js` 现在在 `regression.js` 后加载 `clinical-models.js`，由新模块覆盖对应 registry 项
- **意义**：`regression.js` 开始摆脱“临床模型 + 结构图 + 相关分析”混装状态

### 2026-04-22 — 删除 legacy hypothesis 文件
- **仓库清理**：删除 `js/viz/hypothesis.js`
- **状态收口**：假设检验相关代码现在完全由 `hypothesis-nonparametric.js` 与 `hypothesis-remaining.js` 承担
- **README 同步**：删除对 legacy 文件的引用，更新当前最终模块结构

### 2026-04-22 — 运行路径脱离 legacy hypothesis 模块
- **新增模块**：`js/viz/hypothesis-remaining.js`，承接 ANOVA、散点图、PCA 碎石图、Q-Q 图、析因交互图、Bland-Altman
- **运行路径切换**：`js/stats-viz.js` 不再加载 `hypothesis.js`，改为直接加载 `hypothesis-nonparametric.js` + `hypothesis-remaining.js`
- **意义**：运行时已经真正脱离历史超长文件
- **后续方向**：继续精简模块职责边界，必要时再拆其他模块

### 2026-04-22 — README 同步 + hypothesis 模块拆分起步
- **README 同步**：更新模块结构、最近修复记录、当前架构状态描述
- **模块边界建立**：新增 `js/viz/hypothesis-nonparametric.js`，首批抽离 `wilcoxon`、`kruskal`、`friedman`、`rminteraction`
- **主入口接线**：`js/stats-viz.js` 显式引入新模块，为后续继续拆 `hypothesis.js` 做准备
- **说明**：这一轮是“先抽模块、后清旧代码”的第一步，优先保证低风险和易回滚

### 2026-04-22 — 计算器精度修复 + 移动端返回首页按钮调整
- **t 检验计算器**：95% CI 改为优先使用精确 t 临界值；Welch t 检验不再先四舍五入自由度再计算 p 值；两样本结果增加均数差与 95% CI
- **卡方 / Fisher 计算器**：修正 Fisher 双侧精确检验求和逻辑，增加最小期望频数显示，对 2×2 且期望频数较小的情况提示优先参考 Fisher
- **实现方式**：新增 `js/viz/overrides.js`，通过 registry 覆盖 `ttest` / `chisq` 组件，避免直接硬改超长的 `hypothesis.js`
- **移动端可用性**：将“返回首页”按钮从侧边栏底部移到顶部栏，避免抽屉式侧边栏下方遮挡

### 2026-04-22 — 进度系统重构 + 一致性清理
- **进度系统**：统一使用 `rstat_visited` 作为单一数据源，自动去重并过滤失效章节 id
- **逻辑复用**：`app.js` 改为复用 `chapters.js` 中的 `saveProgress()` / `updateProgressBar()`，减少重复 localStorage 写入逻辑
- **UI 一致性**：返回首页时恢复顶部标题；`continueLearning()` 找到目标章节后立即返回
- **章节核对**：重新核对 `data/` 与 `chapters.js`，正式章节数仍为 46，未发现真实目录漂移

### 2026-04-21 — 统计计算 bug 修复
- **Kruskal-Wallis H 检验**：原输出 H=9.74 / P≈0.008 为硬编码，已替换为完整动态计算（含并列校正秩次、chi-square 近似 P 值）
- **Friedman M 检验**：原输出 M=9.34 / P≈0.025 为硬编码，已替换为完整动态计算（区块内编秩 + tie 校正因子）
- **Kaplan-Meier 生存曲线**：`survival.js` — 原公式与标准 product-limit estimator 不符，已重写为按时间点聚合 + 正确维护 at-risk 集合
- **t 分布 fallback**：`distributions.js` — 原 fallback 分支引用未定义的 `lgamma()`，已替换为 Stirling 近似 `logΓ`
- **F 分布 fallback**：`distributions.js` — 修正 beta normalizing constant 的调用逻辑
- **`pad.left` 未定义**：`distributions.js` — 替换为正确属性名 `pad.l`

---

## 致谢

- 教程内容基于阿越《R语言实战医学统计》（https://ayueme.github.io/R_medical_stat/）
- 教材参考孙振球《医学统计学》第5版（颜艳、王彤 主编）
- 统计计算使用 [jStat](https://github.com/jstat/jstat)
