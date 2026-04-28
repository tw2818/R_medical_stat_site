# 第23章：泊松回归和负二项回归教学优化计划

## 目标

在不改动原始 R 示例、输出代码块与 Quarto 章节结构的前提下，为 `data/poisson.html` 增加与第22章对数线性模型连贯衔接的教学组件，帮助读者理解：Poisson/log 连接如何从“列联表频数”过渡到“事件率/计数结局”，以及什么时候需要 quasi-Poisson 或负二项回归。

## 关键衔接

- 第22章：`glm(..., family = poisson())` 用于列联表格子频数，重点是 log(μ) 与交互项。
- 第23章：`glm(..., family = poisson(), offset = log(N))` 用于人年/暴露量不同的事件率，重点是 offset、IRR/RR、过度离散。
- 后续章节：计数结局模型选择、分类变量重编码和回归解释继续复用“系数取指数”的思路。

## 保留约束

- 保留现有 R 示例和代码块锚点 `cb1`–`cb12`。
- 不重排章节结构，不改原始 R 代码输出。
- 组件使用统一 `stat-viz` 卡片风格，短说明用 `⬆ 上方...`，避免大段 callout。
- 真实统计量必须来自相邻 R 输出；概念层级图必须标注“教学示意”。

## 新增/替换组件

1. 将首页旧 `data-type="poisson"` 替换为已有更现代的 `data-type="poissondistfixed"`，保留 λ=3.5。
2. `poisson-glm-connection`：连接第22章 log-linear 与第23章 Poisson rate regression。
3. `poisson-offset-guide`：解释 `offset = log(N)` 与人年/观察单位数，说明为何建模的是 rate。
4. `poisson-irr-guide`：解释 `exp(β)` = IRR/RR，并使用 `X1有暴露` 的真实 RR=2.249864、95%CI=1.772661–2.850500。
5. `poisson-overdispersion-guide`：用残差偏差 P=0.019、Pearson P=0.021、dispersion ratio=3.231 解释过度离散。
6. `poisson-model-choice-guide`：说明 Poisson、quasi-Poisson、负二项的选择路径；引用 quasi-Poisson dispersion=3.23081、AIC=NA。
7. 复用已有 `negativebinomialguide`，在负二项简介处解释 Var(X)>E(X)。
8. `poisson-nb-result-guide`：解释 `glm.nb()` 输出中的 theta=0.3003、AIC=426.23、城市 vs 农村 RR≈0.141 / 农村 vs 城市 RR≈7.08。

## 顺手修正内容错误

- 修正 50–59 岁和 ≥70 岁 95%CI 中误用 `<sub>` 造成的区间显示错误。
- `negativebinomialregression` 改为 `negative binomial regression`。
- MASS `glm.nb()` 的 theta 解释：不是“theta 接近 1 表明接近 Poisson”；在常见 NB2 参数化下 theta 越大越接近 Poisson，theta=0.3003提示明显过度离散。

## 测试策略

新增 `tests/poisson-content.test.mjs`：

- 锁定代码块锚点 `cb1`–`cb12` 和章节标题。
- 锁定旧 `data-type="poisson"` 被替换为 `poissondistfixed`。
- 锁定新增 `poisson-*` 组件、`negativebinomialguide`、短说明段落与导入注册。
- 锁定真实统计量：RR/CI、残差偏差 P、Pearson P、dispersion ratio、quasi-Poisson dispersion、theta、AIC。
- 锁定错误文案被修正。

## 验证命令

```bash
node --test tests/poisson-content.test.mjs
node --check js/viz/poisson-guides.js
node --check js/stats-viz.js
node --check js/viz/_bundle-presentation-modules.js
node --test tests/viz-registry-consistency.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
git diff --check
```
