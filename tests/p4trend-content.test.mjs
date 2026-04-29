import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const HTML_PATH = 'data/1038-p4trend.html';
const html = existsSync(HTML_PATH) ? readFileSync(HTML_PATH, 'utf8') : '';
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

// Chapter 41 source file, plan, title and section structure are preserved
await test('chapter 41 source file, plan, title and section structure are preserved', () => {
  assert.ok(html.includes('41') && html.includes('p-for-trend'), 'Chapter title missing "41" and "p-for-trend"');
  assert.ok(text.includes('41.1'));
  assert.ok(text.includes('41.2'));
  assert.ok(text.includes('41.3'));
});

// Original P4Trend R code block anchors remain intact (cb1-cb8)
await test('original P4Trend R code block anchors remain intact', () => {
  const anchors = [];
  for (let i = 1; i <= 8; i++) {
    anchors.push(`cb${i}`);
  }
  for (const anchor of anchors) {
    assert.ok(html.includes(`id="${anchor}"`), `Anchor ${anchor} missing`);
  }
  // No duplicate anchors
  const cbMatches = html.match(/id="cb\d+"/g) || [];
  const cbUnique = [...new Set(cbMatches)];
  assert.equal(cbMatches.length, cbUnique.length, 'Duplicate code block anchors found');
});

// subgroupforest widget is preserved in section 41.1
await test('subgroupforest widget is preserved in section 41.1', () => {
  assert.ok(html.includes('data-type="subgroupforest"'), 'subgroupforest widget missing');
});

// Chapter 41 adds P4Trend teaching guide components (5 placeholders)
await test('chapter 41 adds P4Trend teaching guide components', () => {
  const guideTypes = [
    'p4trend-workflow-guide',
    'p4trend-dummy-guide',
    'p4trend-interaction-guide',
    'p4trend-methods-guide',
    'p4trend-persd-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(html.includes(`data-type="${type}"`), `Guide placeholder ${type} missing`);
  }
});

// P4Trend guide renderer is registered, imported, and defensive
await test('P4Trend guide renderer is registered, imported, and defensive', async () => {
  const fs = await import('fs');
  assert.ok(fs.existsSync('js/viz/p4trend-guides.js'), 'p4trend-guides.js missing');

  const src = fs.readFileSync('js/viz/p4trend-guides.js', 'utf8');
  assert.ok(src.includes('registerViz'), 'Missing registerViz calls');
  assert.ok(src.includes('escapeHtml'), 'Missing escapeHtml for defensive rendering');

  // All 5 viz types registered
  const guideTypes = [
    'p4trend-workflow-guide',
    'p4trend-dummy-guide',
    'p4trend-interaction-guide',
    'p4trend-methods-guide',
    'p4trend-persd-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(src.includes(`registerViz('${type}'`) || src.includes(`registerViz("${type}"`), `Missing registerViz for ${type}`);
  }

  // CSS id guard present
  assert.ok(src.includes('p4trend-guides-style') || (src.includes('style') && src.includes('id=')), 'Missing CSS id guard pattern');
});

// p4trend-guides.js is imported in bundle and stats-viz
await test('p4trend-guides.js is imported in bundle and stats-viz', async () => {
  const fs = await import('fs');

  const bundleSrc = fs.readFileSync('js/viz/_bundle-presentation-modules.js', 'utf8');
  assert.ok(bundleSrc.includes('p4trend-guides'), 'p4trend-guides not imported in _bundle-presentation-modules.js');

  const statsSrc = fs.readFileSync('js/stats-viz.js', 'utf8');
  assert.ok(statsSrc.includes('p4trend-guides'), 'p4trend-guides not imported in stats-viz.js');
});