import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const chapterPath = new URL('data/1019-codescheme.html', root);
const rendererPath = new URL('js/viz/codescheme-guides.js', root);
const statsEntryPath = new URL('js/stats-viz.js', root);
const bundlePath = new URL('js/viz/_bundle-presentation-modules.js', root);
const planPath = new URL('docs/plans/2026-04-28-chapter24-codescheme-teaching-optimization.md', root);

const html = readFileSync(chapterPath, 'utf8');
const plainText = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');
const compactText = plainText
  .replace(/\s*([()$,~=<>+\-*/])\s*/g, '$1')
  .replace(/\s+/g, ' ');

const expectedTypes = [
  'codescheme-factor-workflow',
  'codescheme-design-matrix',
  'codescheme-reference-mean-guide',
  'codescheme-ordinal-polynomial-guide',
  'codescheme-helmert-difference-guide',
  'codescheme-glm-bridge-guide',
];

function readIfExists(url) {
  return existsSync(url) ? readFileSync(url, 'utf8') : '';
}

function getStatTag(type) {
  const pattern = new RegExp(`<div[^>]+class=["'][^"']*stat-viz[^"']*["'][^>]+data-type=["']${type}["'][^>]*>`, 'i');
  return html.match(pattern)?.[0] ?? '';
}

test('chapter 24 source file, plan, title and section structure are preserved', () => {
  assert.ok(existsSync(chapterPath), 'chapter HTML should exist');
  assert.ok(existsSync(planPath), 'chapter 24 plan document should exist');
  assert.ok(plainText.includes('24 分类变量重编码'), 'chapter title should be visible');

  for (const heading of [
    '24.1 演示数据',
    '24.2 Dummy Coding',
    '24.3 simple coding',
    '24.4 Deviation coding',
    '24.5 Orthogonal Polynomial Coding',
    '24.6 Helmert Coding',
    '24.7 Reverse Helmert Coding',
    '24.8 Forward Difference Coding',
    '24.9 Backward Difference Coding',
    '24.10 参考资料',
  ]) {
    assert.ok(plainText.includes(heading), `missing heading: ${heading}`);
  }
});

test('original R code block anchors and core code examples remain intact', () => {
  const ids = Array.from(new Set([...html.matchAll(/id="cb(\d+)"/g)].map((match) => Number(match[1]))));
  assert.deepEqual(ids, Array.from({ length: 20 }, (_, index) => index + 1));

  for (const snippet of [
    'contr.treatment(4)',
    'contrasts(hsb2$race.f)',
    'summary(lm(write~race.f,data=hsb2))',
    'contr.sum(4)',
    'contr.poly(4)',
    'summary(lm(write~readcat,data=hsb2))',
    'contr.helmert(4)',
    'summary(lm(write~race.f,hsb2))',
  ]) {
    assert.ok(compactText.includes(snippet), `missing R snippet: ${snippet}`);
  }
});

test('real output anchors used by the teaching text remain visible', () => {
  for (const value of ['46.45833', '58.00000', '48.20000', '54.05517', '14.2587', '-6.9601', '11.5417', '51.6784']) {
    assert.ok(plainText.includes(value), `missing output anchor: ${value}`);
  }
});

test('chapter 24 uses six registered compact stat-viz teaching components', () => {
  for (const type of expectedTypes) {
    const tag = getStatTag(type);
    assert.ok(tag, `missing stat-viz placeholder for ${type}`);
    assert.match(tag, /data-title=/, `${type} should provide a concise title`);
  }

  assert.ok(plainText.includes('⬆ 上方'), 'each visual guide should be tied back to the prose with short explanatory text');
});

test('codescheme renderer is registered and imported by both runtime entrypoints', () => {
  assert.ok(existsSync(rendererPath), 'codescheme renderer file should exist');
  const renderer = readIfExists(rendererPath);
  const statsEntry = readFileSync(statsEntryPath, 'utf8');
  const bundle = readFileSync(bundlePath, 'utf8');

  assert.match(statsEntry, /import ['"]\.\/viz\/codescheme-guides\.js['"];?/);
  assert.match(bundle, /import ['"]\.\/codescheme-guides\.js['"];?/);

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }

  for (const snippet of [
    'factor → contrast matrix → 设计矩阵',
    'K 个水平通常生成 K-1 列',
    '参考组',
    'dummy / simple / deviation',
    '正交多项式',
    'Helmert',
    'Logistic',
    'Poisson',
  ]) {
    assert.ok(renderer.includes(snippet), `renderer missing teaching phrase: ${snippet}`);
  }
});

test('known prose and concept errors in the generated chapter are corrected', () => {
  for (const stale of [
    '10.2，组2的因变量均数为12.2',
    '类别1,；',
    '别编码为为',
    '类别3倍设为1',
    'R语言中中',
    '的的线性关系',
    '<code>race.f2比较的是类别2和3，</code>race.f3',
    'race.f1的截距是类别2和类别1的因变量差值',
  ]) {
    assert.ok(!html.includes(stale), `stale prose should be removed: ${stale}`);
  }

  assert.ok(plainText.includes('Hispanic、Asian、African-Am、Caucasian四组的真实均数分别为46.45833、58.00000、48.20000、54.05517'));
  assert.ok(html.includes('<code>race.f2</code>比较的是类别2和3，<code>race.f3</code>比较的是类别3和类别4'));
  assert.ok(plainText.includes('race.f1的系数是类别2和类别1的因变量差值'));
});
