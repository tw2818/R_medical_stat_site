import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1005-ancova.html', import.meta.url), 'utf8');
const guideModule = readFileSync(new URL('../js/viz/ancova-guides.js', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

function codeBlockIds(html) {
  return [...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
}

test('chapter 17 preserves all 11 original R examples with unique code-block anchors', () => {
  const ids = codeBlockIds(chapterHtml);
  assert.deepEqual(ids, Array.from({ length: 11 }, (_, index) => index + 1));
  assert.equal(new Set(ids).size, 11);
  assert.match(chapterHtml, /data-type="scatter"/);
});

test('chapter 17 adds compact ANCOVA teaching components', () => {
  for (const type of [
    'ancova-workflow-guide',
    'ancova-formula-guide',
    'ancova-assumption-guide',
    'ancova-adjusted-mean-guide',
    'ancova-result-guide',
    'ancova-block-guide',
    'ancova-multcompare-guide',
  ]) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
    assert.match(guideModule, new RegExp(`registerViz\\('${type}'`));
  }
  assert.match(chapterHtml, /⬆ 上方/);
  assert.doesNotMatch(chapterHtml, /data-ancova-heavy-callout="true"/);
});

test('chapter 17 teaches covariate adjustment, formula semantics, and assumptions', () => {
  assert.match(chapterHtml, /协变量|基线/);
  assert.match(chapterHtml, /调整后均值|校正均值|adjusted mean|LS means/i);
  assert.match(chapterHtml, /y\s*~\s*x\s*\+\s*group/);
  assert.match(chapterHtml, /平行|斜率相同|homogeneity of regression|x:group/i);
  assert.match(chapterHtml, /残差|正态|方差齐/);
});

test('chapter 17 teaches ANCOVA output and model term interpretation', () => {
  assert.match(chapterHtml, /x.*协变量|协变量.*x/);
  assert.match(chapterHtml, /group.*调整|调整.*group|扣除.*group/);
  assert.match(chapterHtml, /Residuals|残差/);
  assert.match(chapterHtml, /F\s*=\s*58\.48|58\.48/);
});

test('chapter 17 teaches random-block ANCOVA and post-hoc adjusted comparisons', () => {
  assert.match(chapterHtml, /y\s*~\s*x\s*\+\s*block\s*\+\s*group/);
  assert.match(chapterHtml, /随机区组|区组|block/);
  assert.match(chapterHtml, /多重比较|事后比较|emmeans|Bonferroni|Tukey/);
  assert.match(chapterHtml, /调整后组间差异|调整后均值差异|95% CI/);
});

test('ANCOVA guide renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  assert.match(presentationBundle, /ancova-guides\.js/);
  assert.match(statsVizEntry, /ancova-guides\.js/);
});
