import test from 'node:test';
import assert from 'node:assert/strict';

import { getWelcomeAction, shouldOpenSidebarFromOverlayClick } from '../js/app/ui-shell.js';

test('getWelcomeAction maps supported action strings', () => {
  assert.equal(getWelcomeAction('scroll-task-nav'), 'scroll-task-nav');
  assert.equal(getWelcomeAction('open-all-chapters'), 'open-all-chapters');
  assert.equal(getWelcomeAction('unknown'), null);
});

test('shouldOpenSidebarFromOverlayClick only closes for sidebar overlay background', () => {
  const sidebar = { id: 'sidebar' };
  assert.equal(shouldOpenSidebarFromOverlayClick(sidebar, sidebar), true);
  assert.equal(shouldOpenSidebarFromOverlayClick({ id: 'child' }, sidebar), false);
});
