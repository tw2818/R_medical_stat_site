import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveNavigationTarget, shouldSkipNavigation, getActiveLinkSelector } from '../js/app/navigation.js';
import { ALL_CHAPTERS, CHAPTERS } from '../js/chapters.js';

test('resolveNavigationTarget returns chapter metadata by group/index', () => {
  const target = resolveNavigationTarget('basic', 0, CHAPTERS);
  assert.equal(target.chapter.id, '1001-ttest');
  assert.equal(target.chapter.title, 't检验');
});

test('resolveNavigationTarget returns null for missing chapter', () => {
  assert.equal(resolveNavigationTarget('basic', 999, CHAPTERS), null);
  assert.equal(resolveNavigationTarget('missing', 0, CHAPTERS), null);
  assert.equal(resolveNavigationTarget('basic', 'not-a-number', CHAPTERS), null);
});

test('shouldSkipNavigation detects same current position', () => {
  assert.equal(shouldSkipNavigation({ group: 'basic', index: 2 }, 'basic', 2), true);
  assert.equal(shouldSkipNavigation({ group: 'basic', index: 2 }, 'basic', 1), false);
});

test('getActiveLinkSelector builds stable selector for nav links', () => {
  assert.equal(getActiveLinkSelector('advanced', 11), '.chapter-link[data-group="advanced"][data-index="11"]');
});

test('ALL_CHAPTERS still provides hash-navigation targets with group/index', () => {
  const chapter = ALL_CHAPTERS.find(item => item.id === '1032-survival');
  assert.deepEqual(
    { group: chapter.group, index: chapter.index },
    { group: 'advanced', index: 11 }
  );
});
