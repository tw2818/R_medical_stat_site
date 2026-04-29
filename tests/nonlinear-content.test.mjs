import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1039-nonlinear.html');
const planPath = join(ROOT, 'docs/plans/2026-04-29-chapter42-nonlinear-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/nonlinear-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');

function read(path) {
  return readFileSync(path, 'utf8');
}

const expectedGuideTypes = [
  'nonlinear-workflow-guide',
  'nonlinear-poly-formula-guide',
  'nonlinear-degree-guide',
  'nonlinear-poly-glm-guide'
];

test('chapter 42 plan and renderer files exist', () => {
  assert.equal(existsSync(planPath), true, 'plan file should exist');
  assert.equal(existsSync(rendererPath), true, 'nonlinear-guides.js should exist');
});

test('chapter 42 preserves all 11 code blocks cb1–cb11', () => {
  const html = read(chapterPath);
  for (let i = 1; i <= 11; i++) {
    const id = `cb${i}`;
    const pattern = `id="${id}"`;
    const hasSourceCode = html.includes('class="sourceCode cell-code"') && html.includes(pattern);
    const hasSpan = html.includes(`<span id="${id}-`);
    const hasDiv = html.includes(`<div class="sourceCode" ${pattern}`);
    assert.ok(hasSourceCode || hasSpan || hasDiv, `code block ${id} should exist`);
  }
});

test('chapter 42 has 4 guide widgets', () => {
  const html = read(chapterPath);
  for (const type of expectedGuideTypes) {
    assert.match(
      html,
      new RegExp(`data-type=["']${type}["']`),
      `should have stat-viz placeholder for ${type}`
    );
  }
});

test('chapter 42 renderer module exports required functions', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('const GUIDE_CARDS'), 'should have GUIDE_CARDS');
  assert.ok(renderer.includes('function escapeHtml'), 'should have escapeHtml');
  assert.ok(renderer.includes('function ensureStyles'), 'should have ensureStyles');
  assert.ok(renderer.includes('function renderGuide'), 'should have renderGuide');
});

test('chapter 42 renderer registers all 4 guide types', () => {
  const renderer = read(rendererPath);
  for (const type of expectedGuideTypes) {
    assert.match(
      renderer,
      new RegExp(`registerViz\\(['"]${type}['"]`),
      `should register ${type}`
    );
  }
});

test('chapter 42 renderer escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('escapeHtml('), 'should use escapeHtml for defensive coding');
});

test('chapter 42 module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(statsViz, /import.*nonlinear-guides/, 'stats-viz.js should import nonlinear-guides');
});

test('chapter 42 module imported in _bundle-presentation-modules.js', () => {
  const bundle = read(bundlePath);
  assert.match(bundle, /import.*nonlinear-guides/, 'bundle should import nonlinear-guides');
});

test('chapter 42 preserves existing dose widget', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']dose["']/, 'dose widget should be preserved');
});

test('chapter 42 preserves key R code patterns from cb4 and cb6', () => {
  const html = read(chapterPath);
  assert.ok(html.includes('I(year^2)'), 'I(year^2) from cb4 should be preserved');
  assert.ok(html.includes('anova</span>'), 'anova() comparison from cb6 should be preserved');
});
