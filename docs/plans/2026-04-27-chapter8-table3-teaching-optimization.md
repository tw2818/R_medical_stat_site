# 第八章（三线表绘制）系统优化计划

## 目标

在保留 `data/table3.html` 原有例题和 R 代码块的前提下，根据前几章近期优化风格，系统提升第八章的教学性与交互可视化贴合度。

## 约束

- 不删除、不改写原有 R 代码块内容。
- 不删除原有例题与输出结果。
- 不做大规模架构迁移。
- 优先使用现有组件与静态 HTML 增补；只在必要时修复 registry/test 问题。

## 发现

1. 第八章为 `data/table3.html`，id 为 `table3`，标题为“三线表绘制”。
2. 当前已有 `baseline-table` 可视化，且与 Table 1 教学主题贴合。
3. 开篇直接进入 R 包介绍，缺少“三线表/SCI Table 1/变量类型/描述统计/P 值”的教学铺垫。
4. `npm test` 在 pull 后已有基线失败：`mcnemarguide` 重复注册，以及若干 fix 组件注册未被测试识别为引用。

## 修改范围

- `data/table3.html`：增加教学说明、提示框和小结，不触碰原有代码块。
- `tests/table3-content.test.mjs`：增加内容回归测试，确保教学补充存在且代码块数量未减少。
- 必要时修复 `js/viz/*.js` 中 registry 重复/孤立注册导致的测试失败。

## 实施步骤

1. 先添加 table3 内容测试，确认 RED。
2. 在 `data/table3.html` 增加以下教学块：
   - 开篇“三线表/Table 1 学习目标”说明。
   - 包选择速查表：compareGroups、tableone、gtsummary/gt 的适用场景。
   - 变量类型与描述统计选择速查表。
   - `compareGroups()` / `createTable()` / `export2xxx()` 工作流解释。
   - `method`、`alpha`、`min.dis` 参数的教学解释。
   - `p.overall` / `p.ratio` 解读提示。
   - 章末实操检查清单。
3. 保留并继续使用 `baseline-table`，在其前后增加解释；不新增复杂 widget，避免与 Table 1 输出主题重复。
4. 修复 pull 后已有 registry 测试失败。
5. 运行完整验证：
   - `npm test`
   - `npm run validate`
   - `node --check` 全部 JS
   - registry 一致性脚本
