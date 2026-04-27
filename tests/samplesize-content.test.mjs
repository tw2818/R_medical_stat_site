import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1011-samplesize.html', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/viz/sample-size-guides.js', import.meta.url), 'utf8');
const calculators = readFileSync(new URL('../js/viz/calculators.js', import.meta.url), 'utf8');

test('chapter 10 preserves original sample-size R examples', () => {
  const codeBlockIds = [...chapterHtml.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
  assert.equal(new Set(codeBlockIds).size, 9);
  assert.deepEqual([...new Set(codeBlockIds)].sort((a, b) => a - b), Array.from({ length: 9 }, (_, idx) => idx + 1));

  assert.match(chapterHtml, /pwr\.t\.test/);
  assert.match(chapterHtml, /power\.prop\.test/);
  assert.match(chapterHtml, /pwr\.r\.test/);
});

test('chapter 10 keeps existing meaningful calculators and adds guide components', () => {
  for (const type of ['power', 'samplesizecalc', 'anova-effectsize', 'proppower', 'corrpower']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  for (const type of ['sample-size-params', 'pwr-t-params', 'sample-size-output-guide', 'anova-sample-size-note']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  assert.doesNotMatch(chapterHtml, /callout callout-style-default/);
});

test('sample-size guide renderer is bundled and remains teaching-focused', () => {
  assert.match(presentationBundle, /\.\/sample-size-guides\.js/);
  assert.match(renderer, /registerViz\('sample-size-params'/);
  assert.match(renderer, /registerViz\('pwr-t-params'/);
  assert.match(renderer, /registerViz\('sample-size-output-guide'/);
  assert.match(renderer, /registerViz\('anova-sample-size-note'/);
  assert.doesNotMatch(renderer, /addEventListener\('click'/);
});

test('proportion power calculator exposes every control that its renderer reads', () => {
  const proppowerBlock = calculators.slice(
    calculators.indexOf('function renderPropPower'),
    calculators.indexOf("registerViz('proppower'")
  );
  assert.match(proppowerBlock, /id="\$\{id\}-pwr"/);
  assert.match(proppowerBlock, /id="\$\{id\}-pwrval"/);
  assert.match(proppowerBlock, /const pwrSlider = document\.getElementById\(id \+ '-pwr'\)/);
  assert.match(proppowerBlock, /pwrSlider\.addEventListener\('input'/);
  assert.match(proppowerBlock, /document\.getElementById\(id \+ '-pwrval'\)\.textContent/);
});
