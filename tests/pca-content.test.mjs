import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1022-pca.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter29-pca-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/pca-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');
const existingPcaRendererPath = join(ROOT, 'js/viz/hypothesis-remaining.js');

function read(path) {
  return readFileSync(path, 'utf8');
}

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const expectedGuideTypes = [
  'pca-workflow-guide',
  'pca-standardization-guide',
  'pca-kmo-bartlett-guide',
  'pca-loading-formula-guide',
  'pca-loadings-scores-guide',
  'pca-variance-decision-guide',
  'pca-component-choice-guide',
  'pca-pitfalls-guide'
];

const expectedCodeIds = [
  'cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8',
  'cb9', 'cb10', 'cb11', 'cb12', 'cb13', 'cb14', 'cb15', 'cb16'
];

test('chapter 29 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 29 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 29 plan should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('29 主成分分析'));
  for (const section of [
    '29.1 加载数据',
    '29.2 相关性检验',
    '29.3 KMO和Bartlett球形检验',
    '29.4 PCA和结果解读',
    '29.5 默认的结果可视化',
    '29.6 确定最佳主成分个数'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('original PCA R code block anchors and representative outputs remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');

  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of [
    'str(iris)',
    'psych::headTail(iris)',
    'cor(iris[,-5])',
    'psych::KMO(iris[,-5])',
    'OverallMSA=0.54',
    'psych::cortest.bartlett(iris[,-5])',
    'performance::check_factorstructure(iris[,-5])',
    'pca.res<-prcomp(iris[,-5],scale.=T,',
    'pca.res$rotation',
    'Sepal.Length0.5210659-0.377417620.71956640.2612863',
    'pca.res$sdev^2',
    'head(pca.res$x)',
    'summary(pca.res)',
    'biplot(pca.res)',
    'screeplot(pca.res,type="lines")',
    'parameters::n_components(iris[,-5])',
    'plot(n)+theme_modern()'
  ]) {
    assert.ok(compact.includes(snippet), `missing protected R snippet/output: ${snippet}`);
  }
});

test('chapter 29 keeps existing PCA scree widgets and adds guide placeholders', () => {
  const html = read(chapterPath);
  assert.equal((html.match(/data-type=["']pca["']/g) || []).length, 2, 'existing two PCA scree widgets should remain');
  assert.match(html, /data-title=["']PCA Scree Plot["']/);
  assert.match(html, /data-title=["']PCA 碎石图：主成分方差贡献["']/);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('PCA guide renderer is registered, imported, interactive and defensive', () => {
  assert.equal(existsSync(rendererPath), true, 'PCA guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);
  const existingPcaRenderer = read(existingPcaRendererPath);

  assert.match(existingPcaRenderer, /registerViz\(['"]pca['"],\s*renderScreePlot\)/, 'existing pca scree renderer must remain');
  assert.match(statsViz, /import ['"]\.\/viz\/pca-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/pca-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /addEventListener\(['"]change['"]/, 'component-choice selector should update interactively');
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known PCA prose issues are corrected and key interpretation caveats are present', () => {
  const text = plainText(read(chapterPath));
  assert.equal(text.includes('但是在机器学习中它更多的是作为一种预处理步骤'), false, 'repetitive machine-learning phrasing should be removed');
  assert.ok(text.includes('在机器学习领域通常也作为数据降维或预处理步骤使用'));
  assert.equal(text.includes('Bartlett球形检验与KMO检验类似，也是帮助我们确定变量之间是否具有足够的相关性'), false);
  assert.ok(text.includes('Bartlett 检验的原假设是相关矩阵等于单位阵'));
  assert.ok(text.includes('center = TRUE 先把每个变量的均值移到 0'));
  assert.ok(text.includes('scale. = TRUE 再把标准差统一为 1'));
  assert.ok(text.includes('PC1=0.5210659'));
  assert.ok(text.includes('0.5804131'));
  assert.ok(text.includes('0.5648565'));
  assert.ok(text.includes('$rotation 的某一列就是该主成分的线性组合系数'));
  assert.ok(text.includes('$rotation 说明主成分是什么，$x 说明每个样本落在哪里'));
  assert.ok(text.includes('第二主成分是在去掉第一主成分所能解释的方差之后'));
  assert.ok(text.includes('PCA 是无监督方法'));
  assert.ok(text.includes('主成分方向的正负号可以整体翻转'));
});
