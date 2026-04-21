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

---

## 收录内容

### 基础统计分析（13章）
t检验 · 方差分析 · 离散分布 · 卡方检验 · Cochran-Armitage检验 · 秩转换非参数检验 · 双变量回归与相关 · 三线表绘制 · 统计绘图 · 样本量计算 · 随机分组 · ROC曲线 · tidy流统计分析

### 高级统计分析（23章）
多因素方差分析 · 球对称检验 · 重复测量方差分析 · 协方差分析 · 方差分析注意事项 · 多变量统计描述和推断 · 多元线性回归 · Logistic回归 · 对数线性模型 · 泊松回归 · 分类变量重编码 · 生存分析 · 生存曲线可视化 · 判别分析 · 聚类分析 · 主成分分析 · 主成分回归 · 探索性因子分析 · 偏相关和典型相关 · 结构方程模型 · 多水平模型 · 广义估计方程

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
├── index.html              # SPA 入口页面
├── manifest.json           # PWA manifest
├── favicon.svg             # 网站图标
├── README.md               # 项目文档
├── .gitignore
├── css/
│   └── style.css           # 所有样式（~1086 行）
├── js/
│   ├── app.js              # 主应用逻辑（~406 行）
│   ├── chapters.js         # 46 个章节的元数据（id / title / file）
│   ├── stats-viz.js        # 可视化模块加载器（~100 行）
│   └── viz/                # 可视化模块（ES Module 拆分）
│       ├── _core.js         # 注册表、init()、setupObserver()（~100 行）
│       ├── distributions.js # 正态/t/F/二项/泊松分布 explorer
│       ├── hypothesis.js    # t检验/ANOVA/Kruskal-Wallis/Friedman/Wilcoxon 等
│       ├── regression.js    # 散点图/回归/ROC/PCA 等
│       ├── survival.js      # Kaplan-Meier 生存曲线
│       ├── calculators.js   # t检验/卡方检验计算器
│       ├── advanced.js      # 高级可视化
│       ├── visualization.js # 通用图表组件
│       └── meta.js          # 配色、工具函数
├── data/                   # 章节内容 + 关联图片
│   ├── 1001-ttest.html     # t 检验
│   ├── 1002-anova.html     # 方差分析
│   ├── 1006-chisq.html     # 卡方检验
│   ├── discrete.html        # 离散分布
│   ├── 1032-survival.html  # 生存分析
│   ├── plotting.html        # 统计绘图
│   ├── roc.html            # ROC 曲线
│   ├── 表格三线表.html     # 三线表绘制
│   ├── *.html              # 46 个章节 HTML 文件
│   └── *_files/             # 各章节关联图片（统一在 data/ 下）
│       1002-anova_files/figure-html/*.png
│       ROC曲线_files/figure-html/*.png
│       ...
├── figs/                   # 网站页面用到的独立图片资源
│   └── *.png / *.jpg
└── .vercel/                # Vercel 部署配置（不上游）
```

---

## 技术架构

### 前端框架
- **纯原生 JavaScript** — 无需任何前端框架，ES Module 按需加载
- **SPA 架构** — 章节通过 `fetch()` 动态加载，DOMParser 提取内容
- **Canvas 2D API** — 所有统计图形自绘，不依赖 Chart.js
- **jStat CDN** — 统计函数库（正态/t/F/卡方分布的 PDF、CDF、逆函数）

### ES Module 模块设计
`stats-viz.js` 作为入口加载器，按需动态 `import()` 各个 viz 模块：
- **`viz/_core.js`** — 注册表（67 个条目）、`init()` 初始化、`setupObserver()` 监听动态挂载
- **`viz/distributions.js`** — 正态/t/F/二项/泊松分布的可视化 explorer
- **`viz/hypothesis.js`** — 参数检验：t 检验、ANOVA、Kruskal-Wallis H、Friedman M、Wilcoxon 符号秩
- **`viz/survival.js`** — Kaplan-Meier 生存曲线
- **`viz/regression.js`** — 散点图、线性回归、ROC 曲线（含 AUC）、PCA 碎石图
- **`viz/calculators.js`** — t 检验、卡方检验计算器

### 章节加载机制
1. 用户点击侧边栏 → `navigateToChapter(id)` → 更新 URL hash
2. `loadChapter(file)` → `fetch('data/xxx.html')` → `DOMParser` 提取 `<main id="quarto-document-content">`
3. `setupChapterInteractions()` → `initStatViz()` 扫描 `.stat-viz` / `.stat-calc` 标记，按 `data-type` 分发渲染
4. Quarto 原生的代码复制按钮被替换为内联 onclick 版本（绕过 ClipboardJS）

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
3. jStat 提供以下可用分布：`normal`, `studentt`, `chisquare`, `centralF`, `binomial`, `poisson`, `beta`, `gamma`，PDF/CDF/inv 方法齐全

### 本地开发

```bash
# 克隆
git clone https://github.com/tw2818/R_medical_stat_site.git
cd R_medical_stat_site

# 本地预览（任意静态服务器）
npx serve .
# 或
python3 -m http.server 8000
```

---

## 部署

项目通过 GitHub 连接到 Vercel，每次推送到 `main` 分支自动触发部署。

```
GitHub (main) → Vercel → r-medical-stat-site.vercel.app
```

无需 `vercel.json` 配置文件，Vercel 会自动检测为静态站点。

---

## 更新日志

### 2026-04-21 — 统计计算 bug 修复
- **Kruskal-Wallis H 检验**：`hypothesis.js` — 原输出 H=9.74 / P≈0.008 为硬编码，已替换为完整动态计算（含并列校正秩次、chi-square 近似 P 值）
- **Friedman M 检验**：`hypothesis.js` — 原输出 M=9.34 / P≈0.025 为硬编码，已替换为完整动态计算（区块内编秩 + tie 校正因子）
- **Kaplan-Meier 生存曲线**：`survival.js` — 原公式 `surv *= 1 - 1/(n - ...)` 与标准 product-limit estimator 不符，已重写为按时间点聚合 + 正确维护 at-risk 集合
- **t 分布 fallback**：`distributions.js` — 原 fallback 分支引用未定义的 `lgamma()`，已替换为 Stirling 近似 logΓ 函数
- **F 分布 fallback**：`distributions.js` — 原条件 `1/jStat.beta` 永远为真（beta 是对象），beta normalizing constant 从未被使用，已修正调用逻辑
- **`pad.left` 未定义**：`distributions.js` — 替换为正确属性名 `pad.l`

---

## 致谢

- 教程内容基于阿越《R语言实战医学统计》（https://ayueme.github.io/R_medical_stat/）
- 教材参考孙振球《医学统计学》第5版（颜艳、王彤 主编）
- 统计计算使用 [jStat](https://github.com/jstat/jstat)
