import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/plotting.html', import.meta.url), 'utf8');
const statsEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

test('chapter 9 preserves original R code examples while adding compact guide components', () => {
  const codeBlockIds = [...chapterHtml.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
  assert.equal(new Set(codeBlockIds).size, 29);
  assert.deepEqual([...new Set(codeBlockIds)].sort((a, b) => a - b), Array.from({ length: 29 }, (_, idx) => idx + 1));

  assert.match(chapterHtml, /data-type="plotting-workflow"/);
  assert.match(chapterHtml, /data-type="plotting-chart-choice"/);
  assert.match(chapterHtml, /data-type="plotting-polish-checklist"/);
  assert.doesNotMatch(chapterHtml, /callout callout-style-default/);
});

test('chapter 9 fills early plotting sections with existing stat-viz examples', () => {
  assert.match(chapterHtml, /data-title="分组条形图：不同年份男女患龋率"[^>]*data-values="75,60,56,53"/);
  assert.match(chapterHtml, /data-title="饼图数据的替代表达：失败原因构成"[^>]*data-values="226,52,22,17,10"/);
  assert.match(chapterHtml, /data-title="百分比条形图：2000年婴儿死因构成"[^>]*data-props="0\.195,0\.170,0\.159,0\.049,0\.037,0\.390"/);
  assert.match(chapterHtml, /data-title="布氏菌病发病人数趋势"[^>]*data-xs="2006,2007,2008,2009,2010"/);
});

test('plotting guide renderer is loaded by the stats-viz entrypoint', () => {
  assert.match(presentationBundle, /\.\/plotting-guides\.js/);
  assert.match(statsEntry, /_bundle-presentation-modules\.js/);
});

test('plotting guide renderer uses interaction only where it supports learning', () => {
  const renderer = readFileSync(new URL('../js/viz/plotting-guides.js', import.meta.url), 'utf8');
  assert.match(renderer, /addEventListener\('click'/);
  assert.match(renderer, /data-step/);
  assert.match(renderer, /data-choice/);
  assert.match(renderer, /静态核对模板/);
  assert.doesNotMatch(renderer, /aria-pressed/);
});
