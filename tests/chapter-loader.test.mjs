import test from 'node:test';
import assert from 'node:assert/strict';

import { createLoaderLifecycle, shouldUseCachedChapter, createChapterProgressTimer } from '../js/app/chapter-loader.js';

test('shouldUseCachedChapter reports cache presence by filename', () => {
  const fakeState = {
    hasCachedChapter(name) {
      return name === '1001-ttest.html';
    },
  };

  assert.equal(shouldUseCachedChapter(fakeState, '1001-ttest.html'), true);
  assert.equal(shouldUseCachedChapter(fakeState, 'other.html'), false);
});

test('createLoaderLifecycle clears existing timer before loading next chapter', () => {
  const calls = [];
  const fakeState = {
    timer: 'timer-1',
    getProgressTimer() { return this.timer; },
    clearProgressTimer() { calls.push('clearProgressTimer'); this.timer = null; },
  };

  const lifecycle = createLoaderLifecycle(fakeState, timer => calls.push(`clearTimeout:${timer}`));
  lifecycle.beforeLoad();

  assert.deepEqual(calls, ['clearTimeout:timer-1', 'clearProgressTimer']);
});

test('createChapterProgressTimer schedules save callback and stores timer handle', () => {
  const events = [];
  const fakeState = {
    setProgressTimer(timer) { events.push(['setProgressTimer', timer]); this.timer = timer; },
    clearProgressTimer() { events.push(['clearProgressTimer']); this.timer = null; },
  };
  let scheduled = null;
  const schedule = (fn, delay) => {
    scheduled = { fn, delay, token: 'token-1' };
    return 'token-1';
  };

  createChapterProgressTimer({
    chapterId: '1001-ttest',
    appState: fakeState,
    schedule,
    saveProgress: id => events.push(['saveProgress', id]),
  });

  assert.equal(scheduled.delay, 30000);
  assert.deepEqual(events[0], ['setProgressTimer', 'token-1']);

  scheduled.fn();
  assert.deepEqual(events.slice(1), [
    ['saveProgress', '1001-ttest'],
    ['clearProgressTimer'],
  ]);
});
