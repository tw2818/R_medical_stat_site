import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const HTML_PATH = 'data/1037-psw.html';
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

// Chapter 40 source file, plan, title and section structure are preserved
await test('chapter 40 source file, plan, title and section structure are preserved', () => {
  assert.ok(html.includes('40') && html.includes('倾向性评分：加权'), 'Chapter title missing "倾向性评分：加权" and "40"');
  assert.ok(text.includes('40.1'));
  assert.ok(text.includes('40.2'));
  assert.ok(text.includes('40.3'));
  assert.ok(text.includes('40.4'));
});

// Original PSW R code block anchors remain intact (cb1-cb12)
await test('original PSW R code block anchors remain intact', () => {
  const anchors = [];
  for (let i = 1; i <= 12; i++) {
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

// psdist widget is preserved in section 40.1
await test('psdist widget is preserved in section 40.1', () => {
  assert.ok(html.includes('data-type="psdist"'), 'psdist widget missing');
});

// Chapter 40 adds PSW teaching guide components (6 placeholders)
await test('chapter 40 adds PSW teaching guide components', () => {
  const guideTypes = [
    'psw-workflow-guide',
    'psw-iptw-guide',
    'psw-balance-guide',
    'psw-survey-guide',
    'psw-overlap-guide',
    'psw-comparison-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(html.includes(`data-type="${type}"`), `Guide placeholder ${type} missing`);
  }
});

// PSW guide renderer is registered, imported, and defensive
await test('PSW guide renderer is registered, imported, and defensive', async () => {
  const fs = await import('fs');
  assert.ok(fs.existsSync('js/viz/psw-guides.js'), 'psw-guides.js missing');

  const src = fs.readFileSync('js/viz/psw-guides.js', 'utf8');
  assert.ok(src.includes('registerViz'), 'Missing registerViz calls');
  assert.ok(src.includes('escapeHtml'), 'Missing escapeHtml for defensive rendering');

  // All 6 viz types registered
  const guideTypes = [
    'psw-workflow-guide',
    'psw-iptw-guide',
    'psw-balance-guide',
    'psw-survey-guide',
    'psw-overlap-guide',
    'psw-comparison-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(src.includes(`registerViz('${type}'`) || src.includes(`registerViz("${type}"`), `Missing registerViz for ${type}`);
  }

  // CSS id guard present
  assert.ok(src.includes('psw-guides-style') || (src.includes('style') && src.includes('id=')), 'Missing CSS id guard pattern');
});

// psw-guides.js is imported in bundle and stats-viz
await test('psw-guides.js is imported in bundle and stats-viz', async () => {
  const fs = await import('fs');

  const bundleSrc = fs.readFileSync('js/viz/_bundle-presentation-modules.js', 'utf8');
  assert.ok(bundleSrc.includes('psw-guides'), 'psw-guides not imported in _bundle-presentation-modules.js');

  const statsSrc = fs.readFileSync('js/stats-viz.js', 'utf8');
  assert.ok(statsSrc.includes('psw-guides'), 'psw-guides not imported in stats-viz.js');
});