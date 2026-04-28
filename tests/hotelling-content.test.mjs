import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const chapterPath = new URL('../data/hotelling.html', import.meta.url);
const statsVizPath = new URL('../js/stats-viz.js', import.meta.url);
const bundlePath = new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url);
const rendererPath = new URL('../js/viz/hotelling-guides.js', import.meta.url);

const html = readFileSync(chapterPath, 'utf8');

const expectedTypes = [
  'hotelling-vector-matrix-guide',
  'hotelling-t2-decision-guide',
  'hotelling-manova-stat-guide',
  'hotelling-univar-multivar-demo',
  'hotelling-repeated-vector-guide',
  'hotelling-profile-guide',
];

test('chapter 19 preserves all original R examples with unique code-block anchors', () => {
  const ids = [...html.matchAll(/<div class="sourceCode cell-code" id="cb(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 34 }, (_, i) => i + 1));
  assert.equal(new Set(ids).size, 34);
});

test('chapter 19 keeps existing scatter visualization and adds compact Hotelling teaching widgets', () => {
  assert.match(html, /data-type="scatter"/);
  assert.match(html, /血脂三项相关分析/);
  assert.match(html, /data-regression="true"/);

  for (const type of expectedTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 19`);
  }

  assert.match(html, /多变量方向|均值向量|协方差矩阵|轮廓分析/);
});

test('Hotelling guide renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  const bundle = readFileSync(bundlePath, 'utf8');
  const statsViz = readFileSync(statsVizPath, 'utf8');
  assert.match(bundle, /\.\/hotelling-guides\.js/);
  assert.match(statsViz, /\.\/viz\/hotelling-guides\.js/);
});

test('Hotelling guide renderer registers static guides and the interaction demo', () => {
  assert.equal(existsSync(rendererPath), true, 'renderer module should exist before checking registrations');
  const renderer = readFileSync(rendererPath, 'utf8');

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(renderer, /input type="range"/);
  assert.match(renderer, /addEventListener\('input'/);
  assert.match(renderer, /Hotelling|MANOVA|Wilks|Pillai|平行检验|相合检验|水平检验/);
});
