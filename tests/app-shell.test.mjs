import test from 'node:test';
import assert from 'node:assert/strict';

import { ALL_CHAPTERS } from '../js/chapters.js';
import {
  createChapterLookupMaps,
  findChapterByHref,
  injectCopyButtons,
  getHashChapterTarget,
} from '../js/app/chapter-content.js';

const lookup = createChapterLookupMaps(ALL_CHAPTERS);

test('injectCopyButtons rewrites Quarto copy buttons to chapter copy buttons', () => {
  const input = '<div><button class="code-copy-button" data-copy="1">copy</button><pre><code>mean(x)</code></pre></div>';
  const output = injectCopyButtons(input);

  assert.match(output, /chapter-copy-button/);
  assert.match(output, /type="button"/);
  assert.match(output, /aria-label="复制代码"/);
  assert.doesNotMatch(output, />copy</);
});

test('findChapterByHref resolves data-relative links by filename', () => {
  const result = findChapterByHref('data/1001-ttest.html', lookup);
  assert.equal(result?.type, 'chapter');
  assert.equal(result?.chapter?.id, '1001-ttest');
});

test('findChapterByHref resolves title-based html filenames used by Quarto nav', () => {
  const result = findChapterByHref('t检验.html', lookup);
  assert.equal(result?.type, 'chapter');
  assert.equal(result?.chapter?.file, '1001-ttest.html');
});

test('findChapterByHref resolves legacy Quarto alias filenames', () => {
  const result = findChapterByHref('./亚组分析和多因素回归的森林图.html', lookup);
  assert.equal(result?.type, 'chapter');
  assert.equal(result?.chapter?.file, '1041-subgroupanalysis.html');
});

test('findChapterByHref resolves home link', () => {
  const result = findChapterByHref('index.html', lookup);
  assert.deepEqual(result, { type: 'home' });
});

test('getHashChapterTarget returns matching group and index from hash id', () => {
  const target = getHashChapterTarget('1032-survival', ALL_CHAPTERS);
  assert.deepEqual(target, { group: 'advanced', index: 11 });
});

test('getHashChapterTarget returns null for unknown chapter hash', () => {
  assert.equal(getHashChapterTarget('does-not-exist', ALL_CHAPTERS), null);
});
