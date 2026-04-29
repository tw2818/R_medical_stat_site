# Chapter 32 (探索性因子分析) Teaching Optimization Plan

**Date**: 2026-04-29
**Chapter**: 32 - 探索性因子分析
**File**: `data/1023-factoranalysis.html`

## Constraints

- Preserve original R code blocks (`<div class="sourceCode">`)
- Preserve code block anchor sequences exactly (cb1–cb22)
- Keep existing interactive component `data-type="factorload"` at line ~1012
- Use `stat-viz`-style compact cards
- Keep text concise
- Escape any `el.dataset.*` value before interpolating into `innerHTML`

## Chapter Structure (7 sections)

| Section | Title | Key Teaching Points |
|---------|-------|---------------------|
| 32.1 | 必要的安装和帮助 | psych, GPArotation packages |
| 32.2 | 主成分与因子分析 | PCA vs FA difference, n_factors selection |
| 32.3 | 因子分析初体验 | First FA, loading matrix interpretation |
| 32.4 | 进行因子分析 | Extraction methods (ml, pa, minres), fit indices |
| 32.5 | 因子旋转 | Rotation methods (varimax, oblimin) |
| 32.6 | 结果可视化 | factorload heatmap, fa.diagram, factor.plot |
| 32.7 | 参考文献 | References |

## Teaching Guide Cards (7 Static Cards)

| ID | Badge | Title | Insert After Section |
|----|-------|-------|---------------------|
| `fa-vs-pca-guide` | FA vs PCA | 因子分析 vs 主成分分析 | 32.2 header |
| `nfactors-guide` | n_factors | 如何确定因子数量 | 32.2 header |
| `extraction-guide` | fm | 因子提取方法 | 32.4 header |
| `rotation-guide` | rotate | 因子旋转方法 | 32.5 header |
| `loading-interpretation-guide` | loadings | 因子载荷矩阵解读 | 32.3 header |
| `model-fit-guide` | fit | 模型拟合指标 | 32.4 header |
| `factor-scores-guide` | scores | 因子得分 | 32.4 header |

## Guide Card Content

### 1. fa-vs-pca-guide
- **Badge**: FA vs PCA
- **Icon**: ⊕
- **Title**: 因子分析 vs 主成分分析
- **Lead**: PCA extracts principal components; FA extracts latent factors. PCA decomposes total variance; FA models shared variance (communality).
- **Steps**:
  - [PCA] 主成分分析分解总方差，第一成分解释最大方差
  - [FA] 因子分析分解共享方差，需要先估计公因子方差(communality)
  - [选择] 需要降维时用PCA，需要探索潜在结构时用FA
- **Note**: PCA是"提取"，FA是"建模"——FA更接近验证性因子分析(CFA)

### 2. nfactors-guide
- **Badge**: n_factors
- **Icon**: K
- **Title**: 如何确定因子数量
- **Lead**: 因子数量没有绝对标准，需要结合多种方法综合判断。
- **Steps**:
  - [Kaiser] 特征值>1的因子（默认方法，但可能高估）
  - [碎石图] 找"拐点"，陡峭下降前的主成分
  - [平行分析] 与随机数据特征值比较
  - [MAP/BIC] 最小平均偏相关/贝叶斯信息准则
- **Note**: 本章多种方法均建议3个因子，最终选择4个以便与原书一致

### 3. extraction-guide
- **Badge**: fm
- **Icon**: ∑
- **Title**: 因子提取方法
- **Lead**: `fm`参数选择提取公共因子的计算方法，不同方法假设不同、结果略有差异。
- **Steps**:
  - [ml] 最大似然法，假设多元正态分布
  - [pa] 主轴迭代法，迭代估计公因子方差
  - [minres] 最小残差法，加权最小二乘（默认）
  - [wls/gls] 加权/广义最小二乘
- **Note**: 不同方法结果通常相似，若结果不稳定需检查数据质量

### 4. rotation-guide
- **Badge**: rotate
- **Icon**: ⟳
- **Title**: 因子旋转方法
- **Lead**: 旋转让因子载荷更易解释，使每个变量在少数因子上有高载荷。
- **Steps**:
  - [none] 不旋转，保持因子正交
  - [varimax] 正交旋转，最大化载荷方差（最常用）
  - [promax] 斜交旋转，允许因子相关
  - [oblimin] 斜交旋转，广义版本
- **Note**: 正交旋转因子间相关系数为0；斜交旋转允许相关，结果解读需同时看载荷和因子相关矩阵

### 5. loading-interpretation-guide
- **Badge**: loadings
- **Icon**: ⊤
- **Title**: 因子载荷矩阵解读
- **Lead**: 载荷矩阵是因子分析的核心输出，每行代表一个变量，每列代表一个因子。
- **Steps**:
  - [loadings] 载荷值，绝对值越大相关性越强（>0.4通常认为显著）
  - [h2] 公因子方差/共性方差，变量被因子解释的比例
  - [u2] 独特性，u2=1-h2，不能被因子解释的比例
  - [complexity] 复杂性，变量在多少个因子上有实质载荷
- **Note**: h2越接近1说明该变量越能被因子结构解释；u2过高可能需要更多因子

### 6. model-fit-guide
- **Badge**: fit
- **Icon**: χ²
- **Title**: 模型拟合指标
- **Lead**: 因子分析也是假设检验，需要评估模型与数据的匹配程度。
- **Steps**:
  - [TLI] >0.9可接受，>0.95优秀（Tucker-Lewis指数）
  - [RMSEA] <0.05良好，<0.08可接受（均方误差近似）
  - [BIC] 越小越好（贝叶斯信息准则）
  - [RMSR] 残差均方根，越小越好
- **Note**: 卡方检验对大样本敏感，大样本时p值总是显著；优先看TLI和RMSEA

### 7. factor-scores-guide
- **Badge**: scores
- **Icon**: →z
- **Title**: 因子得分
- **Lead**: 因子得分是每个样本在各个因子上的标准化得分（均值0，标准差1）。
- **Steps**:
  - [scores] `fa$scores` 获取因子得分矩阵
  - [regression] Thomson回归法（默认），快速但有误差
  - [Bartlett] Bartlett精确得分
  - [Anderson] Anderson修正得分
- **Note**: 因子得分可用于后续分析（回归、聚类等），但会引入测量误差

## Interactive Component Decision

**Decision**: All 7 guide cards are **static** (no sliders/inputs).

**Rationale**:
- Factor analysis is primarily conceptual/terminological
- Key outputs (loading matrices, fit indices) are fixed R outputs
- Number of factors selection involves judgment, not slider manipulation
- The existing `factorload` heatmap component is already interactive

**Exception**: If time permits, consider upgrading `nfactors-guide` to interactive (slider to adjust threshold) in future iteration.

## Implementation Order

1. Create `docs/plans/2026-04-29-factoranalysis-teaching-optimization.md` (this file)
2. Create `tests/factoranalysis-content.test.mjs` (TDD test)
3. Create `js/viz/factoranalysis-guides.js` (guide renderer)
4. Add guide placeholders to `data/1023-factoranalysis.html`
5. Update `js/stats-viz.js` import
6. Update `js/viz/_bundle-presentation-modules.js` import
7. Run `npm test && npm run validate`
8. Commit and push

## Verification

```bash
node --test tests/factoranalysis-content.test.mjs
npm test
npm run validate
for f in js/*.js js/app/*.js js/viz/*.js tests/*.mjs; do node --check "$f" || exit 1; done
```