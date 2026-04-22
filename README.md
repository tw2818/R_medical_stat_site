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

详细更新记录见 [附录页](/data/9999-appendix.html)（站内可折叠查看）。以下是近期重要改动：

### 2026-04-22
- **附录页与首页 UI 优化**：精简附录页正文内容，更新日志改为默认折叠，各 section 加左侧彩色竖线；首页学习路线 tab 加切换动画，footer 加分隔线
- **桌面端 topbar 显示**：修复桌面端 Home/主题切换按钮缺失问题，`☰` 菜单键仅在移动端显示
- **进度追踪改进**：学习进度改为计时器判断（停留 30 秒才算完成），重置进度按钮上线，顶部进度条实时更新
- **ES Module 重构**：`chapters.js` 改为 ES Module，`app.js` 通过 import 使用章节数据，减少全局依赖
- **代码复制按钮整理**：Quarto inline handler 全部移出 HTML，改为 class + JS 事件委托
- **固定 jStat 版本**：CDN 从 `@latest` 改为明确版本号，避免上游波动
- **轻量验证基线**：`tests/` 目录含可执行校验脚本，`npm run validate` 即可运行

### 2026-04-21
- **统计计算 bug 修复**：Kruskal-Wallis H / Friedman M / Kaplan-Meier / t 分布 fallback / F 分布 fallback 等硬编码值全部替换为动态计算

---

## 致谢

- 教程内容基于阿越《R语言实战医学统计》（https://ayueme.github.io/R_medical_stat/）
- 教材参考孙振球《医学统计学》第5版（颜艳、王彤 主编）
- 统计计算使用 [jStat](https://github.com/jstat/jstat)
