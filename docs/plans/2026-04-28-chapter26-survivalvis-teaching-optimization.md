# Chapter 26 生存曲线可视化教学优化计划

## 范围

- 目标文件：`data/1033-survivalvis.html`
- 章节：第26章「生存曲线可视化」
- 现有组件：`km`
- 保护对象：原始 R 示例、输出图片/输出块、代码块锚点 `cb1`–`cb25`、`cb28`–`cb33`，不补齐缺失的 `cb26`/`cb27`。

## 审阅结论

本章以 `survminer::ggsurvplot()` 系列函数为主，代码示例丰富，但教学 scaffolding 偏弱：

1. 开头函数清单只有函数名，缺少“什么时候用”的快速导览。
2. `lung` 数据和 `colon` 数据的 `status` 编码不同，容易让读者误以为生存分析状态编码固定不变。
3. `risk.table`、`ncensor.plot`、`fun="event"/"cumhaz"`、`facet.by`、`group.by`、`add.all`、`ggsurvplot_combine()` 等参数很多，但缺少参数到图层/场景的映射。
4. 标题 `增加删失时间表ncensor plot` 和 `超级无敌精细化自定设置` 不够规范。
5. 多处“推文”引用脱离当前课程站点语境，且没有实际链接。
6. 多处 `geom_segment()` warning 是原始输出的一部分，不应删除，但应补充说明其含义，避免读者误判为代码失败。

## 是否需要交互组件

需要。第26章是“可视化读图与参数选择”章节，仅靠静态截图容易让读者记住参数名但不理解图层含义。新增组件应服务于读图和场景选择，而不是重复绘制所有 R 输出。

拟新增 6 个统一 `stat-viz` 教学组件：

1. `survivalvis-anatomy-guide`：静态图层卡片，解释主曲线、CI、删失点、中位生存线、p 值、risk table、ncensor plot。
2. `survivalvis-risk-table-demo`：交互式时间点读图，滑块切换时间点，展示“at risk / events / censored”如何影响后续曲线。
3. `survivalvis-parameter-map-guide`：静态参数地图，把 `conf.int`、`risk.table`、`ncensor.plot`、`fun`、`palette`、`facet.by` 等映射到用途。
4. `survivalvis-grouping-guide`：交互式场景选择器，选择“多组曲线/分面/按组拆图/多模型列表/合并曲线”并显示推荐函数。
5. `survivalvis-combine-guide`：静态卡片，区分 `ggsurvplot_list()`、`ggsurvplot_group_by()`、`ggsurvplot_add_all()`、`ggsurvplot_combine()`。
6. `survivalvis-warning-guide`：静态说明卡，解释本章保留的 `geom_segment()` warning 多来自图层 annotation 数据长度提示，不等于主要生存曲线失败。

## 实施策略

- 新增 renderer：`js/viz/survivalvis-guides.js`
- 在两个入口导入：
  - `js/stats-viz.js`
  - `js/viz/_bundle-presentation-modules.js`
- Renderer 遵循现有 compact teaching card 风格：浅灰外卡、白色内卡、低饱和蓝/青色标签、简短文字。
- 所有 `data-title` 等进入 `innerHTML` 的字段先 `escapeHtml()`。
- 交互组件至少包含 `input[type="range"]` 或 `select`，并通过 `addEventListener('input'/'change')` 更新内容。

## 测试计划

新增 `tests/survivalvis-content.test.mjs`，先确认 RED，再实现：

- 章节文件、计划文件、标题和 h2 结构存在。
- 原始代码块锚点序列保持为 `cb1`–`cb25`、`cb28`–`cb33`。
- 现有 `km` 组件保留。
- 6 个新增 `survivalvis-*` 组件 placeholder 存在。
- renderer 存在、注册全部新增 `data-type`、被两个入口导入、包含交互事件与 escaping。
- 修正文案问题：删除 `超级无敌`，规范 `ncensor plot` 标题，补充 status 编码差异说明，移除无链接“推文”语境，保留 warning 但解释其含义。

## 验证命令

```bash
node --test tests/survivalvis-content.test.mjs
node --check js/viz/survivalvis-guides.js
node --test tests/viz-registry-consistency.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" >/dev/null || exit 1; done
git diff --check
```

HTTP smoke：启动 `python3 -m http.server 8000`，检查 `/`、`/data/1033-survivalvis.html`、`/js/stats-viz.js`、`/js/viz/_bundle-presentation-modules.js`、`/js/viz/survivalvis-guides.js`，结束后确认 `ss -ltnp 'sport = :8000'` 无监听。
