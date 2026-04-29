# Chapter 34 Fine-Gray检验和竞争风险模型 Teaching Optimization Plan

## Context
- Chapter 34 in R_medical_stat_site
- File: `data/1034-finegray.html`
- Topic: Fine-Gray检验和竞争风险模型 (Fine-Gray test and Competing Risk Models)

## Constraints
- Preserve all original R code blocks (cb1-cb8)
- Do not reorganize generated HTML
- Keep existing widgets (`survcomp`)
- Use `stat-viz` class for placeholders

## Current State
- Code blocks: cb1-cb8 (8 contiguous blocks)
- Existing widget: `survcomp` at line 557
- Sections: 37.1 (加载数据和R包), 37.2 (Fine-Gray检验单因素分析), 37.3 (竞争风险模型多因素分析)

## Teaching Components to Add

### 1. `finegray-concept-guide`
Concept: 竞争风险模型的基本概念
- 竞争风险事件定义
- 累计发生函数 (CIF) vs 生存函数 S(t)
- 应用场景：多终点生存数据

### 2. `finegray-cif-guide`
Concept: 累计发生函数 CIF 解读
- CIF 的计算方法
- 与 Kaplan-Meier 的区别
- 1 - CIF = 调整后的生存概率

### 3. `finegray-fg-test-guide`
Concept: Fine-Gray检验 vs log-rank 检验
- Fine-Gray 是竞争风险版本的 log-rank
- subdistribution hazard 概念
- 结果解读：P 值和累计发生率

### 4. `finegray-crr-guide`
Concept: 竞争风险回归 crr() 结果解读
- `failcode=1` 表示感兴趣事件
- `cencode=0` 表示删失
- `exp(coef)` = SHR (subdistribution hazard ratio)
- 各变量的显著性判断

### 5. `finegray-competing-event-guide`
Concept: 竞争事件与删失的区别
- 删失：不知何时发生，但最终会发生
- 竞争事件：阻止感兴趣事件发生
- Fine-Gray 对两类事件处理不同

## Files to Modify
1. `docs/plans/2026-04-29-chapter34-finegray-teaching-optimization.md` (create)
2. `tests/finegray-content.test.mjs` (create)
3. `js/viz/finegray-guides.js` (create)
4. `data/1034-finegray.html` (add 5 placeholders)
5. `js/stats-viz.js` (add import)
6. `js/viz/_bundle-presentation-modules.js` (add import)

## Verification
- `npm test` must pass
- `npm run validate` must pass
- All code blocks cb1-cb8 preserved