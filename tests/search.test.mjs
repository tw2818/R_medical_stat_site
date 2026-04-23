import test from 'node:test';
import assert from 'node:assert/strict';

import { ALL_CHAPTERS } from '../js/chapters.js';
import { findMatchingChapters } from '../js/app/search.js';

test('findMatchingChapters returns empty list for blank queries', () => {
  assert.deepEqual(findMatchingChapters('', ALL_CHAPTERS), []);
  assert.deepEqual(findMatchingChapters('   ', ALL_CHAPTERS), []);
});

test('findMatchingChapters matches by chapter title and preserves ordering', () => {
  const results = findMatchingChapters('t检验', ALL_CHAPTERS);
  assert.ok(results.length >= 1);
  assert.equal(results[0].id, '1001-ttest');
});

test('findMatchingChapters matches by group name and limits to 8 items', () => {
  const results = findMatchingChapters('高级统计分析', ALL_CHAPTERS);
  assert.equal(results.length, 8);
  assert.ok(results.every(chapter => chapter.group === 'advanced'));
});

test('findMatchingChapters matches by chapter number text', () => {
  const results = findMatchingChapters('41', ALL_CHAPTERS);
  assert.equal(results[0]?.id, '1038-p4trend');
});
