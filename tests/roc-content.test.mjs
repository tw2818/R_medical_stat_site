import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/roc.html', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/viz/roc-guides.js', import.meta.url), 'utf8');
const clinicalModels = readFileSync(new URL('../js/viz/clinical-models.js', import.meta.url), 'utf8');

test('chapter 12 preserves original ROC R examples', () => {
  const codeBlockIds = [...chapterHtml.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
  const uniqueIds = [...new Set(codeBlockIds)].sort((a, b) => a - b);
  assert.equal(uniqueIds.length, 15);
  assert.deepEqual(uniqueIds, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  for (const token of ['cal_roc', 'ggplot', 'pROC', 'roc(', 'print.thres']) {
    assert.match(chapterHtml, new RegExp(token.replace('(', '\\(')));
  }
});

test('chapter 12 keeps existing ROC widgets and adds teaching guides', () => {
  for (const type of ['confusionmatrix', 'roc', 'roccompare']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  for (const type of ['diagnostic-metrics-guide', 'roc-threshold-tradeoff', 'auc-interpretation-guide', 'roc-reporting-guide', 'prediction-roc-guide']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  assert.doesNotMatch(chapterHtml, /callout callout-style-default/);
});

test('ROC guide renderer is bundled and keeps interaction focused on threshold trade-off', () => {
  assert.match(presentationBundle, /\.\/roc-guides\.js/);
  for (const type of ['diagnostic-metrics-guide', 'roc-threshold-tradeoff', 'auc-interpretation-guide', 'roc-reporting-guide', 'prediction-roc-guide']) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`));
  }
  assert.match(renderer, /function renderThresholdTradeoff/);
  assert.match(renderer, /addEventListener\('input'/);
  const staticBlock = renderer.slice(
    renderer.indexOf('function renderRocStatic'),
    renderer.indexOf('const DEMO_VALUES')
  );
  assert.doesNotMatch(staticBlock, /addEventListener/);
});

test('ROC renderers keep labels paired with scores and display computed AUC', () => {
  assert.match(clinicalModels, /makeRocPoints/);
  assert.match(clinicalModels, /computeAuc/);
  assert.match(clinicalModels, /score:\s*v,\s*label:\s*1/);
  assert.match(clinicalModels, /score:\s*v,\s*label:\s*0/);
  assert.match(clinicalModels, /actualAuc1/);
  assert.match(clinicalModels, /actualAuc2/);
  assert.doesNotMatch(clinicalModels, /const allVals = \[\.\.\.disease, \.\.\.healthy\]\.sort/);
});
