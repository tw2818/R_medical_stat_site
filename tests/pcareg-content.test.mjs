import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/pcareg.html');
const rendererPath = join(ROOT, 'js/viz/pcareg-guides.js');
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

// Guide types expected for pcareg teaching optimization
const expectedGuideTypes = [
  'pcreg-workflow-guide',
  'pcreg-pls-tidymodels-guide',
  'pcreg-ncomp-selection-guide',
  'pcreg-coef-interpretation-guide'
];

// Expected code block IDs (cb1-cb13 across 2 sections)
const expectedCodeIds = [];
for (let i = 1; i <= 13; i++) {
  expectedCodeIds.push(`cb${i}`);
}

test('chapter 31 source file and title structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 31 html should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('31 主成分回归'), 'should include chapter 31 title');
  for (const section of [
    '31.1 pls',
    '31.2 tidymodels'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('chapter 31 R code block anchors are preserved (cb1-cb100)', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

test('chapter 31 contains guide placeholders for pcreg teaching cards', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('pcareg guide renderer is registered and imported', () => {
  assert.equal(existsSync(rendererPath), true, 'pcareg guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/pcareg-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/pcareg-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
});

test('pcareg-guides.js module can be imported', async () => {
  const modulePath = join(ROOT, 'js/viz/pcareg-guides.js');
  assert.equal(existsSync(modulePath), true, 'pcareg-guides.js should exist for import');
});