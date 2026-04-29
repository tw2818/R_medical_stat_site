# Chapter 28 聚类分析教学优化计划

## 目标

继续按前面章节的优化风格处理第 28 章 `data/1021-cluster.html`：保留原始 R 代码、输出和章节结构，使用紧凑 `stat-viz` 教学卡片解释聚类分析的关键决策。

## 范围

- 章节：`data/1021-cluster.html`
- 新增 renderer：`js/viz/cluster-guides.js`
- 导入：`js/viz/_bundle-presentation-modules.js`、`js/stats-viz.js`
- 测试：`tests/cluster-content.test.mjs`

## 约束

1. 原始代码块 ID 序列必须保留：`cb1`–`cb4`、`cb7`–`cb17`、`cb20`–`cb27`；不要补造缺失的 `cb5`、`cb6`、`cb18`、`cb19`。
2. 保留既有 `dendrogram` 和两个 `scatter` 组件。
3. 避免大段 callout；新增内容以现代卡片式 `stat-viz` 组件为主，后接短说明段落。
4. 修正明显文案问题：`max.nc` 注释“最大聚类树”→“最大聚类数”；NbClust 层次聚类多数规则结论为 2，但后续选择 5 应解释为教学演示/结合可解释性，而不是直接说 5 最优；PAM 的 medoid 不应类比为主成分。
5. 保留原外部参考链接，但将“推文”表述调整成更适合课程网站的“扩展阅读”。

## 拟新增组件

- `cluster-workflow-guide`：标准化、距离/方法、k 值、评价与解释的完整流程。
- `hclust-distance-linkage-guide`：解释 `scale()`、`dist()` 和 `hclust(method="average")`。
- `cluster-k-decision-guide`：解释 NbClust 多指标投票，区分“多数规则”和“教学/解释性选择”。
- `cluster-method-choice-guide`：交互式选择层次聚类 / K-means / PAM。
- `kmeans-output-guide`：解读 K-means 输出中的 size、centers、withinss、between_SS / total_SS。
- `cluster-silhouette-guide`：解释轮廓系数，作为聚类质量评价的补充。
- `pam-medoid-guide`：解释 medoid 与 centroid 的差别，以及 PAM 对异常值更稳健。

## 验证

```bash
node --test tests/cluster-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
node --test tests/viz-registry-consistency.test.mjs
git diff --check
```
