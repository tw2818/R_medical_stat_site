# 第14章「多因素方差分析」教学优化计划

## 目标

在保留原始 16 个 R 示例和输出的前提下，把第14章从“多个设计类型的代码集合”增强为结构清晰的教学章节：读者能区分析因、正交、嵌套、裂区设计，并理解 R 公式中 `*`、`:`、`/`、`Error()` 的含义。

## 约束

- 保留 `data/1003-dysanova.html` 原始代码块 `cb1`–`cb16`。
- 不重写 Quarto 结构，不改 R 输出。
- 使用统一 `stat-viz` 卡片风格 + 简短说明，避免新增大段 Quarto callout。
- 优先静态教学卡；交互不是本章重点。

## 审阅发现

1. 现有 `interaction` 卡片的 `data-means` 与 `cb1` 原始数据不一致，需改为实际单元格均值。
2. 现有 `anova` 渲染器只接受 JSON 数组，但章节 HTML 使用逗号分隔字符串，导致组件渲染为“请提供组数据”。
3. `anova` 渲染器缺少 `ensureJStat()` 可见降级提示。
4. 14.3–14.6 缺少设计结构示意卡，尤其是三因素、正交、嵌套、裂区设计。
5. 公式语义未显式总结：`a*b*c`、`a:b`、`factor1/factor2`、`Error(id/factorB)`。

## 实施方案

1. 修复 `js/viz/hypothesis-remaining.js`：
   - `renderANOVA()` 支持逗号分隔和 JSON 数组两种属性格式。
   - 增加 `ensureJStat(el)` guard。
   - 导出轻量纯函数用于测试：`parseNumericAttribute()`、`calculateAnovaSummary()`。
   - 给 `renderFactorialInteraction()` 增加数据解析兜底，避免 malformed `data-means` 直接抛错。
2. 新增 `js/viz/factorial-design-guides.js`：
   - `factorial-formula-guide`：三因素公式与结果阅读。
   - `orthogonal-design-guide`：L8 正交表/不完全析因设计示意。
   - `nested-design-guide`：一级因素与二级因素嵌套结构。
   - `split-plot-guide`：整区/裂区与两层误差项。
3. 在第14章插入 4 个轻量 stat-viz 卡片，并修改 2×2 交互图数据为真实均值。
4. 添加测试：
   - `tests/factorial-anova-content.test.mjs`：内容、组件、代码块、bundle 加载。
   - `tests/anova-renderer.test.mjs`：逗号分隔解析、ANOVA F 值、jStat guard/解析路径源码约束。

## 验证

- `node --test tests/factorial-anova-content.test.mjs tests/anova-renderer.test.mjs`
- `npm test`
- `npm run validate`
- JS syntax check
- registry duplicate/unregistered script
- 本地 HTTP marker 检查
