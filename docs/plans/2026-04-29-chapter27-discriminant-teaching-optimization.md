# Chapter 27 判别分析教学优化计划

## 目标

继续按前 26 章的优化风格处理第 27 章 `data/1020-discriminant.html`：保留原始 R 代码、输出和章节结构，减少大段 callout，使用紧凑 `stat-viz` 教学卡片解释判别分析的关键读法。

## 范围

- 章节：`data/1020-discriminant.html`
- 新增 renderer：`js/viz/discriminant-guides.js`
- 导入：`js/viz/_bundle-presentation-modules.js`、`js/stats-viz.js`
- 测试：`tests/discriminant-content.test.mjs`

## 约束

1. 原始代码块 `cb1`–`cb16` 必须完整保留且不重排。
2. 现有 `lda`、`ldascatter` 组件保留；新增组件围绕 R 输出解释，不替代原始示例。
3. 修正文案中的概念错误：Fisher/LDA 本身不是“使用贝叶斯定理确定概率”；后验概率来自 `predict()` 的分类阶段。
4. 修正例 20-1 分组说明：早期 12 例，晚期 10 例。
5. 组件风格沿用现代教学卡片：浅灰外卡、白色内卡、圆角、轻阴影、蓝紫/青色标签。

## 拟新增组件

- `discriminant-workflow-guide`：判别分析工作流。
- `lda-output-guide`：解读 `lda()` 输出：先验概率、组均值、判别系数、trace / `k-1`。
- `lda-confusion-guide`：基于例 20-1 混淆矩阵解释准确率、错分和类别方向。
- `lda-newdata-posterior-guide`：解释 `predict(fit, newdata=...)` 的 class/posterior/x 三部分。
- `qda-vs-lda-guide`：交互选择 LDA/QDA/朴素 Bayes 适用场景。
- `naivebayes-condist-guide`：用例 20-4 的 `$tables` 均值/标准差解释条件分布。
- `bayes-warning-guide`：解释 Numerical 0 probability warning。

## 验证

```bash
node --test tests/discriminant-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
git diff --check
```
