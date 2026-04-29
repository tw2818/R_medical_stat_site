import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1020-discriminant.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter27-discriminant-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/discriminant-guides.js');
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
  'discriminant-workflow-guide',
  'lda-output-guide',
  'lda-confusion-guide',
  'lda-newdata-posterior-guide',
  'qda-vs-lda-guide',
  'naivebayes-condist-guide',
  'bayes-warning-guide'
];

const expectedCodeIds = Array.from({ length: 16 }, (_, index) => `cb${index + 1}`);

test('chapter 27 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 27 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 27 plan should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('27 判别分析'));
  assert.ok(text.includes('27.1 Fisher判别分析'));
  assert.ok(text.includes('27.2 Bayes判别分析'));
});

test('original discriminant-analysis R code block anchors remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');

  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of [
    'read.csv("datasets/例20-1.csv")',
    'fit<-lda(y~x1+x2+x3,data=df)',
    'table(df$y,pred)',
    'predict(fit,newdata=tmp)',
    'fit<-lda(Species~Sepal.Length+Sepal.Width+Petal.Length+Petal.Width,data=iris)',
    'fit<-qda(y~x1+x2+x3,data=df)',
    'fit<-NaiveBayes(y~.,data=df)',
    'table(pred,df$y)'
  ]) {
    assert.ok(compact.includes(snippet), `missing protected R snippet: ${snippet}`);
  }
});

test('chapter 27 keeps existing LDA visualizations and adds discriminant teaching components', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']lda["']/, 'existing LDA widget should remain');
  assert.match(html, /data-type=["']ldascatter["']/, 'existing LDA scatter widget should remain');

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('discriminant guide renderer is registered, imported, interactive and defensive', () => {
  assert.equal(existsSync(rendererPath), true, 'discriminant guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/discriminant-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/discriminant-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /addEventListener\(['"]change['"]/, 'scenario selector should update interactively');
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known discriminant-analysis prose issues are corrected', () => {
  const text = plainText(read(chapterPath));
  assert.equal(text.includes('Fisher判别使用贝叶斯定理确定每个观测属于某个类别的概率'), false);
  assert.ok(text.includes('Fisher 判别的核心是寻找能最大化组间差异、最小化组内差异的线性组合'));
  assert.ok(text.includes('早期患者（用1表示）12例，晚期患者（用2表示）10例'));
  assert.ok(text.includes('k 个类别最多得到 k-1 个判别函数'));
  assert.ok(text.includes('后验概率来自 predict() 阶段的分类计算'));
  assert.ok(text.includes('Numerical 0 probability for all classes'));
});
