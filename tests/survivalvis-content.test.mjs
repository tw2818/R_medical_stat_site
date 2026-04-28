import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/1033-survivalvis.html');
const planPath = join(ROOT, 'docs/plans/2026-04-28-chapter26-survivalvis-teaching-optimization.md');
const rendererPath = join(ROOT, 'js/viz/survivalvis-guides.js');
const statsVizPath = join(ROOT, 'js/stats-viz.js');
const bundlePath = join(ROOT, 'js/viz/_bundle-presentation-modules.js');

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
  'survivalvis-anatomy-guide',
  'survivalvis-risk-table-demo',
  'survivalvis-parameter-map-guide',
  'survivalvis-grouping-guide',
  'survivalvis-combine-guide',
  'survivalvis-warning-guide'
];

const expectedCodeIds = [
  ...Array.from({ length: 25 }, (_, index) => `cb${index + 1}`),
  'cb28',
  'cb29',
  'cb30',
  'cb31',
  'cb32',
  'cb33'
];

test('chapter 26 source file, plan, title and section structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 26 html should exist');
  assert.equal(existsSync(planPath), true, 'chapter 26 plan should exist');

  const html = read(chapterPath);
  const text = plainText(html);
  assert.ok(text.includes('26 生存曲线可视化'));

  for (const section of [
    '26.1 演示数据',
    '26.2 基本的生存曲线',
    '26.3 增加 risk table',
    '26.4 增加删失数图（ncensor plot）',
    '26.5 高度自定义设置',
    '26.6 多个组的生存曲线',
    '26.7 多个分类变量分面绘制',
    '26.8 同时绘制多个生存函数',
    '26.9 根据某一个变量分组绘制',
    '26.10 在原有生存曲线的基础上增加总体曲线',
    '26.11 多个生存函数画在一起',
    '26.12 参考资料'
  ]) {
    assert.ok(text.includes(section), `missing or uncorrected section ${section}`);
  }
});

test('original survival-visualization R code block anchors remain intact', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');

  const compact = plainText(html).replace(/\s+/g, '');
  for (const snippet of [
    'ggsurvplot(fit,data=lung)',
    'censor.shape="|"',
    'risk.table=TRUE',
    'ncensor.plot=TRUE',
    'ggsurvplot_facet(fit,colon,facet.by=c("rx","adhere"),palette="jco",pval=TRUE)',
    'ggsurvplot_group_by(fit,colon,group.by="rx"',
    'add.all=TRUE',
    'ggsurvplot_combine(fit,demo.data)'
  ]) {
    assert.ok(compact.includes(snippet), `missing protected R snippet: ${snippet}`);
  }
});

test('chapter 26 keeps existing KM visualization and adds six survival-visualization teaching components', () => {
  const html = read(chapterPath);
  assert.match(html, /data-type=["']km["']/, 'existing KM widget should remain');

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('survivalvis guide renderer is registered, imported, interactive and defensive', () => {
  assert.equal(existsSync(rendererPath), true, 'survivalvis guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/survivalvis-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/survivalvis-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }
  assert.match(renderer, /input type="range"/, 'risk table demo should include a range input');
  assert.match(renderer, /addEventListener\(['"]input['"]/, 'range input should update interactively');
  assert.match(renderer, /addEventListener\(['"]change['"]/, 'grouping selector should update interactively');
  assert.match(renderer, /escapeHtml\(/, 'dataset titles interpolated into innerHTML should be escaped');
});

test('known survival visualization prose issues are corrected without deleting warnings', () => {
  const html = read(chapterPath);
  const text = plainText(html);

  assert.equal(text.includes('超级无敌'), false, 'informal heading should be replaced');
  assert.equal(text.includes('增加删失时间表ncensor plot'), false, 'ncensor heading should be made readable');
  assert.ok(text.includes('lung 数据的 status 原始编码为 1=删失、2=死亡'));
  assert.ok(text.includes('colon 数据在本章示例中使用 1=事件、0=删失'));
  assert.ok(text.includes('status 编码要先看数据说明，再决定是否转换'));
  assert.equal(text.includes('推文'), false, 'external post wording should be replaced by course-site wording');
  assert.ok(text.includes('ggsurvplot()：最常用的生存曲线可视化入口'));
  assert.ok(text.includes('Warning in geom_segment'), 'original warning output should remain visible');
  assert.ok(text.includes('这些 geom_segment() warning 是 ggplot2 对辅助线图层的长度提示'));
});
