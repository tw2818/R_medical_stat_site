import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1035-psm.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter35-psm-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/psm-guides.js');
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

// Expected guide types for chapter 35 teaching optimization
const expectedGuideTypes = [
  'psm-concept-guide',
  'psm-balance-metrics-guide',
  'psm-matching-method-guide',
  'psm-cobalt-guide',
  'psm-visualization-guide',
  'psm-imbalance-guide'
];

// Expected code block IDs (cb1-cb27 for chapter 35)
const expectedCodeIds = [];
for (let i = 1; i <= 27; i++) {
  expectedCodeIds.push(`cb${i}`);
}

// Test 1: chapter source file and plan exist
test('chapter 35 source file and plan exist', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 35 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 35 plan file should exist');
});

// Test 2: section structure 38.1-38.8 preserved
test('chapter 35 section structure 38.1-38.8 preserved', () => {
  const text = plainText(read(chapterPath));
  assert.ok(text.includes('38.1'), 'should include section 38.1');
  assert.ok(text.includes('38.2'), 'should include section 38.2');
  assert.ok(text.includes('38.3'), 'should include section 38.3');
  assert.ok(text.includes('38.4'), 'should include section 38.4');
  assert.ok(text.includes('38.5'), 'should include section 38.5');
  assert.ok(text.includes('38.6'), 'should include section 38.6');
  assert.ok(text.includes('38.7'), 'should include section 38.7');
  assert.ok(text.includes('38.8'), 'should include section 38.8');
});

// Test 3: original R code block anchors cb1-cb27 remain intact
test('chapter 35 R code block anchors cb1-cb27 remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

// Test 4: key R code patterns matchit, CreateTableOne, cobalt, bal.tab, match.data remain intact
test('chapter 35 key R code patterns matchit, CreateTableOne, cobalt, bal.tab, match.data remain intact', () => {
  const html = read(chapterPath);
  assert.ok(html.includes('matchit'), 'matchit() code pattern should be preserved');
  assert.ok(html.includes('CreateTableOne'), 'CreateTableOne() code pattern should be preserved');
  assert.ok(html.includes('cobalt'), 'cobalt() code pattern should be preserved');
  assert.ok(html.includes('bal.tab'), 'bal.tab() code pattern should be preserved');
  assert.ok(html.includes('match.data'), 'match.data() code pattern should be preserved');
});

// Test 5: existing psdist interactive component preserved
test('chapter 35 existing psdist interactive component preserved', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']psdist["']/, 'psdist interactive component should exist');
});

// Test 6: guide placeholders added for all 6 key teaching concepts
test('chapter 35 guide placeholders added for all 6 key teaching concepts', () => {
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
test('chapter 35 renderer module exists and exports registerViz', () => {
  assert.equal(existsSync(rendererPath), true, 'psm-guides.js renderer file should exist');
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('registerViz'), 'renderer should export registerViz');
  assert.ok(renderer.includes('GUIDE_CARDS'), 'renderer should export GUIDE_CARDS');
  assert.ok(renderer.includes('escapeHtml'), 'renderer should export escapeHtml');
  assert.ok(renderer.includes('ensureStyles'), 'renderer should export ensureStyles');
});

// Test 8: renderer registers all 6 guide types
test('chapter 35 renderer registers all 6 guide types', () => {
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
test('chapter 35 renderer is defensive: escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('escapeHtml('), 'renderer should use escapeHtml for defensive coding');
});

// Test 10: module imported in stats-viz.js
test('chapter 35 module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(
    statsViz,
    /import.*psm-guides/,
    'stats-viz.js should import psm-guides'
  );
});

// Test 11: module imported in bundle file
test('chapter 35 module imported in bundle file', () => {
  const bundle = read(bundlePath);
  assert.match(
    bundle,
    /import.*psm-guides/,
    '_bundle-presentation-modules.js should import psm-guides'
  );
});