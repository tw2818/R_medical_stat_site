import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1021-cluster.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter28-cluster-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/cluster-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');

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
  'cluster-workflow-guide',
  'hclust-distance-linkage-guide',
  'cluster-k-decision-guide',
  'cluster-method-choice-guide',
  'kmeans-output-guide',
  'cluster-silhouette-guide',
  'pam-medoid-guide'
];

const expectedCodeIds = [
  'cb1', 'cb2', 'cb3', 'cb4',
  'cb7', 'cb8', 'cb9', 'cb10', 'cb11', 'cb12', 'cb13', 'cb14', 'cb15',
  'cb16', 'cb17', 'cb20', 'cb21', 'cb22', 'cb23', 'cb24', 'cb25', 'cb26', 'cb27'
];

test('chapter 28 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 28 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 28 plan should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('28 聚类分析'));
  for (const section of [
    '28.1 系统聚类（层次聚类,Hierarchical clustering）',
    '28.2 聚类分析可视化',
    '28.3 快速聚类（划分聚类,partitioning clustering）',
    '28.3.1 K-means聚类',
    '28.3.2 围绕中心点的划分PAM'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('original cluster-analysis R code block anchors remain intact including intentional gaps', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');

  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of [
    'data(nutrient,package="flexclust")',
    'nutrient.scaled<-scale(nutrient)',
    'h.clust<-hclust(dist(nutrient.scaled,method="euclidean"),',
    'NbClust(nutrient.scaled,distance="euclidean",',
    'cluster<-cutree(h.clust,k=5)',
    'data(wine,package="rattle")',
    'nc<-NbClust(df,min.nc=2,max.nc=15,method="kmeans")',
    'fit.km<-kmeans(df,centers=3,nstart=25)',
    'fviz_cluster(fit.km,data=df)',
    'fit.pam<-pam(wine[-1,],k=3',
    'clusplot(fit.pam,main="PAMcluster")'
  ]) {
    assert.ok(compact.includes(snippet), `missing protected R snippet: ${snippet}`);
  }
});

test('chapter 28 keeps existing visualizations and adds cluster teaching components', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']dendrogram["']/, 'existing dendrogram widget should remain');
  assert.equal((html.match(/data-type=["']scatter["']/g) || []).length, 2, 'existing two scatter widgets should remain');

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('cluster guide renderer is registered, imported, interactive and defensive', () => {
  assert.equal(existsSync(rendererPath), true, 'cluster guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/cluster-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/cluster-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /addEventListener\(['"]change['"]/, 'method selector should update interactively');
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known cluster-analysis prose issues are corrected', () => {
  const text = plainText(read(chapterPath));
  assert.equal(text.includes('最大聚类树'), false, 'max.nc annotation should say cluster number, not tree');
  assert.ok(text.includes('max.nc = 10 表示最多考察 10 个聚类数'));
  assert.equal(text.includes('从条形图中可以看出，聚类数目为2,3,5,10时，评判准则个数最多，为5个，这里我们可以选择5个。'), false);
  assert.ok(text.includes('多数规则给出的是 2 类；本章后续将树切成 5 类，是为了演示如何用 cutree() 和 rect.hclust() 展示更细的营养成分分组'));
  assert.equal(text.includes('有点类似于主成分'), false, 'PAM medoid should not be compared to PCA');
  assert.ok(text.includes('Medoid 是簇中真实存在、到同簇其他观测总体距离最小的代表点'));
  assert.equal(text.includes('之前推文'), false, 'course-site wording should replace old social-media wording');
  assert.ok(text.includes('扩展阅读'));
});
