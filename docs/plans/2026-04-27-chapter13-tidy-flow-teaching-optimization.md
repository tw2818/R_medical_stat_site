# 第13章「tidy流统计分析」教学优化计划

## 目标

在不改动原始 R 示例和输出的前提下，把第13章从“代码流水账”增强为与前几章一致的卡片式教学章节：读者先理解 tidy/rstatix 的批量检验思路，再看代码，最后能判断什么时候不能机械使用 t 检验。

## 约束

- 保留 `data/1014-batchttest.html` 的原始 5 个代码块：`cb1`–`cb5`。
- 不重排 Quarto 生成结构，不改 R 输出。
- 避免大量 Quarto callout；使用统一的 `stat-viz` 风格教学卡片 + 简短说明。
- 交互只服务教学；本章优先用静态流程卡、检查表和结果解读卡。

## 发现的问题

1. 现有组件只有 `normtest`，不能覆盖“宽表→长表→批量检验→解释结果”的主线。
2. Q-Q 图展示的是「生活质量」实验组，该变量反而最接近正态；容易削弱“批量检查假设”的教学重点。
3. 批量 t 检验没有提示多重检验风险。
4. Shapiro / Levene / t_test 三张输出表之间缺少串联解释。

## 实施方案

1. 新增 `js/viz/tidy-flow-guides.js`，注册三个轻量教学组件：
   - `tidy-flow-workflow`：宽表 → pivot_longer → group_by → shapiro/levene/t_test → 解释。
   - `tidy-flow-assumption-guide`：正态性、方差齐性、变量尺度、备选方法。
   - `tidy-flow-result-guide`：把本章 4 个变量的 Shapiro、Levene、t 检验和注意事项合并成一张读数卡。
2. 在 `_bundle-presentation-modules.js` 与 `stats-viz.js` 中加载新模块。
3. 在 `data/1014-batchttest.html` 中插入 3 个 `stat-viz` 占位和短说明：
   - 简介后：工作流卡。
   - 宽表说明前后：数据格式卡。
   - 结果末尾：结果解读/多重检验提示卡。
4. 保留 `normtest`，但改标题与说明，使其明确为“生活质量示例”，避免误导。
5. 添加 `tests/tidy-flow-content.test.mjs`：
   - 验证 `cb1`–`cb5` 保留。
   - 验证新组件存在。
   - 验证未引入重型 callout marker。
   - 验证模块被 presentation bundle 和入口加载。

## 验证

- `node --test tests/tidy-flow-content.test.mjs`
- `npm test`
- `npm run validate`
- `node --check` changed JS / tests
- registry duplicate/unregistered script
