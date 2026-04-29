# R语言实战医学统计

> 面向医学科研人员的交互式 R 语言统计教程，完全复现孙振球《医学统计学》第5版例题。

**在线访问：** https://r.tweb.one

---

## 功能特点

- **📖 46 个专题章节** — 从基础 t 检验到高级生存分析全覆盖
- **📋 代码可复制** — 所有 R 代码一键复制到剪贴板
- **📊 多个交互式可视化/计算器组件** — 内置统计图形 + 实时参数调节
- **📱 移动端适配** — 响应式布局，手机/平板可用
- **🔍 章节搜索** — 侧边栏实时搜索
- **✅ 学习进度追踪** — 自动记录已访问章节
- **🧪 轻量验证基线** — 为关键统计计算器保留回归校验样例与可执行脚本
- **🧩 章节定向修补层** — 允许对个别章节做文本修补、组件插入和组件移除，而不继续挤压总站入口文件

---

## 收录内容

### 基础统计分析（13章）
t检验 · 方差分析 · 离散分布 · 卡方检验 · Cochran-Armitage检验 · 秩转换非参数检验 · 双变量回归与相关 · 三线表绘制 · 统计绘图 · 样本量计算 · 随机分组 · ROC曲线 · tidy流统计分析

### 高级统计分析（23章）
多因素方差分析 · 球对称检验 · 重复测量方差分析 · 协方差分析 · 方差分析注意事项 · 多变量统计描述和统计推断 · 多元线性回归 · Logistic回归 · 对数线性模型 · 泊松回归 · 分类变量重编码 · 生存分析 · 生存曲线可视化 · 判别分析 · 聚类分析 · 主成分分析 · 主成分回归 · 探索性因子分析 · 偏相关和典型相关 · 结构方程模型 · 多水平模型 · 广义估计方程

### 文献常见统计分析（9章）
Fine-Gray检验和竞争风险模型 · 倾向性评分（匹配/回归和分层/加权）· p-for-trend · 多项式拟合 · 样条回归 · 亚组分析及森林图绘制

---

## 代表性交互式组件

统计计算基于 [jStat](https://github.com/jstat/jstat) 库，图形使用 Canvas 2D API 纯前端渲染，无需服务器。

| # | 类型 | 名称 | 所在章节 |
|---|------|------|---------|
| 1 | 📊 | 正态分布 explorer（μ/σ 滑块） | t检验 |
| 2 | 📊 | t 分布 vs 正态分布对比（df 滑块） | t检验 |
| 3 | 📊 | P 值可视化器（点击设定 t 值） | t检验 |
| 4 | 🧮 | t 检验计算器（单样本/双样本/配对） | t检验 |
| 5 | 🧮 | 卡方检验 + Fisher 精确检验计算器 | 卡方检验 |
| 6 | 📊 | 配对四格表 McNemar 组件 | 卡方检验 |
| 7 | 🧩 | 马赛克图（面积 + Pearson 残差） | 卡方检验 |
| 8 | 🔥 | 列联表热力图（观察值/期望值/残差切换） | 卡方检验 |
| 9 | 📈 | Cochran-Armitage 趋势检验组件 | Cochran-Armitage检验 |
| 10 | 📊 | 散点图 + 回归直线（相关/回归） | 双变量回归与相关 |
| 11 | 📈 | Pearson / Spearman / Kendall 对比组件 | 双变量回归与相关 |
| 12 | 📉 | 曲线拟合比较（线性/二次/对数） | 双变量回归与相关 |
| 13 | 🧾 | 基线资料三线表示例 | 三线表绘制 |
| 14 | 🧾 | 三线表成品布局演示 | 三线表绘制 |
| 15 | 📊 | 二项分布 / 泊松分布与率比较组件 | 离散分布 |

---

## 项目结构

```text
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
│   ├── app/                       # 主应用模块化拆分（ES Module）
│   │   │   ├── search.js              # 搜索功能
│   │   │   ├── progress-widget.js     # 进度追踪组件
│   │   │   ├── ui-shell.js            # UI 壳层
│   │   │   ├── home-enhancements.js   # 首页增强
│   │   │   ├── navigation.js          # 导航逻辑
│   │   │   ├── chapter-content.js     # 章节内容处理
│   │   │   ├── nav-shell.js           # 导航壳层
│   │   │   ├── toast.js               # 提示组件
│   │   │   ├── chapter-dom.js         # 章节 DOM 处理
│   │   │   ├── lightbox.js            # 灯箱组件
│   │   │   ├── chapter-interactions.js # 章节交互
│   │   │   ├── chapter-loader.js      # 章节加载器
│   │   │   ├── theme.js               # 主题管理
│   │   │   └── state.js               # 状态管理
│   ├── chapters.js                # 46 个章节元数据 + 进度工具（ES Module）
│   ├── chapter-patches.js         # 章节 patch 组合入口
│   ├── chapter-patches-text.js    # 章节文字修补
│   ├── chapter-patches-widgets.js # 章节组件插入 / 移除修补
│   ├── chapter-patches-text-extra.js # 章节文字修补（扩展）
│   └── viz/                       # 可视化模块（ES Module 拆分）
│       ├── _core.js               # 注册表、init()、setupObserver()
│       ├── _bundle-core-modules.js       # 基础统计 / 推断组件分组入口
│       ├── _bundle-categorical-modules.js# 分类资料组件分组入口
│       ├── _bundle-bivariate-modules.js  # 双变量 / 回归组件分组入口
│       ├── _bundle-presentation-modules.js # 表格与覆盖层分组入口
│       ├── distributions.js       # 正态/t/F/二项/泊松分布 explorer
│       ├── hypothesis-nonparametric.js   # 非参数检验 + 重复测量交互效应
│       ├── hypothesis-remaining.js       # ANOVA / 散点图 / Q-Q 图 / Bland-Altman
│       ├── clinical-models.js     # Logistic / ROC / Cox / 列线图
│       ├── structure-diagrams.js  # 偏相关 / 聚类树状图 / SEM / 自相关图
│       ├── survival.js            # Kaplan-Meier 生存曲线
│       ├── calculators.js         # 其他计算器组件
│       ├── discrete-inference.js  # 离散分布推断类组件
│       ├── categorical-trends.js  # Cochran-Armitage 趋势与相关注入逻辑
│       ├── categorical-tests.js   # McNemar 等分类检验组件
│       ├── categorical-displays.js# 马赛克图 / 列联表热力图
│       ├── baseline-table.js      # Table 1 / 基线资料表
│       ├── bivariate-extensions.js# 秩相关 / 曲线拟合组件
│       ├── table-presentation.js  # 三线表布局演示组件
│       ├── advanced.js            # 高级可视化
│       ├── visualization.js       # 通用图表组件
│       ├── meta.js                # 配色、工具函数
│       ├── overrides.js           # 对关键计算器的精度覆盖修复
│       ├── ancova-guides.js        # 协方差分析教学指导
│       ├── anova-attention-guides.js # ANOVA 注意事项教学指导
│       ├── hotelling-guides.js     # Hotelling 统计教学指导
│       ├── multireg-guides.js      # 多元回归教学指导
│       ├── logistic-guides.js      # Logistic 回归教学指导
│       ├── loglinear-guides.js     # 对数线性模型教学指导
│       ├── poisson-guides.js       # 泊松回归教学指导
│       ├── survival-guides.js      # 生存分析教学指导
│       ├── survivalvis-guides.js   # 生存曲线可视化教学指导
│       ├── roc-guides.js           # ROC 曲线教学指导
│       ├── pca-guides.js           # 主成分分析教学指导
│       ├── cluster-guides.js       # 聚类分析教学指导
│       ├── discriminant-guides.js  # 判别分析教学指导
│       ├── codescheme-guides.js    # 分类变量编码教学指导
│       ├── factorial-design-guides.js # 析因设计教学指导
│       ├── repeated-anova-guides.js # 重复测量 ANOVA 教学指导
│       ├── repeated-measures-guides.js # 重复测量教学指导
│       ├── plotting-guides.js      # 统计绘图教学指导
│       ├── sample-size-guides.js   # 样本量计算教学指导
│       ├── randomization-guides.js  # 随机分组教学指导
│       ├── tidy-flow-guides.js     # tidy-flow 统计分析教学指导
│       ├── table1-guides.js        # Table 1 教学指导
│       ├── regression-correlation-tutorial.js # 回归相关教程
│       ├── anova-tutorial.js       # 方差分析教程
│       ├── chisq-tutorial.js       # 卡方检验教程
│       ├── paired-ttest-tutorial.js # 配对 t 检验教程
│       ├── nonparametric-tutorial.js # 非参数检验教程
│       ├── discrete-teaching.js     # 离散分布教学
│       ├── rank-correlation.js      # 秩相关组件
│       ├── regression.js           # 回归组件
│       ├── binomial-ci-fix.js      # 二项分布置信区间修复
│       ├── binomial-distribution-fix.js # 二项分布修复
│       ├── poisson-ci-fix.js       # 泊松置信区间修复
│       ├── poisson-distribution-fix.js # 泊松分布修复
│       └── mcnemar-guide-fix.js    # McNemar 指导修复
├── data/                          # 章节内容 + 关联图片
│   ├── 1001-ttest.html            # t 检验
│   ├── 1002-anova.html            # 方差分析
│   ├── 1006-chisq.html            # 卡方检验
│   ├── 1015-twocorrelation.html   # 双变量回归与相关
│   ├── table3.html                # 三线表绘制
│   ├── discrete.html              # 离散分布
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
- **jStat 1.9.6 CDN** — 统计函数库（正态/t/F/卡方分布的 PDF、CDF、逆函数）

### ES Module 模块设计
`stats-viz.js` 作为总入口，但不再自己维护一长串组件路径，而是按职责分组导入：

- **`viz/_bundle-core-modules.js`** — 基础统计 / 推断 / 通用图表
- **`viz/_bundle-categorical-modules.js`** — 分类资料、列联表、Table 1
- **`viz/_bundle-bivariate-modules.js`** — 双变量、相关、回归、曲线拟合
- **`viz/_bundle-presentation-modules.js`** — 表格展示与覆盖层修复

底层仍由 `viz/_core.js` 统一管理组件注册表、`init()` 初始化和 `setupObserver()` 动态挂载监听。

### 章节加载与 patch 机制
1. 用户点击侧边栏 → `navigateToChapter(id)` → 更新 URL hash
2. `loadChapter(file)` → `fetch('data/xxx.html')` → `DOMParser` 提取 `<main id="quarto-document-content">`
3. `applyChapterPatches(container, filename)` 统一调度章节定向修补
4. `initStatViz()` 扫描 `.stat-viz` / `.stat-calc` 标记，按 `data-type` 分发渲染
5. 代码复制按钮和 callout 折叠逻辑在章节内容注入后统一绑定

章节定向修补现在不再继续堆在 `app.js` 里，而是拆成：
- **`chapter-patches-text.js`** — 文字修补
- **`chapter-patches-widgets.js`** — 组件增删修补
- **`chapter-patches.js`** — patch 组合入口

这使后续维护时可以更明确地区分：
- 文字问题
- 组件位置问题
- 组件移除问题

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

1. 在合适的 `viz/*.js` 中编写渲染函数并调用 `registerViz('typename', renderFn)`
2. 若组件适合复用，可放入对应 bundle 归属组；若组件只是章节定向插入，可通过 `chapter-patches-widgets.js` 或组件模块内的注入逻辑接入
3. 在对应章节的 `.html` 文件中加入 `<div class="stat-viz" data-type="typename">` 标记，或通过章节 patch / 组件注入逻辑运行时挂载
4. jStat 提供以下可用分布：`normal`, `studentt`, `chisquare`, `centralF`, `binomial`, `poisson`, `beta`, `gamma`

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

```text
GitHub (main) → Vercel → https://r.tweb.one
```

无需 `vercel.json` 配置文件，Vercel 会自动检测为静态站点。

---

## 更新日志

详细更新记录见 [附录页](/data/9999-appendix.html)（站内可折叠查看）。以下是近期重要改动：

### 2026-04-24
- **维护性重构**：将 `app.js` 中的章节定向修补逻辑抽离到 `chapter-patches.js`，并继续细分为 `chapter-patches-text.js` 与 `chapter-patches-widgets.js`
- **可视化入口整理**：`stats-viz.js` 改为通过 bundle 文件分组导入组件模块，降低入口文件复杂度
- **第八章增强**：补入 `baseline-table` 成品示例，并新增 `tablelayoutdemo` 三线表布局演示组件
- **第七章增强**：新增 `rankcorrelation` 与 `curvefit` 两个后半章专属组件，分别对应秩相关和曲线拟合
- **第四章增强**：新增 McNemar 组件，并重做马赛克图与列联表热力图
- **第五章增强**：新增 Cochran-Armitage 趋势检验组件，补足有序率趋势检验的交互层

### 2026-04-28
- **第二十九章增强**：新增 PCA 教学指导组件，优化主成分分析教学交互
- **第二十八章增强**：新增聚类分析教学指导组件
- **第二十七章增强**：新增判别分析教学指导组件

### 2026-04-27
- **第二十六章增强**：优化生存曲线可视化教学组件
- **功能加固**：Cox 风险比森林图组件精度加固
- **第二十五章增强**：优化生存分析教学组件
- **第二十四章增强**：优化分类变量重编码教学组件
- **第二十三章增强**：新增计数模型教学指导组件
- **第二十二章增强**：优化对数线性模型教学组件

### 2026-04-26
- **第二十一章新增**：Logistic 回归教学指导组件
- **修复**：多元回归系数置信区间图表计算错误
- **第二十章增强**：优化多元线性回归教学组件
- **第十九章增强**：优化 Hotelling 统计教学组件

### 2026-04-25
- **第十八章增强**：优化方差分析注意事项教学组件
- **第十七章增强**：新增协方差分析交互可视化
- **第十七章增强**：优化 ANCOVA 教学组件
- **第十六章增强**：优化重复测量方差分析教学组件
- **第十五章增强**：增强 Mauchly 球对称检验章节

### 2026-04-24
- **第十四章增强**：增强析因设计方差分析教学章节
- **第十三章增强**：增强 tidy-flow 统计分析教学章节
- **第十二章增强**：优化 ROC 曲线教学组件
- **第十一章增强**：优化随机分组教学组件
- **第十章增强**：优化样本量计算教学组件

### 2026-04-23
- **第一章（t 检验）计算器增强**：t 检验计算器新增第三 tab「配对 t 检验」，支持等长校验和差值单样本 t 检验；修复因缺少 `parseNumbers` 导入导致的计算器 `ReferenceError`
- **第二章（方差分析）数据修正**：ANOVA 组件 mean/SD 数据修正为经实测验证的正确值（means: 3.4303/2.7153/2.698/1.9663，sds: 0.7151/0.6382/0.4972/0.7464）；删去 2.5 节格式错误的重复 ANOVA 组件
- **第二章正文多处修正**：区组间 F 值 5.798 → 5.978；拉丁方残差 SS "0.0683.2" → 683.2；2.4 导语药物均值描述及 p 值解释修正；变量描述改为正确名称
- **第一章正文修正**：方差齐性表述改为"未见显著证据反对方差相等假设"；1.4 节标题改为「方差齐性检验」
- **Canvas 图表渲染修复**：删除 `.viz-canvas { height: auto }` CSS 覆盖规则，使 canvas 高度生效；马赛克图/热力图 canvas 内部高度与容器协调，修复显示裁剪问题

### 2026-04-22
- **附录页与首页 UI 优化**：精简附录页正文内容，更新日志改为默认折叠，各 section 加左侧彩色竖线；首页学习路线 tab 加切换动画，footer 加分隔线
- **桌面端 topbar 显示**：修复桌面端 Home/主题切换按钮缺失问题，`☰` 菜单键仅在移动端显示
- **进度追踪改进**：学习进度改为计时器判断（停留 30 秒才算完成），重置进度按钮上线，顶部进度条实时更新
- **ES Module 重构**：`chapters.js` 改为 ES Module，`app.js` 通过 import 使用章节数据，减少全局依赖
- **代码复制按钮整理**：Quarto inline handler 全部移出 HTML，改为 class + JS 事件委托
- **固定 jStat 版本**：CDN 从 `@latest` 改为明确版本号，避免上游波动
- **轻量验证基线**：`tests/` 目录含可执行校验脚本，`npm run validate` 即可运行

---

## 致谢

- 教程内容基于阿越《R语言实战医学统计》（https://ayueme.github.io/R_medical_stat/）
- 教材参考孙振球《医学统计学》第5版（颜艳、王彤 主编）
- 统计计算使用 [jStat](https://github.com/jstat/jstat)
