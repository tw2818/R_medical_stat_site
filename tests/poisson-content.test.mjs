import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const chapterPath = new URL('../data/poisson.html', import.meta.url);
const planPath = new URL('../docs/plans/2026-04-28-chapter23-poisson-negbin-teaching-optimization.md', import.meta.url);
const statsVizPath = new URL('../js/stats-viz.js', import.meta.url);
const bundlePath = new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url);
const rendererPath = new URL('../js/viz/poisson-guides.js', import.meta.url);

const html = readFileSync(chapterPath, 'utf8');
const plainText = html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const expectedCodeIds = Array.from({ length: 12 }, (_, i) => i + 1);
const expectedTypes = [
  'poisson-glm-connection',
  'poisson-offset-guide',
  'poisson-irr-guide',
  'poisson-overdispersion-guide',
  'poisson-model-choice-guide',
  'poisson-nb-result-guide',
];

function getStatTag(type) {
  const match = html.match(new RegExp(`<div class="stat-(?:viz|calc)"[^>]+data-type="${type}"[^>]*>`, 's'));
  assert.ok(match, `${type} widget should exist`);
  return match[0];
}

test('chapter 23 preserves original R examples and section structure', () => {
  const ids = [...html.matchAll(/<div class="sourceCode cell-code" id="cb(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, expectedCodeIds);
  assert.equal(new Set(ids).size, expectedCodeIds.length);

  for (const heading of ['泊松回归和负二项回归', '泊松回归简介', '泊松回归应用', '负二项回归简介', '负二项回归应用', '参考资料']) {
    assert.match(html, new RegExp(`<h[12][^>]*>[\\s\\S]*${heading}[\\s\\S]*<\\/h[12]>`), `${heading} heading should be preserved`);
  }
});

test('chapter 23 has a written optimization plan and compact teaching widgets', () => {
  assert.equal(existsSync(planPath), true, 'chapter 23 optimization plan should exist');
  const plan = readFileSync(planPath, 'utf8');
  assert.match(plan, /第22章|log-linear|offset|过度离散|负二项/);

  for (const type of expectedTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 23`);
  }

  assert.match(html, /data-type="negativebinomialguide"/);
  assert.match(html, /⬆ 上方/);
  assert.match(html, /offset|IRR|RR|dispersion ratio|quasi-Poisson|theta|AIC/);
});

test('chapter 23 upgrades the opening Poisson distribution widget', () => {
  const tag = getStatTag('poissondistfixed');
  assert.match(tag, /data-lambda="3\.5"/);
  assert.doesNotMatch(html, /data-type="poisson" data-title="泊松分布示例/);
});

test('Poisson guide renderer is loaded and registers every new component', () => {
  assert.equal(existsSync(rendererPath), true, 'Poisson guide renderer should exist');
  const renderer = readFileSync(rendererPath, 'utf8');
  const bundle = readFileSync(bundlePath, 'utf8');
  const statsViz = readFileSync(statsVizPath, 'utf8');

  assert.match(bundle, /\.\/poisson-guides\.js/);
  assert.match(statsViz, /\.\/viz\/poisson-guides\.js/);

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(renderer, /2\.249864|1\.7726609281|2\.850500|3\.231|3\.23081|0\.3003|426\.23/);
  assert.match(renderer, /offset|IRR|rate ratio|过度离散|quasi-Poisson|negative binomial|教学示意/);
});

test('chapter 23 teaching content is anchored to actual R output values', () => {
  assert.match(plainText, /glm\(formula = Y ~ X1 \+ YEARGRP, family = poisson\(\), data = data18_1,/);
  assert.match(plainText, /offset = log\(N\)\)/);
  assert.match(plainText, /X1有暴露\s+0\.8109\s+0\.1210\s+6\.699\s+2\.09e-11/);
  assert.match(plainText, /X1有暴露\s+1\.7726609281\s+2\.850500e\+00/);
  assert.match(plainText, /0\.01916785/);
  assert.match(plainText, /0\.02137005/);
  assert.match(plainText, /dispersion ratio = 3\.231/);
  assert.match(plainText, /Dispersion parameter for quasipoisson family taken to be 3\.23081/);
  assert.match(plainText, /Theta:\s+0\.3003/);
  assert.match(plainText, /AIC:\s+426\.23/);
});

test('chapter 23 fixes stale or misleading prose', () => {
  assert.doesNotMatch(html, /2\.74<sub>7\.21/);
  assert.match(html, /2\.74～7\.21/);
  assert.doesNotMatch(html, /95%CI:8\.51<\/sub>23\.23/);
  assert.match(html, /8\.51～23\.23/);
  assert.doesNotMatch(html, /negativebinomialregression/);
  assert.match(html, /negative binomial regression/);
  assert.doesNotMatch(html, /theta接近1，表明数据接近泊松分布/);
  assert.match(html, /theta越大越接近Poisson分布|theta 越大越接近 Poisson/);
});
