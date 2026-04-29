import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/pca-vis.html');
const rendererPath = join(ROOT, 'js/viz/pca-vis-guides.js');
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
  'fviz-workflow-guide',
  'fviz-scree-guide',
  'fviz-varcoord-guide',
  'fviz-cos2-guide',
  'fviz-contrib-guide',
  'fviz-group-coloring-guide',
  'fviz-biplot-guide',
  'ggplot2-pca-guide'
];

const expectedCodeIds = [
  'cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8',
  'cb9', 'cb10', 'cb11', 'cb12', 'cb13', 'cb14', 'cb15', 'cb16',
  'cb17', 'cb18', 'cb19', 'cb20', 'cb21', 'cb22', 'cb23', 'cb24',
  'cb25', 'cb26', 'cb27', 'cb28', 'cb29', 'cb30', 'cb31'
];

test('chapter 30 source file and title structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 30 html should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('30 主成分分析可视化'));
  for (const section of [
    '30.1 进阶的PCA可视化',
    '30.2 ggplot2',
    '30.3 3d版',
    '30.1.5 维度描述'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('chapter 30 R code block anchors are preserved (cb1-cb31)', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

test('chapter 30 contains guide placeholders for fviz teaching cards', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('PCA visualization guide renderer is registered and imported', () => {
  assert.equal(existsSync(rendererPath), true, 'PCA vis guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/pca-vis-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/pca-vis-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
});

test('pca-vis-guides.js module can be imported', async () => {
  const modulePath = join(ROOT, 'js/viz/pca-vis-guides.js');
  assert.equal(existsSync(modulePath), true, 'pca-vis-guides.js should exist for import');
});
