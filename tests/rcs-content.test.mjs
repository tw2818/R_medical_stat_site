import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1040-rcs.html');
const planPath = join(ROOT, 'docs/plans/2026-04-30-chapter43-rcs-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/rcs-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');

function read(path) {
  return readFileSync(path, 'utf8');
}

const expectedGuideTypes = [
  'rcs-workflow-guide',
  'rcs-knot-formula-guide',
  'rcs-nonlinear-guide',
  'rcs-interpretation-guide'
];

test('chapter 43 plan and renderer files exist', () => {
  assert.equal(existsSync(planPath), true, 'plan file should exist');
  assert.equal(existsSync(rendererPath), true, 'rcs-guides.js should exist');
});

test('chapter 43 preserves all 13 code blocks cb1–cb13', () => {
  const html = read(chapterPath);
  for (let i = 1; i <= 13; i++) {
    const id = `cb${i}`;
    const pattern = `id="${id}"`;
    const hasSourceCode = html.includes('class="sourceCode cell-code"') && html.includes(pattern);
    const hasSpan = html.includes(`<span id="${id}-`);
    const hasDiv = html.includes(`<div class="sourceCode" ${pattern}`);
    assert.ok(hasSourceCode || hasSpan || hasDiv, `code block ${id} should exist`);
  }
});

test('chapter 43 has 4 guide widgets', () => {
  const html = read(chapterPath);
  for (const type of expectedGuideTypes) {
    assert.match(
      html,
      new RegExp(`data-type=["']${type}["']`),
      `should have stat-viz placeholder for ${type}`
    );
  }
});

test('chapter 43 renderer module exports required functions', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('const GUIDE_CARDS'), 'should have GUIDE_CARDS');
  assert.ok(renderer.includes('function escapeHtml'), 'should have escapeHtml');
  assert.ok(renderer.includes('function ensureStyles'), 'should have ensureStyles');
  assert.ok(renderer.includes('function renderGuide'), 'should have renderGuide');
});

test('chapter 43 renderer registers all 4 guide types', () => {
  const renderer = read(rendererPath);
  for (const type of expectedGuideTypes) {
    assert.match(
      renderer,
      new RegExp(`registerViz\\(['"]${type}['"]`),
      `should register ${type}`
    );
  }
});

test('chapter 43 renderer escapes user data before innerHTML', () => {
  const renderer = read(rendererPath);
  assert.ok(renderer.includes('escapeHtml('), 'should use escapeHtml for defensive coding');
});

test('chapter 43 module imported in stats-viz.js', () => {
  const statsViz = read(statsVizPath);
  assert.match(statsViz, /import.*rcs-guides/, 'stats-viz.js should import rcs-guides');
});

test('chapter 43 module imported in _bundle-presentation-modules.js', () => {
  const bundle = read(bundlePath);
  assert.match(bundle, /import.*rcs-guides/, 'bundle should import rcs-guides');
});

test('chapter 43 preserves existing splinercs widget', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']splinercs["']/, 'splinercs widget should be preserved');
});

test('chapter 43 preserves key R code patterns from cb5 and cb9', () => {
  const html = read(chapterPath);
  assert.ok(html.includes('lrm('), 'lrm( from cb5 should be preserved');
  assert.ok(html.includes('cph('), 'cph( from cb9 should be preserved');
});