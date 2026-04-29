import test from 'node:test';
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const HTML_PATH = 'data/gee.html';
const html = readFileSync(HTML_PATH, 'utf8');

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

const text = plainText(html);

// Chapter 36 source file, plan, title and section structure are preserved
await test('chapter 36 source file, plan, title and section structure are preserved', () => {
  assert.match(text, /36\s+广义估计方程/);
  assert.ok(text.includes('广义估计方程'));
  assert.ok(text.includes('理论知识'));
  assert.ok(text.includes('数据探索'));
  assert.ok(text.includes('建立GEE'));
  assert.ok(text.includes('结果解读'));
  assert.ok(text.includes('计算QIC'));
  assert.ok(text.includes('边际效应'));
});

// Original GEE R code block anchors remain intact
await test('original GEE R code block anchors remain intact', () => {
  const anchors = ['cb1', 'cb2', 'cb3', 'cb4', 'cb5', 'cb6', 'cb7'];
  for (const anchor of anchors) {
    assert.ok(html.includes(`id="${anchor}"`), `Anchor ${anchor} missing`);
  }
  // No duplicate anchors
  const cbMatches = html.match(/id="cb\d+"/g) || [];
  const cbUnique = [...new Set(cbMatches)];
  assert.equal(cbMatches.length, cbUnique.length, 'Duplicate code block anchors found');
});

// Chapter 36 adds GEE teaching guide components
await test('chapter 36 adds GEE teaching guide components', () => {
  const guideTypes = [
    'gee-workflow-guide',
    'gee-correlation-guide',
    'gee-interpretation-guide',
    'gee-interaction-guide',
    'gee-qic-guide',
    'gee-marginal-effect-guide'
  ];
  for (const type of guideTypes) {
    assert.ok(html.includes(`data-type="${type}"`), `Guide placeholder ${type} missing`);
  }
});

// GEE guide renderer is registered, imported, and defensive
await test('GEE guide renderer is registered, imported, and defensive', async () => {
  // Module should be loadable
  const mod = await import('../js/viz/gee-guides.js');
  assert.ok(typeof mod !== 'undefined');
  // Check the module file exists and has registerViz calls
  const fs = await import('fs');
  const src = fs.readFileSync('js/viz/gee-guides.js', 'utf8');
  assert.ok(src.includes('registerViz'), 'Missing registerViz calls');
  assert.ok(src.includes('GUIDE_CARDS'), 'Missing GUIDE_CARDS');
  assert.ok(src.includes('escapeHtml'), 'Missing escapeHtml for defensive rendering');
});

// Known GEE prose is preserved and uses course-site wording
await test('known GEE prose is preserved and uses course-site wording', () => {
  // Core terminology from the chapter
  assert.ok(text.includes('广义估计方程'));
  assert.ok(text.includes('geepack'));
  assert.ok(text.includes('geeglm'));
  assert.ok(text.includes('作业相关矩阵'));
  assert.ok(text.includes('depression'));
  // Key numbers from R output preserved
  assert.ok(text.includes('2.77')); // OR for drugnew:time
  assert.ok(text.includes('1.62')); // OR for time
});
