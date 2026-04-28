import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const chapterPath = new URL('../data/loglinear.html', import.meta.url);
const planPath = new URL('../docs/plans/2026-04-28-chapter22-loglinear-teaching-optimization.md', import.meta.url);
const statsVizPath = new URL('../js/stats-viz.js', import.meta.url);
const bundlePath = new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url);
const rendererPath = new URL('../js/viz/loglinear-guides.js', import.meta.url);

const html = readFileSync(chapterPath, 'utf8');
const plainText = html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const expectedCodeIds = [...Array.from({ length: 12 }, (_, i) => i + 1), ...Array.from({ length: 6 }, (_, i) => i + 14), 21];
const expectedTypes = [
  'loglinear-glm-connection',
  'loglinear-marginal-stratified-demo',
  'loglinear-formula-guide',
  'loglinear-fit-test-guide',
  'loglinear-or-bridge-guide',
  'loglinear-model-hierarchy-guide',
];

function getStatVizTag(type) {
  const match = html.match(new RegExp(`<div class="stat-viz"[^>]+data-type="${type}"[^>]*>`, 's'));
  assert.ok(match, `${type} widget should exist`);
  return match[0];
}

test('chapter 22 preserves generated R example anchors, headings, and existing chi-square widget', () => {
  const ids = [...html.matchAll(/<div class="sourceCode cell-code" id="cb(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, expectedCodeIds);
  assert.equal(new Set(ids).size, expectedCodeIds.length);

  for (const heading of ['多维列联表的对数线性模型', '对数线性模型和卡方检验', '对数线性模型的概念', '2*2列联表', 'R*C表', '三维列联表']) {
    assert.match(html, new RegExp(`<h[12][^>]*>[\\s\\S]*${heading}[\\s\\S]*<\\/h[12]>`), `${heading} heading should be preserved`);
  }

  const chisqTag = getStatVizTag('chisq');
  assert.match(chisqTag, /data-a="20"/);
  assert.match(chisqTag, /data-b="373"/);
  assert.match(chisqTag, /data-c="6"/);
  assert.match(chisqTag, /data-d="316"/);
});

test('chapter 22 has written optimization plan and compact log-linear teaching widgets', () => {
  assert.equal(existsSync(planPath), true, 'chapter 22 optimization plan should exist');
  const plan = readFileSync(planPath, 'utf8');
  assert.match(plan, /第21章|Logistic|第23章|Poisson|负二项/);

  for (const type of expectedTypes) {
    assert.match(html, new RegExp(`data-type="${type}"`), `${type} should be inserted in chapter 22`);
  }

  assert.match(html, /⬆ 上方/);
  assert.match(html, /logit|Poisson|log\(μ\)|G²|Pearson|AIC|OR|层次模型/);
});

test('log-linear guide renderer is loaded by presentation bundle and stats-viz entrypoint', () => {
  const bundle = readFileSync(bundlePath, 'utf8');
  const statsViz = readFileSync(statsVizPath, 'utf8');
  assert.match(bundle, /\.\/loglinear-guides\.js/);
  assert.match(statsViz, /\.\/viz\/loglinear-guides\.js/);
});

test('log-linear guide renderer registers all chapter 22 teaching components', () => {
  assert.equal(existsSync(rendererPath), true, 'renderer module should exist before checking registrations');
  const renderer = readFileSync(rendererPath, 'utf8');

  for (const type of expectedTypes) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`), `${type} should be registered`);
  }

  assert.match(renderer, /579|485|1032|483/);
  assert.match(renderer, /49\.84297|50\.04632|0\.5587329|0\.09702652|0\.9526447/);
  assert.match(renderer, /教学示意|Logistic|Poisson|第23章|层次原则|饱和模型/);
});

test('chapter 22 widgets are anchored to actual outputs from the chapter rather than generic placeholders', () => {
  assert.match(plainText, /X-squared = 5\.2555, df = 1, p-value = 0\.02188/);
  assert.match(plainText, /X-squared = 0\.083522, df = 1, p-value = 0\.7726/);
  assert.match(plainText, /X-squared = 9\.6186e-05, df = 1, p-value = 0\.9922/);
  assert.match(plainText, /X-squared = 173\.37, df = 1, p-value < 2\.2e-16/);
  assert.match(plainText, /Likelihood Ratio\s+49\.84297\s+1\s+1\.665557e-12/);
  assert.match(plainText, /Pearson\s+50\.04632\s+1\s+1\.501577e-12/);
  assert.match(plainText, /exp \( - 0\.5820837 \).*?0\.5587329/);
  assert.match(plainText, /Likelihood Ratio 0\.09702652 2 0\.9526447/);
});

test('chapter 22 fixes stale or misleading prose in the generated explanation', () => {
  assert.doesNotMatch(html, /generalized linea rmodel/);
  assert.match(html, /generalized linear model/);
  assert.doesNotMatch(html, /从卡方检验的结果来看性别和血压是独立的/);
  assert.match(html, /从卡方检验的结果来看性别和血压并不独立|性别和血压存在统计学关联/);
  assert.doesNotMatch(html, /P值=0\.095（就是上面 f 的结果）/);
  assert.match(html, /P值=0\.953|P=0\.953/);
});
