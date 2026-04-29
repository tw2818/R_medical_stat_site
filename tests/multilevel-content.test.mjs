import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/multilevel.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter35-multilevel-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/multilevel-guides.js');
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
  'multilevel-workflow-guide',
  'multilevel-icc-guide',
  'multilevel-random-intercept-guide',
  'multilevel-random-slope-guide',
  'multilevel-crosslevel-interaction-guide',
  'multilevel-model-comparison-guide'
];

// cb1-cb20, contiguous sequence
const expectedCodeIds = [];
for (let i = 1; i <= 20; i++) {
  expectedCodeIds.push(`cb${i}`);
}

test('chapter 35 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 35 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 35 plan should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('35 多水平模型'));
  for (const section of [
    '35.1 理论知识',
    '35.2 数据探索',
    '35.3 空模型',
    '35.4 添加1级水平的固定效应',
    '35.5 添加2级水平的固定效应',
    '35.6 具有随机斜率的MLM',
    '35.7 具有交互效应的MLM',
    '35.8 重复测量数据的MLM',
    '35.9 广义混合效应模型',
    '35.10 参考资料'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('original multilevel R code block anchors remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((m) => m[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

test('chapter 35 adds multilevel teaching guide components', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('multilevel guide renderer is registered, imported, and defensive', () => {
  assert.equal(existsSync(rendererPath), true, 'multilevel guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/multilevel-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/multilevel-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known multilevel prose is preserved and uses course-site wording', () => {
  const text = plainText(read(chapterPath));
  // The chapter recommends 冯国双's articles - should be preserved
  assert.ok(text.includes('冯国双'));
  // ICC value should be present
  assert.ok(text.includes('0.138') || text.includes('13.8'));
});