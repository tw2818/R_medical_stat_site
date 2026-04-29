import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1023-factoranalysis.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-factoranalysis-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/factoranalysis-guides.js');
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
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// 7 guide types expected for factoranalysis teaching optimization
const expectedGuideTypes = [
  'fa-vs-pca-guide',
  'nfactors-guide',
  'extraction-guide',
  'rotation-guide',
  'loading-interpretation-guide',
  'model-fit-guide',
  'factor-scores-guide'
];

// Expected code block IDs - actual IDs present in the chapter HTML
// Note: cb3, cb5, cb11-cb14 are genuinely absent from the original HTML
const expectedCodeIds = [
  'cb1', 'cb2', 'cb4', 'cb6', 'cb7', 'cb8', 'cb9', 'cb10',
  'cb15', 'cb16', 'cb17', 'cb18', 'cb19', 'cb20', 'cb21', 'cb22'
];

// Key R code patterns that must be preserved
const keyRSnippets = [
  'fa.res<-fa(',  // fa.res <- fa() assignment
  'fa.parallel',   // parallel analysis function
  'factor.plot',  // factor plot function
  'fa.diagram'    // factor diagram function
];

test('chapter 32 source file and plan exist', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 32 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 32 plan should exist');
});

test('section structure 32.1-32.7 preserved', () => {
  const html = read(chapterPath);
  const text = plainText(html);
  assert.ok(text.includes('32 探索性因子分析'), 'should include chapter 32 title');

  for (const section of [
    '32.1',
    '32.2',
    '32.3',
    '32.4',
    '32.5',
    '32.6',
    '32.7'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('original R code block anchors cb1-cb22 remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');

  // Verify key R code patterns are preserved
  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of keyRSnippets) {
    assert.ok(compact.includes(snippet), `missing protected R snippet: ${snippet}`);
  }
});

test('existing factorload interactive component preserved', () => {
  const html = read(chapterPath);

  assert.match(html, /data-type=["']factorload["']/, 'missing factorload data-type');
  assert.match(html, /data-items=/, 'missing data-items attribute');
  assert.match(html, /data-factors=/, 'missing data-factors attribute');
  assert.match(html, /data-loads=/, 'missing data-loads attribute');
});

test('guide placeholders added for all 7 key teaching concepts', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('renderer module exists and exports registerViz', () => {
  assert.equal(existsSync(rendererPath), true, 'factoranalysis-guides.js renderer file should exist');

  const renderer = read(rendererPath);
  assert.match(renderer, /registerViz/, 'renderer should export registerViz');
  assert.match(renderer, /GUIDE_CARDS/, 'renderer should contain GUIDE_CARDS');
  assert.match(renderer, /escapeHtml/, 'renderer should contain escapeHtml helper');
  assert.match(renderer, /ensureStyles/, 'renderer should contain ensureStyles function');
});

test('renderer registers all 7 guide types', () => {
  const renderer = read(rendererPath);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
});

test('renderer is defensive: escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.match(renderer, /escapeHtml\(/, 'renderer should use escapeHtml before innerHTML');
});

test('module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(statsViz, /import.*factoranalysis-guides/, 'stats-viz.js should import factoranalysis-guides');
});

test('module imported in bundle file', () => {
  const bundle = read(bundlePath);
  assert.match(bundle, /import.*factoranalysis-guides/, '_bundle-presentation-modules.js should import factoranalysis-guides');
});