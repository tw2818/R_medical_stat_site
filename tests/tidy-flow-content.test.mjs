import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1014-batchttest.html', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

function uniqueCodeBlockIds(html) {
  return [...new Set([...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1])))];
}

test('chapter 13 preserves original R examples while adding tidy-flow teaching components', () => {
  const codeBlockIds = uniqueCodeBlockIds(chapterHtml);
  assert.deepEqual(codeBlockIds, [1, 2, 3, 4, 5]);

  assert.match(chapterHtml, /data-type="tidy-flow-workflow"/);
  assert.match(chapterHtml, /data-type="tidy-flow-assumption-guide"/);
  assert.match(chapterHtml, /data-type="tidy-flow-result-guide"/);
  assert.match(chapterHtml, /data-type="normtest"/);
  assert.match(chapterHtml, /⬆ 上方/);
});

test('chapter 13 teaching additions highlight batch assumptions and multiple testing', () => {
  assert.match(chapterHtml, /pivot_longer/);
  assert.match(chapterHtml, /shapiro_test/);
  assert.match(chapterHtml, /levene_test/);
  assert.match(chapterHtml, /t_test/);
  assert.match(chapterHtml, /多重检验|假阳性|p\.adjust/);
  assert.match(chapterHtml, /秩和检验|Wilcoxon/);
  assert.doesNotMatch(chapterHtml, /data-tidy-flow-heavy-callout="true"/);
});

test('tidy-flow guide renderers are loaded by the stats-viz entrypoint', () => {
  assert.match(presentationBundle, /tidy-flow-guides\.js/);
  assert.match(statsVizEntry, /tidy-flow-guides\.js/);
});
