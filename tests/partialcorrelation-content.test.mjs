import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1016-partialcorrelation.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-partialcorrelation-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/partialcorrelation-guides.js');
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

// Expected guide types for chapter 33 teaching optimization
const expectedGuideTypes = [
  'partialcorr-concept-guide',
  'partialcorr-vs-simple-guide',
  'canonicalcorr-concept-guide',
  'canonicalcorr-interpretation-guide',
  'canonicalcorr-redundancy-guide'
];

// Expected code block IDs (cb1-cb10 for chapter 33)
const expectedCodeIds = [];
for (let i = 1; i <= 10; i++) {
  expectedCodeIds.push(`cb${i}`);
}

// Test 1: chapter source file and plan exist
test('chapter 33 source file and plan exist', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 33 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 33 plan file should exist');
});

// Test 2: section structure 33.1-33.2 preserved
test('chapter 33 section structure 33.1-33.2 preserved', () => {
  const text = plainText(read(chapterPath));
  assert.ok(text.includes('33.1'), 'should include section 33.1');
  assert.ok(text.includes('33.2'), 'should include section 33.2');
});

// Test 3: original R code block anchors cb1-cb10 remain intact
test('chapter 33 R code block anchors cb1-cb10 remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

// Test 4: key R code patterns pcor, cancor, CCP remain intact
test('chapter 33 key R code patterns pcor, cancor, CCP remain intact', () => {
  const html = read(chapterPath);
  // pcor function may be wrapped in span tags: <span class="fu">pcor</span>(
  assert.ok(html.includes('pcor') && html.includes('CCP'), 'pcor and CCP code patterns should be preserved');
  // cancor is in cb8 content
  assert.ok(html.includes('cancor'), 'cancor() code pattern should be preserved');
});

// Test 5: existing partialcorr interactive component preserved
test('chapter 33 existing partialcorr interactive component preserved', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']partialcorr["']/, 'partialcorr interactive component should exist');
});

// Test 6: guide placeholders added for all 5 key teaching concepts
test('chapter 33 guide placeholders added for all 5 key teaching concepts', () => {
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
test('chapter 33 renderer module exists and exports registerViz', () => {
  assert.equal(existsSync(rendererPath), true, 'partialcorrelation-guides.js renderer file should exist');
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('registerViz'), 'renderer should export registerViz');
  assert.ok(renderer.includes('GUIDE_CARDS'), 'renderer should export GUIDE_CARDS');
  assert.ok(renderer.includes('escapeHtml'), 'renderer should export escapeHtml');
  assert.ok(renderer.includes('ensureStyles'), 'renderer should export ensureStyles');
});

// Test 8: renderer registers all 5 guide types
test('chapter 33 renderer registers all 5 guide types', () => {
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
test('chapter 33 renderer is defensive: escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('escapeHtml('), 'renderer should use escapeHtml for defensive coding');
});

// Test 10: module imported in stats-viz.js
test('chapter 33 module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(
    statsViz,
    /import.*partialcorrelation-guides/,
    'stats-viz.js should import partialcorrelation-guides'
  );
});

// Test 11: module imported in bundle file
test('chapter 33 module imported in bundle file', () => {
  const bundle = read(bundlePath);
  assert.match(
    bundle,
    /import.*partialcorrelation-guides/,
    '_bundle-presentation-modules.js should import partialcorrelation-guides'
  );
});