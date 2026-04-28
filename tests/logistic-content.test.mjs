import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const chapterPath = new URL('../data/1018-logistic.html', import.meta.url);
const planPath = new URL('../docs/plans/2026-04-28-chapter21-logistic-teaching-optimization.md', import.meta.url);
const statsVizPath = new URL('../js/stats-viz.js', import.meta.url);
const bundlePath = new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url);
const rendererPath = new URL('../js/viz/logistic-guides.js', import.meta.url);
const metaRendererPath = new URL('../js/viz/meta.js', import.meta.url);

const html = readFileSync(chapterPath, 'utf8');
const expectedCodeIds = Array.from({ length: 33 }, (_, i) => i + 1);
const expectedTypes = [
  'logistic-equation-explainer',
  'logistic-dummy-guide',
  'logistic-or-ci-guide',
  'logistic-probability-threshold-demo',
  'logistic-stepwise-guide',
  'logistic-ordinal-parallel-guide',
];

function getStatVizTag(type) {
  const match = html.match(new RegExp(`<div class="stat-viz"[^>]+data-type="${type}"[^>]*>`, 's'));
  assert.ok(match, `${type} widget should exist`);
  return match[0];
}

function getAttr(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  assert.ok(match, `${name} should exist on ${tag}`);
  return match[1];
}

function parseCsvNumbers(value) {
  return value.split(',').map((item) => Number(item.trim()));
}

function parseJsonNumbers(value) {
  return JSON.parse(value).map((item) => Number(item));
}

test('chapter 21 preserves generated R example anchors and section structure', () => {
  const ids = [...html.matchAll(/<div class="sourceCode cell-code" id="cb(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, expectedCodeIds);
  assert.equal(new Set(ids).size, expectedCodeIds.length);

  for (const heading of ['二项逻辑回归', '多项逻辑回归', '有序逻辑回归', '条件逻辑回归', '参考资料']) {
    assert.match(html, new RegExp(`<h2[^>]*>[\\s\\S]*${heading}[\\s\\S]*<\\/h2>`), `${heading} heading should be preserved`);
  }
});

test('chapter 21 has a written optimization plan and compact logistic teaching widgets', () => {
  assert.equal(existsSync(planPath), true, 'chapter 21 optimization plan should exist');

  for (const type of expectedTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 21`);
  }

  assert.match(html, /logit|odds|OR|AIC|Brant|平行线假设|阈值/);
  assert.match(html, /⬆ 上方/);
});

test('logistic guide renderer is loaded by bundle and stats-viz entrypoint', () => {
  const bundle = readFileSync(bundlePath, 'utf8');
  const statsViz = readFileSync(statsVizPath, 'utf8');
  assert.match(bundle, /\.\/logistic-guides\.js/);
  assert.match(statsViz, /\.\/viz\/logistic-guides\.js/);
});

test('logistic guide renderer registers static guides and the threshold interaction demo', () => {
  assert.equal(existsSync(rendererPath), true, 'renderer module should exist before checking registrations');
  const renderer = readFileSync(rendererPath, 'utf8');

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(renderer, /input type="range"/);
  assert.match(renderer, /addEventListener\('input'/);
  assert.match(renderer, /logit|odds|OR|AIC|Brant|平行线假设|敏感度|特异度/);
});

test('existing logistic OR forest uses matched arrays and actual OR confidence intervals from cb4', () => {
  const tag = getStatVizTag('logistic');
  const labels = getAttr(tag, 'data-labels').split(',').map((item) => item.trim());
  const values = parseCsvNumbers(getAttr(tag, 'data-values'));
  const lower = parseCsvNumbers(getAttr(tag, 'data-lower'));
  const upper = parseCsvNumbers(getAttr(tag, 'data-upper'));

  assert.equal(labels.length, 11);
  assert.equal(values.length, labels.length);
  assert.equal(lower.length, labels.length);
  assert.equal(upper.length, labels.length);

  assert.deepEqual(labels, ['x12', 'x13', 'x14', 'x21', 'x31', 'x41', 'x51', 'x61', 'x72', 'x73', 'x81']);
  assert.equal(values[7], 50.4345);
  assert.equal(lower[7], 3.7775);
  assert.equal(upper[7], 2159.5535);
  assert.equal(values[10], 11.7426);
  assert.equal(lower[10], 1.6662);
  assert.equal(upper[10], 148.0207);
});

test('prediction-related demo widgets use valid probability arrays and explicitly say they are demonstrations', () => {
  const rocTag = getStatVizTag('roc');
  const auc = Number(getAttr(rocTag, 'data-auc'));
  assert.ok(auc >= 0 && auc <= 1, 'AUC should be a valid probability-like metric');

  const calibrationTag = getStatVizTag('calibration');
  const pred = parseJsonNumbers(getAttr(calibrationTag, 'data-pred'));
  const obs = parseJsonNumbers(getAttr(calibrationTag, 'data-obs'));
  assert.equal(pred.length, obs.length);
  assert.ok(pred.every((item) => item >= 0 && item <= 1));
  assert.ok(obs.every((item) => item >= 0 && item <= 1));

  const riskTag = getStatVizTag('riskdist');
  const eventRisk = parseCsvNumbers(getAttr(riskTag, 'data-event'));
  const noneventRisk = parseCsvNumbers(getAttr(riskTag, 'data-nonevent'));
  assert.ok([...eventRisk, ...noneventRisk].every((item) => item >= 0 && item <= 1));

  assert.match(html, /ROC[^<]{0,80}(教学演示|示意)|(?:教学演示|示意)[^<]{0,80}ROC/);
  assert.match(html, /校准曲线[^<]{0,80}(教学演示|示意)|(?:教学演示|示意)[^<]{0,80}校准曲线/);
  assert.match(html, /混淆矩阵[^<]{0,80}(教学演示|示意)|(?:教学演示|示意)[^<]{0,80}混淆矩阵/);
});

test('nomogram and multinomial forest labels match the chapter semantics or are clearly marked as schematic', () => {
  const nomogramTag = getStatVizTag('nomogram');
  assert.doesNotMatch(nomogramTag, /年龄,血压,胆固醇/);
  assert.match(nomogramTag, /x6|x8|x2|x3|例16-2|示意/);

  const subgroupTag = getStatVizTag('subgroupforest');
  assert.doesNotMatch(subgroupTag, /data-hr=/);
  assert.match(subgroupTag, /data-values=/);
  assert.match(html, /多项Logistic[^<]{0,120}(OR|优势比)[^<]{0,120}(教学演示|示意)|(?:教学演示|示意)[^<]{0,120}多项Logistic[^<]{0,120}(OR|优势比)/);
});

test('subgroup forest renderer accepts generic effect values and does not hard-code HR semantics', () => {
  const metaRenderer = readFileSync(metaRendererPath, 'utf8');
  const subgroupRenderer = metaRenderer.slice(
    metaRenderer.indexOf('function renderSubgroupForest'),
    metaRenderer.indexOf("registerViz('subgroupforest'")
  );

  assert.match(subgroupRenderer, /el\.dataset\.values\s*\|\|\s*el\.dataset\.hr/);
  assert.doesNotMatch(subgroupRenderer, /const\s+rawHR\s*=\s*el\.dataset\.hr/);
  assert.match(subgroupRenderer, /OR\/效应量|效应量|优势比/);
  assert.doesNotMatch(subgroupRenderer, /HR&lt;1 表示治疗有利/);
});
