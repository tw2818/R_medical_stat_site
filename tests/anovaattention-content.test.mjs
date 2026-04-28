import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const chapterPath = join(root, 'data', '1010-anovaattention.html');
const modulePath = join(root, 'js', 'viz', 'anova-attention-guides.js');
const bundlePath = join(root, 'js', 'viz', '_bundle-presentation-modules.js');
const entryPath = join(root, 'js', 'stats-viz.js');

const html = readFileSync(chapterPath, 'utf8');

function codeBlockIds(source) {
  return [...source.matchAll(/id="cb(\d+)"/g)].map((m) => Number(m[1]));
}

test('chapter 18 keeps original generated code block anchors', () => {
  assert.deepEqual(codeBlockIds(html), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.match(html, /data-type="anova"/);
});

test('chapter 18 adds compact ANOVA attention teaching widgets', () => {
  const requiredTypes = [
    'anova-type-guide',
    'anova-balance-guide',
    'anova-formula-order-guide',
    'anova-type-result-demo',
    'anova-block-ancova-guide',
    'anova-variable-type-decision-demo',
  ];

  for (const type of requiredTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 18`);
  }

  assert.match(html, /类型Ⅰ|Type I/);
  assert.match(html, /类型Ⅱ|Type II/);
  assert.match(html, /类型Ⅲ|Type III/);
  assert.match(html, /均衡设计/);
  assert.match(html, /非均衡设计/);
  assert.match(html, /协变量/);
  assert.match(html, /效应的顺序|顺序/);
  assert.match(html, /随机区组/);
});

test('ANOVA attention renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  assert.ok(existsSync(modulePath), 'js/viz/anova-attention-guides.js should exist');

  const bundle = readFileSync(bundlePath, 'utf8');
  const entry = readFileSync(entryPath, 'utf8');
  assert.match(bundle, /\.\/anova-attention-guides\.js/);
  assert.match(entry, /\.\/viz\/anova-attention-guides\.js/);
});

test('ANOVA attention renderer registers guide and interaction types', () => {
  assert.ok(existsSync(modulePath), 'renderer module should exist before checking registrations');
  const source = readFileSync(modulePath, 'utf8');

  for (const type of [
    'anova-type-guide',
    'anova-balance-guide',
    'anova-formula-order-guide',
    'anova-type-result-demo',
    'anova-block-ancova-guide',
    'anova-variable-type-decision-demo',
  ]) {
    assert.match(source, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(source, /input type="range"/);
  assert.match(source, /addEventListener\('input'/);
  assert.match(source, /顺序平方和|Type I|类型Ⅰ/);
  assert.match(source, /变量类型|连续变量|分类变量/);
});
