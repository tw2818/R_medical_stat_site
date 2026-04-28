import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1032-survival.html');
const planPath = join(ROOT, 'docs/plans/2026-04-28-chapter25-survival-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/survival-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');
const survivalRendererPath = join(ROOT, 'js/viz/survival.js');

function read(path) {
  return readFileSync(path, 'utf8');
}

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const expectedGuideTypes = [
  'survival-censor-riskset-guide',
  'survival-km-logrank-guide',
  'survival-logrank-oe-demo',
  'survival-cox-hr-bridge-guide',
  'survival-ph-diagnostic-guide',
  'survival-time-split-demo'
];

const existingVizTypes = ['km', 'cox', 'survcomp', 'scatter'];

test('chapter 25 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 25 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 25 plan should exist');

  const html = read(chapterPath);
  const text = plainText(html);
  assert.ok(text.includes('25 生存分析'));

  for (const section of [
    '25.1 生存过程的描述',
    '25.2 生存过程的比较',
    '25.3 Cox回归',
    '25.4 时间依存协变量的Cox回归和时间依存系数Cox回归',
    '25.4.1 对时间分层',
    '25.4.2 连续性时依系数变换',
    '25.5 参考资料'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('original survival R code block anchors remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map(match => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, Array.from({ length: 30 }, (_, index) => `cb${index + 1}`));

  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of [
    'df$status<-ifelse(df$status==2,1,0)',
    'fit<-survfit(Surv(time,status)~1,data=df)',
    'fit<-survdiff(Surv(time,status)~sex,data=df)',
    'fit.cox<-coxph(Surv(time,status)~sex+age+ph.karno,data=lung)',
    'cox.zph(fit2)',
    'fit3<-coxph(Surv(time,status)~trt+prior+karno+tt(karno)'
  ]) {
    assert.ok(compact.includes(snippet), `missing protected R snippet: ${snippet}`);
  }
});

test('chapter 25 keeps existing useful survival visualizations', () => {
  const html = read(chapterPath);
  for (const type of existingVizTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing existing data-type ${type}`);
  }
});

test('chapter 25 adds six compact survival teaching components including needed interactions', () => {
  const html = read(chapterPath);
  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
  assert.match(html, /data-type=["']survival-logrank-oe-demo["'][\s\S]*data-title=["'][^"']*logrank/i);
  assert.match(html, /data-type=["']survival-time-split-demo["'][\s\S]*data-title=["'][^"']*(survSplit|时间分层)/i);
});

test('survival guide renderer is registered, imported and preserves interactivity', () => {
  assert.equal(existsSync(rendererPath), true, 'survival guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/survival-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/survival-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /input type="range"/, 'interactive components should expose range inputs');
  assert.match(renderer, /addEventListener\(['"]input['"]/, 'interactive components should update on input');
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known survival prose and concept errors are corrected', () => {
  const html = read(chapterPath);
  const text = plainText(html);
  assert.equal(text.includes('Concordance= 0.645'), false, 'stale C-index should be removed');
  assert.ok(text.includes('Concordance= 0.637'), 'actual C-index from cb17 should be used');
  assert.equal(text.includes('经过变换后的的PH检验'), false, 'duplicate 的 typo should be removed');
  assert.equal(text.includes('Time Dependent Covariates and Time Dependent Coefcients'), false, 'Coefficients typo should be corrected');
  assert.ok(text.includes('Time Dependent Covariates and Time Dependent Coefficients'), 'corrected survival vignette title should remain visible');
  assert.ok(text.includes('HR（风险比）') || text.includes('HR值'), 'Cox HR interpretation should stay explicit');
});

test('survcomp renderer uses authored group data instead of random curves', () => {
  const renderer = read(survivalRendererPath);
  const survcompStart = renderer.indexOf('function renderSurvivalComp');
  const survcompEnd = renderer.indexOf("registerViz('survcomp'", survcompStart);
  assert.ok(survcompStart >= 0 && survcompEnd > survcompStart, 'renderSurvivalComp should be present');
  const body = renderer.slice(survcompStart, survcompEnd);
  for (const key of ['times1', 'status1', 'times2', 'status2', 'label1', 'label2']) {
    assert.match(body, new RegExp(`dataset\\.${key}`), `survcomp should read data-${key}`);
  }
  assert.equal(body.includes('Math.random'), false, 'survcomp should not generate random teaching curves when data are provided');
});
