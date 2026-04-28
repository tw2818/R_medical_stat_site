# 第15章「球对称检验」教学优化计划

## 目标

在保留原始 R 示例和输出的前提下，把第15章从“mauchly.test 用法说明”增强为重复测量 ANOVA 前置判断的教学章节：读者能看懂 Mauchly W、p 值、ε 校正，并知道什么时候报告 Greenhouse-Geisser / Huynh-Feldt 校正结果。

## 约束

- 保留原始代码示例和输出内容，不改统计结果。
- 修复重复代码块 ID，避免锚点冲突。
- 使用统一 `stat-viz` 教学卡片 + 简短说明，避免增加大段 callout。
- 优先静态解释卡；交互不是本章重点。

## 审阅发现

1. 章节现有 0 个 `stat-viz` / `stat-calc` 组件，但非常适合加入决策流程卡。
2. 第二节文字写“这个数据有2组”，但 `str()` 输出显示 group 有 A/B/C 三组，应修正为 3 组。
3. 第二节读取数据代码块重复使用 `id="cb4"`，导致锚点冲突；修复后应为 `cb1`–`cb9`。
4. 章节文字描述了轮廓图趋势，但页面没有相应可视化组件。
5. 两个例子的 Mauchly/ε 结果没有横向对照，学习者不容易形成“p<0.05 → 看 ε → 选校正”的流程。

## 实施方案

1. 新增 `js/viz/repeated-measures-guides.js`，注册：
   - `mauchly-profile-guide`：单组 4 时间点血糖趋势卡。
   - `sphericity-decision-guide`：Mauchly W / p / ε 的判断流程。
   - `epsilon-correction-guide`：GG/HF 校正选择规则。
   - `mauchly-result-summary`：两个例子的结果对照表。
2. 在第15章插入 4 个 `stat-viz` 占位：
   - 15.1 轮廓图描述之后。
   - 第一次 Mauchly 检验结果之后。
   - 15.1 结论之后。
   - 15.2 ε 结果之后。
3. 修复第二节“2组”→“3组”。
4. 修复重复代码块 ID：第二节起始读取数据块及后续代码块顺延为 `cb5`–`cb9`。
5. 添加 `tests/mauchly-content.test.mjs`：验证组件、代码块 ID 唯一、关键教学点、bundle 加载。

## 验证

- `node --test tests/mauchly-content.test.mjs`
- `npm test`
- `npm run validate`
- JS syntax check
- registry duplicate/unregistered script
- 本地 HTTP marker 检查
