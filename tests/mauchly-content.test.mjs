import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1008-mauchly.html', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

function uniqueCodeBlockIds(html) {
  return [...new Set([...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1])))];
}

function allSourceCodeBlockIds(html) {
  return [...html.matchAll(/<div class="sourceCode cell-code" id="(cb\d+)"/g)].map(match => match[1]);
}

test('chapter 15 fixes code-block anchors while preserving all R examples', () => {
  const blockIds = allSourceCodeBlockIds(chapterHtml);
  assert.deepEqual(blockIds, Array.from({ length: 9 }, (_, index) => `cb${index + 1}`));
  assert.deepEqual(uniqueCodeBlockIds(chapterHtml), Array.from({ length: 9 }, (_, index) => index + 1));

  assert.match(chapterHtml, /mauchly\.test/);
  assert.match(chapterHtml, /rstatix/);
  assert.match(chapterHtml, /anova_test/);
});

test('chapter 15 adds compact sphericity teaching components', () => {
  assert.match(chapterHtml, /data-type="mauchly-profile-guide"/);
  assert.match(chapterHtml, /data-type="sphericity-decision-guide"/);
  assert.match(chapterHtml, /data-type="epsilon-correction-guide"/);
  assert.match(chapterHtml, /data-type="mauchly-result-summary"/);
  assert.match(chapterHtml, /⬆ 上方/);
  assert.doesNotMatch(chapterHtml, /data-mauchly-heavy-callout="true"/);
});

test('chapter 15 teaches the correct sphericity and epsilon decisions', () => {
  assert.match(chapterHtml, /W = 0\.06273|W=0\.063/);
  assert.match(chapterHtml, /p-value = 0\.008207|p=0\.008/);
  assert.match(chapterHtml, /ε̂<sub>GG<\/sub> &lt; 0\.75|ε̂_GG = 0\.597 &lt; 0\.75|0\.528/);
  assert.match(chapterHtml, /Greenhouse-Geisser|Huynh-Feldt/);
  assert.match(chapterHtml, /3组|3 种|A\",\"B\",\"C/);
  assert.doesNotMatch(chapterHtml, /这个数据有2组/);
});

test('repeated-measures guide renderers are loaded by the stats-viz entrypoint', () => {
  assert.match(presentationBundle, /repeated-measures-guides\.js/);
  assert.match(statsVizEntry, /repeated-measures-guides\.js/);
});
