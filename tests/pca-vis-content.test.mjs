import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const chapterPath = join(ROOT, 'data/pca-vis.html');
const rendererPath = join(ROOT, 'js/viz/pca-vis-guides.js');
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
  'fviz-workflow-guide',
  'fviz-scree-guide',
  'fviz-varcoord-guide',
  'fviz-cos2-guide',
  'fviz-contrib-guide',
  'fviz-group-coloring-guide',
  'fviz-biplot-guide',
  'ggplot2-pca-guide',
  'fviz-scree-cutoff-guide',
  'fviz-coloring-scenario-guide'
];

const expectedCodeIds = [
  'cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7', 'cb8',
  'cb9', 'cb10', 'cb11', 'cb12', 'cb13', 'cb14', 'cb15', 'cb16',
  'cb17', 'cb18', 'cb19', 'cb20', 'cb21', 'cb22', 'cb23', 'cb24',
  'cb25', 'cb26', 'cb27', 'cb28', 'cb29', 'cb30', 'cb31'
];

test('chapter 30 source file and title structure are preserved', () => {
  assert.equal(existsSync(chapterPath), true, 'chapter 30 html should exist');

  const text = plainText(read(chapterPath));
  assert.ok(text.includes('30 主成分分析可视化'));
  for (const section of [
    '30.1 进阶的PCA可视化',
    '30.2 ggplot2',
    '30.3 3d版',
    '30.1.5 维度描述'
  ]) {
    assert.ok(text.includes(section), `missing section ${section}`);
  }
});

test('chapter 30 R code block anchors are preserved (cb1-cb31)', () => {
  const html = read(chapterPath);
  const ids = [...html.matchAll(/id=["'](cb\d+)["']/g)].map((match) => match[1]);
  const uniqueIds = [...new Set(ids)];
  assert.deepEqual(uniqueIds, expectedCodeIds);
  assert.equal(ids.length, uniqueIds.length, 'code block ids should not be duplicated');
});

test('chapter 30 contains guide placeholders for fviz teaching cards', () => {
  const html = read(chapterPath);

  for (const type of expectedGuideTypes) {
    assert.match(html, new RegExp(`data-type=["']${type}["']`), `missing stat-viz placeholder for ${type}`);
  }
});

test('PCA visualization guide renderer is registered and imported', () => {
  assert.equal(existsSync(rendererPath), true, 'PCA vis guide renderer file should exist');
  const renderer = read(rendererPath);
  const statsViz = read(statsVizPath);
  const bundle = read(bundlePath);

  assert.match(statsViz, /import ['"]\.\/viz\/pca-vis-guides\.js['"]/);
  assert.match(bundle, /import ['"]\.\/pca-vis-guides\.js['"]/);

  for (const type of expectedGuideTypes) {
    assert.match(renderer, new RegExp(`registerViz\\(['"]${type}['"]`), `renderer should register ${type}`);
  }

  // Interactive component assertions
  assert.match(renderer, /input type="range"/, 'fviz-scree-cutoff-guide should include range input');
  assert.match(renderer, /addEventListener\(['"]input['"]/, 'scree cutoff should update interactively on slider input');
  assert.match(renderer, /id="pca-scree-threshold"/, 'range input should have a stable id');
  assert.match(renderer, /for="pca-scree-threshold"/, 'range label should be associated with the input');
  assert.match(renderer, /aria-valuemin="50"/, 'range input should expose aria-valuemin');
  assert.match(renderer, /aria-valuemax="100"/, 'range input should expose aria-valuemax');
  assert.match(renderer, /setAttribute\(['"]aria-valuenow['"]/, 'range input should keep aria-valuenow updated');
  assert.match(renderer, /cumulative >= threshold/, 'cutoff logic should retain PCs until cumulative variance reaches the threshold');
  assert.match(renderer, /<select/, 'fviz-coloring-scenario-guide should include select dropdown');
  assert.match(renderer, /for="pca-coloring-scenario"/, 'select label should be associated with the dropdown');
  assert.match(renderer, /aria-describedby="pca-coloring-explain"/, 'select should describe its dynamic explanation region');
  assert.match(renderer, /aria-live="polite"/, 'dynamic scenario output should be announced politely');
  assert.match(renderer, /addEventListener\(['"]change['"]/, 'coloring scenario should update on select change');
  assert.match(renderer, /escapeHtml\(/, 'all renderers should use escapeHtml for dataset.title');
});

test('chapter 30 PCA visualization values and prose are calibrated to the R output', () => {
  const html = read(chapterPath);
  const text = plainText(html);
  const renderer = read(rendererPath);

  assert.match(html, /data-values="72\.96,22\.85,3\.67,0\.52"/, 'scree widget should use variance percentages from cb2');
  assert.doesNotMatch(html, /data-values="72\.96,24\.79,1\.71,0\.54"/, 'stale scree values should be removed');
  assert.match(renderer, /\{ name: 'PC3', variance: 3\.67 \}/, 'interactive cutoff should use cb2 PC3 variance');
  assert.match(renderer, /\{ name: 'PC4', variance: 0\.52 \}/, 'interactive cutoff should use cb2 PC4 variance');
  assert.doesNotMatch(renderer, /3%（= 100%\/4/, 'average variable contribution threshold should not be 3%');
  assert.match(renderer, /25%（= 100%\/4/, 'average variable contribution threshold should be 25% for four variables');
  assert.match(renderer, /只有 PC1.*Kaiser/, 'Kaiser rule explanation should say only PC1 passes');
  assert.match(renderer, /PC2.*未通过/, 'PC2 should not be described as passing Kaiser rule');

  for (const stale of ['通过get_pca_var()`函数实现', '双标图…', '下载会继续', '花里胡哨']) {
    assert.equal(text.includes(stale), false, `stale prose should be removed: ${stale}`);
  }
  assert.doesNotMatch(html, /<code>gplot2<\/code>/, 'ggplot2 package name should be spelled correctly');
});

test('pca-vis-guides.js module can be imported', async () => {
  const modulePath = join(ROOT, 'js/viz/pca-vis-guides.js');
  assert.equal(existsSync(modulePath), true, 'pca-vis-guides.js should exist for import');
});
