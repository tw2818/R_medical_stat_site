# 第24章“分类变量重编码”教学优化计划

## 目标

在保护第24章原始 R 示例、输出和 Quarto 结构的前提下，为“分类变量重编码”补充统一风格的 `stat-viz` 教学组件，帮助学习者把 `factor → contrast matrix → 设计矩阵列 → 回归系数解释` 串起来，并和第21-23章的 GLM 系数解释形成连续教学线索。

## 审阅结论

- 文件：`data/1019-codescheme.html`
- 标题：分类变量重编码
- 现有 R 代码块：`cb1` 到 `cb20`，需要完整保留。
- 当前无 `stat-viz` / `stat-calc` 占位。
- 章节覆盖：Dummy/simple/deviation/orthogonal polynomial/Helmert/reverse Helmert/forward difference/backward difference。
- 教学难点：同一个分类变量在不同 contrast 矩阵下，模型拟合整体不变，但截距与系数含义改变。

## 与前序章节衔接

- 第21章 Logistic：继续解释哑变量、参考组、非参考组系数；在线性回归中是均值差，在 Logistic 中是 log(OR)，`exp(β)` 才是 OR。
- 第22章 Log-linear：分类变量进入模型后同样被展开为设计矩阵列，交互项本质上也是编码列之间的组合。
- 第23章 Poisson/负二项：GLM 中 contrast 决定“比较谁和谁”，link 函数决定 `β` 所在尺度；Poisson/负二项中常转为 IRR/RR 解读。

## 新增组件设计

新增 `js/viz/codescheme-guides.js`，注册并在正文中引用 6 个组件：

1. `codescheme-factor-workflow`：从 `factor` 到 `contrast matrix` 再到模型系数的总流程。
2. `codescheme-design-matrix`：解释 K 个水平为何生成 K-1 列，以及参考组全 0 的含义。
3. `codescheme-reference-mean-guide`：对比 dummy/simple/deviation 的截距与系数含义。
4. `codescheme-ordinal-polynomial-guide`：解释有序因子的 `.L/.Q/.C` 趋势检验，锚定 `readcat.L = 14.2587`。
5. `codescheme-helmert-difference-guide`：总结 Helmert、reverse Helmert、forward/backward difference 的比较方向。
6. `codescheme-glm-bridge-guide`：将本章编码方案连接到 Logistic、log-linear、Poisson/负二项等 GLM 章节。

组件风格沿用第21-23章：紧凑卡片、低饱和蓝紫色 pill、短说明段落 `⬆ 上方...`，避免大量 callout。

## 文案修正

至少修正以下已审阅问题：

- “组1均数10.2...”与本章 `hsb2` 真实均值不符，改为 `46.45833、58.00000、48.20000、54.05517`。
- `类别1,；` → `类别1；`
- `别编码为为` → `被编码为`
- `类别3倍设为1` → `类别3被设为1`
- `R语言中中` → `R语言中`
- `很强的的线性关系` → `很强的线性关系`
- 第24.8节 `<code>` 标签错位的 `race.f2/race.f3` 文本。
- 第24.8节把“截距”误称为相邻差值，改为“系数”。

## TDD 验收点

新增 `tests/codescheme-content.test.mjs`：

- 保护章节标题和 h2 小节。
- 保护 `cb1` 到 `cb20` 代码块编号和关键 R 代码。
- 保护真实输出锚点：`46.45833`、`58.00000`、`48.20000`、`54.05517`、`14.2587`、`-6.9601`、`11.5417`。
- 检查 6 个新增 `data-type` 出现在 HTML。
- 检查 `codescheme-guides.js` 存在、注册所有新类型，并由 `js/stats-viz.js` 和 `js/viz/_bundle-presentation-modules.js` 导入。
- 检查已发现文案错误不再出现。
- 运行 registry consistency，确保没有未注册或孤立注册组件。

## 验证命令

专项：

```bash
node --test tests/codescheme-content.test.mjs && \
node --check js/viz/codescheme-guides.js && \
node --check js/stats-viz.js && \
node --check js/viz/_bundle-presentation-modules.js
```

全量：

```bash
npm test && \
npm run validate && \
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done && \
node --test tests/viz-registry-consistency.test.mjs && \
git diff --check
```

HTTP smoke：检查 `/`、`/data/1019-codescheme.html`、`/js/stats-viz.js`、`/js/viz/codescheme-guides.js`，结束前确认 8000 端口无残留监听。