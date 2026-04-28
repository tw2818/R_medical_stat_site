# 第22章：多维列联表的对数线性模型教学优化计划

## 目标

在不改动原始 R 示例、输出代码块与 Quarto 章节结构的前提下，为 `data/loglinear.html` 增加与第21章 Logistic 回归连贯衔接的教学组件，帮助读者从 `glm(..., family = binomial())` 自然过渡到列联表频数的 `glm(..., family = poisson())` / `loglm()` / `loglin()` 思路。

## 关键衔接

- 第21章：二分类结局，`binomial()` + logit 连接，重点解释 OR、分层/混杂、逐步筛选。
- 第22章：列联表格子频数，Poisson/log 连接，重点解释理论频数、无因变量/自变量之分、交互项、层次模型与拟合优度。
- 第23章：继续把 Poisson/log 连接用于率和计数结局，并引出过度离散与负二项模型。

## 保留约束

- 保留现有 `chisq` 组件，继续使用合并 2×2 表 `20,373,6,316`。
- 保留代码块锚点的实际序列：`cb1`–`cb19` 与 `cb21`，不新建或重编号 `cb20`。
- 不触碰原始 R 代码与输出块，仅插入 `stat-viz` 教学组件和短说明。
- 所有真实数值必须来自相邻 R 输出；教学示意必须显式标注“教学示意”。

## 新增组件

1. `loglinear-glm-connection`：在引言后连接第21章 Logistic 与本章 log-linear，再提示第23章 Poisson/负二项。
2. `loglinear-marginal-stratified-demo`：用例17-1真实数据展示合并表显著、分层表不显著，强调分层/混杂与二维以上列联表不能简单合并。
3. `loglinear-formula-guide`：解释 `log(μ)=β0+主效应+交互项`，突出“交互项 = 变量关联”。
4. `loglinear-fit-test-guide`：解释 G² 与 Pearson X² 的拟合优度检验，使用 2×2 性别×血压输出 `G²=49.84297`、`Pearson=50.04632`、`df=1`、P 值约 `1.5e-12`。
5. `loglinear-or-bridge-guide`：衔接第21章 OR：Poisson GLM 中交互项 `-0.5820837` 可转为 `OR=0.5587329`。
6. `loglinear-model-hierarchy-guide`：解释三维列联表中饱和模型、完全独立模型、条件/联合独立与 AIC 逐步筛选，使用最终模型 `Likelihood Ratio=0.09702652`、`P=0.9526447`。

## 顺手修正的内容错误

- `chisq.test` 对性别×血压结果 P=`1.502e-12`，应解释为“性别和血压不独立/有关联”，不是“独立”。
- 三维模型比较最终结果输出 P=`0.9526447`，原文 `P值=0.095` 应修正为 `P值=0.953`。
- 引言中 `generalized linea rmodel` 修正为 `generalized linear model`。

## 测试策略

新增 `tests/loglinear-content.test.mjs`：

- 锁定计划文件存在并包含关键衔接词。
- 锁定章节标题、h2 小节、代码块锚点实际序列与现有 `chisq` 组件。
- 锁定 6 个新增 `loglinear-*` 组件、短说明、入口导入与注册器。
- 锁定真实数据和关键统计量：合并/分层 2×2 表、G²、Pearson、df、P、OR、三维最终模型。
- 锁定错误文案已修正，且组件中“教学示意”只用于概念层级图，不混淆为真实输出。

## 验证命令

```bash
node --test tests/loglinear-content.test.mjs
node --check js/viz/loglinear-guides.js
node --check js/stats-viz.js
node --check js/viz/_bundle-presentation-modules.js
node --test tests/viz-registry-consistency.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
git diff --check
```
