import test from 'node:test';
import assert from 'node:assert/strict';

import { getNextExpandedState, getPathTargetId } from '../js/app/nav-shell.js';

test('getNextExpandedState flips aria-expanded state', () => {
  assert.equal(getNextExpandedState('true'), false);
  assert.equal(getNextExpandedState('false'), true);
  assert.equal(getNextExpandedState(null), true);
});

test('getPathTargetId maps tab dataset path to container id', () => {
  assert.equal(getPathTargetId('basic'), 'path-basic');
  assert.equal(getPathTargetId('clinical'), 'path-clinical');
});
