import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1003-dysanova.html', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

function uniqueCodeBlockIds(html) {
  return [...new Set([...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1])))];
}

test('chapter 14 preserves original R examples while adding factorial-design teaching components', () => {
  const codeBlockIds = uniqueCodeBlockIds(chapterHtml);
  assert.deepEqual(codeBlockIds, Array.from({ length: 16 }, (_, index) => index + 1));

  assert.match(chapterHtml, /data-type="interaction"/);
  assert.match(chapterHtml, /data-type="anova"/);
  assert.match(chapterHtml, /data-type="factorial-formula-guide"/);
  assert.match(chapterHtml, /data-type="orthogonal-design-guide"/);
  assert.match(chapterHtml, /data-type="nested-design-guide"/);
  assert.match(chapterHtml, /data-type="split-plot-guide"/);
  assert.match(chapterHtml, /⬆ 上方/);
});

test('chapter 14 components teach formula semantics and design distinctions', () => {
  assert.match(chapterHtml, /a \* b \* c|a\*b\*c|a \* b \* c/);
  assert.match(chapterHtml, /factor1\/factor2|factor2嵌套在factor1/);
  assert.match(chapterHtml, /Error\(id\/factorB\)/);
  assert.match(chapterHtml, /正交设计|L8|残缺不全版本的析因设计/);
  assert.match(chapterHtml, /整区|裂区|两层误差/);
  assert.doesNotMatch(chapterHtml, /data-factorial-heavy-callout="true"/);
});

test('chapter 14 interaction card uses the actual cell means from cb1', () => {
  assert.match(chapterHtml, /data-means="\[\[24,44\],\[28,52\]\]"/);
  assert.doesNotMatch(chapterHtml, /data-means="\[\[10,30\],\[40,70\]\]"/);
});

test('factorial design guide renderers are loaded by the stats-viz entrypoint', () => {
  assert.match(presentationBundle, /factorial-design-guides\.js/);
  assert.match(statsVizEntry, /factorial-design-guides\.js/);
});
