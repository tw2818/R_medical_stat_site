import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1004-repeatedanova.html', import.meta.url), 'utf8');
const guideModule = readFileSync(new URL('../js/viz/repeated-anova-guides.js', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');
const nonparametricViz = readFileSync(new URL('../js/viz/hypothesis-nonparametric.js', import.meta.url), 'utf8');

function codeBlockIds(html) {
  return [...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
}

test('chapter 16 preserves all 22 original R examples with unique code-block anchors', () => {
  const ids = codeBlockIds(chapterHtml);
  assert.deepEqual(ids, Array.from({ length: 22 }, (_, index) => index + 1));
  assert.equal(new Set(ids).size, 22);
  assert.match(chapterHtml, /data-type="rminteraction"/);
});

test('chapter 16 adds compact repeated-measures ANOVA teaching components', () => {
  for (const type of [
    'rm-wide-to-long-guide',
    'rm-formula-guide',
    'rm-factor-type-guide',
    'rm-result-strata-guide',
    'rm-anova-test-result-guide',
    'rm-multcompare-guide',
  ]) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
    assert.match(guideModule, new RegExp(`registerViz\\('${type}'`));
  }
  assert.match(chapterHtml, /⬆ 上方/);
  assert.doesNotMatch(chapterHtml, /data-rm-heavy-callout="true"/);
  assert.doesNotMatch(chapterHtml, /第3例是治疗后血压/);
});

test('chapter 16 teaches formula, factor, and result-strata semantics', () => {
  assert.match(chapterHtml, /Error\(n\/time\)/);
  assert.match(chapterHtml, /Error\(No\/\(times\)\)/);
  assert.match(chapterHtml, /组内因素|受试者内|within-subject/);
  assert.match(chapterHtml, /组间因素|受试者间|between-subject/);
  assert.match(chapterHtml, /Error: n/);
  assert.match(chapterHtml, /Error: n:time/);
});

test('chapter 16 teaches anova_test output and sphericity corrections', () => {
  assert.match(chapterHtml, /Mauchly.*W|Mauchly.*p|球形检验/);
  assert.match(chapterHtml, /GGe|Greenhouse-Geisser|GG 校正/);
  assert.match(chapterHtml, /HFe|Huynh-Feldt|HF 校正/);
  assert.match(chapterHtml, /p\[GG\]|p\[HF\]/);
});

test('chapter 16 teaches three repeated-measures multiple-comparison questions', () => {
  assert.match(chapterHtml, /组间差别.*多重比较|多重比较.*组间差别/);
  assert.match(chapterHtml, /时间趋势.*比较|正交多项式/);
  assert.match(chapterHtml, /时间点.*比较|t0.*t1/);
});

test('repeated-anova guide renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  assert.match(presentationBundle, /repeated-anova-guides\.js/);
  assert.match(statsVizEntry, /repeated-anova-guides\.js/);
});

test('existing rminteraction renderer uses chapter 16 example means instead of dummy data', () => {
  assert.match(nonparametricViz, /125\.2/);
  assert.match(nonparametricViz, /113\.6/);
  assert.match(nonparametricViz, /121\.6/);
  assert.match(nonparametricViz, /103\.6/);
  assert.doesNotMatch(nonparametricViz, /7\.2,\s*9\.8/);
});
