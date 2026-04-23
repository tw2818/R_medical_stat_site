import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldCloseLightboxOnClick, shouldCloseLightboxOnEscape, shouldOpenLightboxForTarget } from '../js/app/lightbox.js';

test('shouldCloseLightboxOnClick closes for overlay click or close button', () => {
  const overlay = { id: 'overlay' };
  assert.equal(shouldCloseLightboxOnClick(overlay, overlay), true);
  assert.equal(shouldCloseLightboxOnClick({ classList: { contains: cls => cls === 'lightbox-close' } }, overlay), true);
  assert.equal(shouldCloseLightboxOnClick({ classList: { contains: () => false } }, overlay), false);
});

test('shouldCloseLightboxOnEscape only closes when overlay is shown and key is Escape', () => {
  const overlay = { classList: { contains: cls => cls === 'show' } };
  assert.equal(shouldCloseLightboxOnEscape({ key: 'Escape' }, overlay), true);
  assert.equal(shouldCloseLightboxOnEscape({ key: 'Enter' }, overlay), false);
});

test('shouldOpenLightboxForTarget requires image inside chapter content', () => {
  const target = { tag: 'img' };
  const event = {
    target: {
      closest(selector) {
        return selector === '#chapter-content img' ? target : null;
      },
    },
  };
  assert.equal(shouldOpenLightboxForTarget(event), target);
  assert.equal(shouldOpenLightboxForTarget({ target: { closest: () => null } }), null);
});
