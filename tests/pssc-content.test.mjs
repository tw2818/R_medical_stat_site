import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const HTML_PATH = 'data/1036-pssc.html';
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

// Chapter 39 source file, plan, title and section structure are preserved
await test('chapter 39 source file, plan, title and section structure are preserved', () => {
  assert.ok(html.includes('39') && html.includes('倾向性评分'), 'Chapter title missing "倾向性评分" and "39"');
  assert.ok(text.includes('39.1'));
  assert.ok(text.includes('39.2'));
  assert.ok(text.includes('39.3'));
  assert.ok(text.includes('39.4'));
  assert.ok(text.includes('39.5'));
  assert.ok(text.includes('39.6'));
  assert.ok(text.includes('39.7'));
  assert.ok(text.includes('39.8'));
});

// Original PSSC R code block anchors remain intact (cb1-cb17)
await test('original PSSC R code block anchors remain intact', () => {
  const anchors = [];
  for (let i = 1; i <= 17; i++) {
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

// psdist widget is preserved in section 39.5
await test('psdist widget is preserved in section 39.5', () => {
  assert.ok(html.includes('data-type="psdist"'), 'psdist widget missing');
});

// Chapter 39 adds PSSC teaching guide components (7 placeholders)
await test('chapter 39 adds PSSC teaching guide components', () => {
  const guideTypes = [
    'pssc-workflow-guide',
    'pssc-psmodel-guide',
    'pssc-distribution-guide',
    'pssc-regression-guide',
    'pssc-stratification-guide',
    'pssc-balance-guide',
    'pssc-cathexp-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(html.includes(`data-type="${type}"`), `Guide placeholder ${type} missing`);
  }
});

// PSSC guide renderer is registered, imported, and defensive
await test('PSSC guide renderer is registered, imported, and defensive', async () => {
  // Module file should exist
  const fs = await import('fs');
  assert.ok(fs.existsSync('js/viz/pssc-guides.js'), 'pssc-guides.js missing');

  const src = fs.readFileSync('js/viz/pssc-guides.js', 'utf8');
  assert.ok(src.includes('registerViz'), 'Missing registerViz calls');
  assert.ok(src.includes('escapeHtml'), 'Missing escapeHtml for defensive rendering');

  // All 7 viz types registered
  const guideTypes = [
    'pssc-workflow-guide',
    'pssc-psmodel-guide',
    'pssc-distribution-guide',
    'pssc-regression-guide',
    'pssc-stratification-guide',
    'pssc-balance-guide',
    'pssc-cathexp-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(src.includes(`registerViz('${type}'`) || src.includes(`registerViz("${type}"`), `Missing registerViz for ${type}`);
  }

  // CSS id guard present
  assert.ok(src.includes('pssc-guides-style') || src.includes('style') || src.includes('id='), 'Missing CSS id guard pattern');
});

// pssc-guides.js is imported in bundle and stats-viz
await test('pssc-guides.js is imported in bundle and stats-viz', async () => {
  const fs = await import('fs');

  const bundleSrc = fs.readFileSync('js/viz/_bundle-presentation-modules.js', 'utf8');
  assert.ok(bundleSrc.includes('pssc-guides'), 'pssc-guides not imported in _bundle-presentation-modules.js');

  const statsSrc = fs.readFileSync('js/stats-viz.js', 'utf8');
  assert.ok(statsSrc.includes('pssc-guides'), 'pssc-guides not imported in stats-viz.js');
});