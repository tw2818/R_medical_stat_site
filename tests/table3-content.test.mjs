import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const table3Html = readFileSync(new URL('../data/table3.html', import.meta.url), 'utf8');
const statsVizEntry = readFileSync(new URL('../js/stats-viz.js', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');

function uniqueCodeBlockIds(html) {
  return [...new Set([...html.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1])))];
}

test('chapter 8 preserves original R code examples while using card-style teaching components', () => {
  const codeBlockIds = uniqueCodeBlockIds(table3Html);
  assert.equal(codeBlockIds.length, 48);
  assert.equal(Math.max(...codeBlockIds), 48);

  assert.match(table3Html, /data-type="table1-workflow"/);
  assert.match(table3Html, /data-type="table1-variable-guide"/);
  assert.match(table3Html, /data-type="table1-pvalue-guide"/);
  assert.doesNotMatch(table3Html, /data-table3-learning-goals="true"/);
  assert.doesNotMatch(table3Html, /data-table3-final-checklist="true"/);
});

test('chapter 8 keeps baseline-table visualization with short flow-style explanation', () => {
  assert.match(table3Html, /data-type="baseline-table"/);
  assert.match(table3Html, /⬆ 上方/);
  assert.match(table3Html, /Table 1|基线资料表/);
});

test('table1 teaching guides are loaded by the stats-viz entrypoint', () => {
  assert.match(presentationBundle, /table1-guides\.js/);
  assert.match(statsVizEntry, /table1-guides\.js/);
});
