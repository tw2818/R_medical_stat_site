import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chapterHtml = readFileSync(new URL('../data/1012-randomgroup.html', import.meta.url), 'utf8');
const presentationBundle = readFileSync(new URL('../js/viz/_bundle-presentation-modules.js', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../js/viz/randomization-guides.js', import.meta.url), 'utf8');
const calculators = readFileSync(new URL('../js/viz/calculators.js', import.meta.url), 'utf8');

test('chapter 11 preserves original randomization R examples', () => {
  const codeBlockIds = [...chapterHtml.matchAll(/id="cb(\d+)"/g)].map(match => Number(match[1]));
  assert.equal(new Set(codeBlockIds).size, 13);
  assert.deepEqual([...new Set(codeBlockIds)].sort((a, b) => a - b), Array.from({ length: 13 }, (_, idx) => idx + 1));

  for (const token of ['simple_ra', 'complete_ra', 'block_ra', 'blockrand', 'plotblockrand']) {
    assert.match(chapterHtml, new RegExp(token));
  }
});

test('chapter 11 keeps existing widgets and adds randomization teaching guides', () => {
  for (const type of ['sequential', 'samplesizecalc']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  for (const type of ['randomization-methods', 'simple-random-balance', 'block-random-flow', 'stratified-random-matrix', 'allocation-concealment-note']) {
    assert.match(chapterHtml, new RegExp(`data-type="${type}"`));
  }
  assert.doesNotMatch(chapterHtml, /callout callout-style-default/);
});

test('randomization guide renderer is bundled and uses interaction only for balance learning', () => {
  assert.match(presentationBundle, /\.\/randomization-guides\.js/);
  for (const type of ['randomization-methods', 'simple-random-balance', 'block-random-flow', 'stratified-random-matrix', 'allocation-concealment-note']) {
    assert.match(renderer, new RegExp(`registerViz\\('${type}'`));
  }
  assert.match(renderer, /function renderSimpleBalance/);
  assert.match(renderer, /addEventListener\('input'/);
  assert.match(renderer, /addEventListener\('click'/);
  assert.doesNotMatch(renderer, /function renderStaticGuide[\s\S]*addEventListener/);
});

test('chapter 11 existing calculators read controls that they render', () => {
  const sampleSizeBlock = calculators.slice(
    calculators.indexOf('function renderSampleSizeCalc'),
    calculators.indexOf("registerViz('samplesizecalc'")
  );
  for (const suffix of ['type', 'd', 'dv', 'a', 'pwr', 'alt', 'r', 'rv', 'calc', 'result']) {
    assert.match(sampleSizeBlock, new RegExp(`id="\\$\\{id\\}-${suffix}"`));
  }

  const sequentialBlock = calculators.slice(
    calculators.indexOf('function renderSequentialAnalysis'),
    calculators.indexOf("registerViz('sequential'")
  );
  assert.match(sequentialBlock, /parseArray\(el\.dataset\.z1/);
  assert.match(sequentialBlock, /parseArray\(el\.dataset\.z2/);
  assert.match(sequentialBlock, /parseArray\(el\.dataset\.n/);
  assert.match(sequentialBlock, /drawSeries\(Z,/);
  assert.match(sequentialBlock, /drawSeries\(Z2,/);
  assert.doesNotMatch(sequentialBlock, /Math\.sqrt\(n\)/);
});
