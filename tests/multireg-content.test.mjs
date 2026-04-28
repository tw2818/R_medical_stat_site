import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const chapterPath = new URL('../data/1017-multireg.html', import.meta.url);
const statsVizPath = new URL('../js/stats-viz.js', import.meta.url);
const bundlePath = new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url);
const rendererPath = new URL('../js/viz/multireg-guides.js', import.meta.url);

const html = readFileSync(chapterPath, 'utf8');

const expectedCodeIds = [
  ...Array.from({ length: 17 }, (_, i) => i + 1),
  ...Array.from({ length: 13 }, (_, i) => i + 19),
];

const expectedTypes = [
  'multireg-formula-guide',
  'multireg-coef-guide',
  'multireg-metrics-guide',
  'multireg-diagnostics-guide',
  'multireg-vif-demo',
  'multireg-selection-guide',
];

test('chapter 20 preserves generated R example anchors including the cb18 gap', () => {
  const ids = [...html.matchAll(/<div class="sourceCode cell-code" id="cb(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, expectedCodeIds);
  assert.equal(new Set(ids).size, expectedCodeIds.length);
  assert.equal(ids.includes(18), false);
});

test('chapter 20 keeps existing regression visualizations and adds compact teaching widgets', () => {
  assert.match(html, /data-type="coefci"/);
  assert.match(html, /data-type="scatter"/);
  assert.match(html, /data-regression="true"/);

  for (const type of expectedTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 20`);
  }

  assert.match(html, /R\<sup\>2\<\/sup\>|AIC|BIC|RMSE|VIF|逐步/);
});

test('multireg guide renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  const bundle = readFileSync(bundlePath, 'utf8');
  const statsViz = readFileSync(statsVizPath, 'utf8');
  assert.match(bundle, /\.\/multireg-guides\.js/);
  assert.match(statsViz, /\.\/viz\/multireg-guides\.js/);
});

test('multireg guide renderer registers static guides and the VIF interaction demo', () => {
  assert.equal(existsSync(rendererPath), true, 'renderer module should exist before checking registrations');
  const renderer = readFileSync(rendererPath, 'utf8');

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(renderer, /input type="range"/);
  assert.match(renderer, /addEventListener\('input'/);
  assert.match(renderer, /VIF|方差膨胀因子|共线性|标准误|AIC|BIC|RMSE/);
});
