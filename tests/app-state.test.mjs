import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppState } from '../js/app/state.js';

test('createAppState stores and clears current chapter position', () => {
  const state = createAppState();

  assert.deepEqual(state.getCurrentPosition(), { group: null, index: 0 });

  state.setCurrentPosition('basic', 2);
  assert.deepEqual(state.getCurrentPosition(), { group: 'basic', index: 2 });

  state.resetCurrentPosition();
  assert.deepEqual(state.getCurrentPosition(), { group: null, index: 0 });
});

test('createAppState caches chapter html by filename', () => {
  const state = createAppState();

  assert.equal(state.getCachedChapter('1001-ttest.html'), undefined);
  state.cacheChapter('1001-ttest.html', '<main>hello</main>');
  assert.equal(state.getCachedChapter('1001-ttest.html'), '<main>hello</main>');
});

test('createAppState tracks the active progress timer', () => {
  const state = createAppState();
  const token = { id: 1 };

  assert.equal(state.getProgressTimer(), null);
  state.setProgressTimer(token);
  assert.equal(state.getProgressTimer(), token);

  state.clearProgressTimer();
  assert.equal(state.getProgressTimer(), null);
});
