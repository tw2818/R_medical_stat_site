# 第21章 Logistic 回归教学组件优化计划

## 目标

在不改动原始 R 示例、输出代码块顺序和章节锚点的前提下，为 `data/1018-logistic.html` 增加紧凑、统一风格的 Logistic 回归教学组件，重点帮助读者理解：logit 与概率的转换、哑变量参考组、系数/OR/置信区间、预测概率与阈值、逐步回归 AIC、多项/有序/条件 Logistic 的阅读方式。

## 约束

- 保留 `cb1`–`cb33` 代码块顺序与原始输出。
- 保留 `21.1`–`21.5` 章节结构。
- 新增组件使用独立 `logistic-*` 类型，避免覆盖通用组件。
- 只加入服务教学的交互：概率 ↔ odds/OR 转换、阈值权衡等；避免为了炫技而增加复杂交互。
- 所有演示性数据必须明确标注“教学演示/示意”，不能伪装为真实模型结果。
- 修正现有 Logistic OR 森林图数组长度不一致问题，并优先采用正文 `cb4` 已输出的真实 OR 与 95% CI。

## 拟新增组件

1. `logistic-equation-explainer`：logit、odds、概率的关系。
2. `logistic-dummy-guide`：因子变量展开、参考组与参数名（如 `x12`、`x13`）。
3. `logistic-or-ci-guide`：β、OR、95% CI 与 P 值如何对应阅读。
4. `logistic-probability-threshold-demo`：预测概率阈值改变时敏感度/特异度的教学演示。
5. `logistic-stepwise-guide`：逐步回归中 AIC、Deviance 与变量保留的关系。
6. `logistic-ordinal-parallel-guide`：有序 Logistic 的平行线假设与 Brant 检验。

## 测试优先策略

新增 `tests/logistic-content.test.mjs`，先运行确认 RED：

- 检查代码块锚点仍为 `cb1`–`cb33`，无重复。
- 检查章节标题 `21.1`–`21.5` 保留。
- 检查新增 `logistic-*` 组件存在。
- 检查 `js/viz/logistic-guides.js` 存在、注册组件，并被 `js/stats-viz.js` 与 `js/viz/_bundle-presentation-modules.js` 导入。
- 检查 OR 森林图 `data-labels`/`data-values`/`data-lower`/`data-upper` 长度一致，并锁定关键真实数值：`x61 OR=50.4345`、95% CI `3.7775–2159.5535`；`x81 OR=11.7426`、95% CI `1.6662–148.0207`。
- 检查 ROC AUC 在 `[0,1]`，校准曲线数组长度一致，风险概率均在 `[0,1]`。
- 检查示例/示意组件带有“教学演示/示意”说明，避免误导。

## 验证命令

```bash
node --test tests/logistic-content.test.mjs
node --test tests/viz-registry-consistency.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
git diff --check
git status --short --branch
```
