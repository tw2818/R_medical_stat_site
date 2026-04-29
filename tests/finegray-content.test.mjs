import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1034-finegray.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter37-finegray-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/finegray-guides.js');
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

// Expected guide types for chapter 37 teaching optimization
const expectedGuideTypes = [
  'finegray-concept-guide',
  'finegray-cif-guide',
  'finegray-fg-test-guide',
  'finegray-crr-guide',
  'finegray-competing-event-guide'
];

// Expected code block IDs (cb1-cb8 for chapter 37)
const expectedCodeIds = [];
for (let i = 1; i <= 8; i++) {
  expectedCodeIds.push(`cb${i}`);
}

// Test 1: chapter source file and plan exist
test('chapter 37 source file and plan exist', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 37 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 37 plan file should exist');
});

// Test 2: section structure 37.1-37.3 preserved
test('chapter 37 section structure 37.1-37.3 preserved', () => {
  const text = plainText(read(chapterPath));
  assert.ok(text.includes('37.1'), 'should include section 37.1');
  assert.ok(text.includes('37.2'), 'should include section 37.2');
  assert.ok(text.includes('37.3'), 'should include section 37.3');
});

// Test 3: original R code block anchors cb1-cb8 remain intact
test('chapter 37 R code block anchors cb1-cb8 remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

// Test 4: key R code patterns cuminc, crr remain intact
test('chapter 37 key R code patterns cuminc, crr remain intact', () => {
  const html = read(chapterPath);
  assert.ok(html.includes('cuminc'), 'cuminc() code pattern should be preserved');
  assert.ok(html.includes('crr'), 'crr() code pattern should be preserved');
});

// Test 5: existing survcomp interactive component preserved
test('chapter 37 existing survcomp interactive component preserved', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']survcomp["']/, 'survcomp interactive component should exist');
});

// Test 6: guide placeholders added for all 5 key teaching concepts
test('chapter 37 guide placeholders added for all 5 key teaching concepts', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(
      html,
      new RegExp(`data-type=["']${type}["']`),
      `missing stat-viz placeholder for ${type}`
    );
  }
});

// Test 7: renderer module exists and exports registerViz
test('chapter 37 renderer module exists and exports registerViz', () => {
  assert.equal(existsSync(rendererPath), true, 'finegray-guides.js renderer file should exist');
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('registerViz'), 'renderer should export registerViz');
  assert.ok(renderer.includes('GUIDE_CARDS'), 'renderer should export GUIDE_CARDS');
  assert.ok(renderer.includes('escapeHtml'), 'renderer should export escapeHtml');
  assert.ok(renderer.includes('ensureStyles'), 'renderer should export ensureStyles');
});

// Test 8: renderer registers all 5 guide types
test('chapter 37 renderer registers all 5 guide types', () => {
  const renderer = read(rendererPath);

  for (const type of expectedGuideTypes) {
    assert.match(
      renderer,
      new RegExp(`registerViz\\(['"]${type}['"]`),
      `renderer should register ${type}`
    );
  }
});

// Test 9: renderer is defensive: escapes user data before innerHTML
test('chapter 37 renderer is defensive: escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('escapeHtml('), 'renderer should use escapeHtml for defensive coding');
});

// Test 10: module imported in stats-viz.js
test('chapter 37 module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(
    statsViz,
    /import.*finegray-guides/,
    'stats-viz.js should import finegray-guides'
  );
});

// Test 11: module imported in bundle file
test('chapter 37 module imported in bundle file', () => {
  const bundle = read(bundlePath);
  assert.match(
    bundle,
    /import.*finegray-guides/,
    '_bundle-presentation-modules.js should import finegray-guides'
  );
});

test('chapter 37 HTML list structure and numbering are clean', () => {
  const html = read(chapterPath);
  const plan = read(planPath);
  const renderer = read(rendererPath);

  assert.doesNotMatch(html, /<\/ul>\s*<div class="stat-viz" data-type="finegray-competing-event-guide"[\s\S]*?<li><code>Source<\/code>/, 'guide should not split the variable <ul> list');
  assert.doesNotMatch(html, /<li><code>Source<\/code>[\s\S]*?<\/ul>\s*<\/ul>/, 'variable list should not have a duplicated closing </ul>');
  assert.match(plan, /Chapter 37/);
  assert.doesNotMatch(plan, /Chapter 34|chapter34/);
  assert.doesNotMatch(renderer, /永远不会发生/);
});

test('chapter 37 Fine-Gray guide text is statistically calibrated to chapter output', () => {
  const renderer = read(rendererPath);
  const html = read(chapterPath);
  const plan = read(planPath);

  for (const value of ['2.8623325', '0.09067592', '0.50322531', '1.514', '0.00052', '1.198', '1.91']) {
    assert.ok(renderer.includes(value) || html.includes(value), `expected chapter-backed value ${value}`);
  }
  assert.match(renderer, /第1行检验 ALL 与 AML 的累计复发率差异/);
  assert.match(renderer, /第2行检验累计竞争风险事件发生率差异/);
  assert.doesNotMatch(renderer, /控制竞争风险后/);
  assert.doesNotMatch(renderer, /第1行控制第2行/);
  assert.doesNotMatch(plan, /1 - CIF = 调整后的生存概率/);
});

test('chapter 37 renderer escapes all interpolated card text', () => {
  const renderer = read(rendererPath);
  for (const marker of ['escapeHtml(cfg.icon)', 'escapeHtml(cfg.badge)', 'escapeHtml(cfg.lead)', 'escapeHtml(cfg.note)', 'escapeHtml(stepTitle)', 'escapeHtml(text)']) {
    assert.ok(renderer.includes(marker), `renderer should escape ${marker}`);
  }
});
