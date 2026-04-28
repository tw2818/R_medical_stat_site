# 第25章《生存分析》教学优化计划

## 范围

文件：`data/1032-survival.html`  
章节：25 生存分析

本轮只做内容教学增强、现有组件修正和轻量交互补充，不重排 Quarto 生成结构，不改原始 R 代码块。

## 保护约束

- 保留原有 h2/h3 结构：25.1 生存过程描述、25.2 生存过程比较、25.3 Cox 回归、25.4 时间依存协变量/系数、25.5 参考资料。
- 保留 `cb1`–`cb30` 共 30 个代码块锚点。
- 保留现有有效组件：`km`、`cox`、`survcomp`、`scatter`。
- 新增组件使用统一 `stat-viz` + `registerViz` 机制，不能用孤立全局脚本。
- 新增教学块保持短卡片/轻交互风格，避免大段 callout。

## 审阅发现

1. 开头直接说“不涉及理论”，但生存分析对删失、风险集、KM、PH 假设等概念依赖强，需要补短卡片降低误读。
2. `Surv(time,status)`、删失 `+`、寿命表、KM 曲线之间缺少一张流程卡。
3. `survcomp` 组件 HTML 传入了 `data-times1/status1/times2/status2`，但现有 renderer 使用随机模拟曲线，导致每次结果不稳定且与正文输出脱节。
4. Cox 回归段没有充分承接第21章 Logistic、第24章分类变量编码，HR/OR 的区别可用卡片说明。
5. 正文 `Concordance= 0.645` 与实际输出 `Concordance= 0.637` 不一致。
6. PH 假设段的 `cox.zph` 输出已经给出 `ph.karno p=0.0046`、`GLOBAL p=0.0157`，适合做诊断流程卡。
7. 时间依存协变量 vs 时间依存系数容易混淆，且 `survSplit(cut=c(90,180))` 很适合用一个小交互解释分段起止时间。

## 组件设计与交互必要性

### 新增静态组件

- `survival-censor-riskset-guide`：解释生存时间、事件、删失、风险集，以及 `+` 的含义。
- `survival-km-logrank-guide`：连接 `survfit()`、寿命表、KM 曲线、logrank 检验中的 observed/expected。
- `survival-cox-hr-bridge-guide`：对比 Logistic OR 与 Cox HR，并说明分类变量仍沿用第24章 model matrix/contrast 思路。
- `survival-ph-diagnostic-guide`：解释 Schoenfeld 残差、`cox.zph`、GLOBAL 检验和处理分支。

### 新增交互组件

- `survival-logrank-oe-demo`：用滑块改变两组 observed 与 expected 偏离程度，展示卡方统计量随偏离增大而增大。必要性：logrank 的 O-E 与 (O-E)^2/V 抽象，用轻交互比静态文字更直观。
- `survival-time-split-demo`：用滑块改变切点，展示一个受试者记录如何被 `survSplit()` 切成 `(tstart, time]` 多行。必要性：时间分层/时依协变量的长数据结构是本章难点，交互能避免把 `tstart/time/tgroup` 只当作普通表格列。

## 现有组件修正

- 修正 `renderSurvivalComp()`：优先读取 `data-times1/status1/times2/status2` 与 `data-label1/label2`，没有数据时才回退示例数据；移除随机曲线导致的不可重复性。
- 保留 `km`、`cox`、`scatter` 的现有行为，本轮不重写大型画布组件。

## 测试计划

新增 `tests/survival-content.test.mjs`：

1. 章节文件/计划/标题/小节结构存在。
2. `cb1`–`cb30` 代码块保护。
3. 现有 4 个组件仍存在。
4. 新增 6 个 `survival-*` 组件占位存在，其中 2 个必须是交互组件。
5. 新 renderer 文件在 `stats-viz.js` 和 presentation bundle 中导入，并注册 6 个 data-type；交互 renderer 包含 `input type="range"` 与 `addEventListener('input'`。
6. 修正已知错误：`Concordance= 0.645` 不应再出现，应使用 `Concordance= 0.637`；`经过变换后的的PH检验`、`Coefcients` 等明显错字应修正。
7. `survival.js` 的 `survcomp` renderer 应读取 `data-times1/status1/times2/status2`，不能再依赖随机模拟曲线。

## 验收

- 先运行专项测试并确认 RED。
- 实现后专项测试通过。
- 全量 `npm test`、`npm run validate`、全部 JS/test `node --check`、registry consistency、`git diff --check` 通过。
- HTTP smoke：确认 `/`、`/data/1032-survival.html`、`/js/stats-viz.js`、`/js/viz/survival-guides.js` 可访问，结束后清理 8000 端口。
