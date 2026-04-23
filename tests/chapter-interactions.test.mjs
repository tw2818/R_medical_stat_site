import test from 'node:test';
import assert from 'node:assert/strict';

import { findCodeBlockText, ensureDetailsHaveSummary, createCalloutController } from '../js/app/chapter-interactions.js';

test('findCodeBlockText prefers nested code content when available', () => {
  const button = {
    closest() {
      return {
        querySelector(selector) {
          if (selector === 'pre') {
            return {
              tagName: 'PRE',
              textContent: 'fallback-pre',
              querySelector(inner) {
                if (inner === 'code') return { textContent: 'nested-code' };
                return null;
              },
            };
          }
          return null;
        },
      };
    },
    nextElementSibling: null,
  };

  assert.equal(findCodeBlockText(button), 'nested-code');
});

test('findCodeBlockText falls back to adjacent pre text', () => {
  const button = {
    closest() { return null; },
    nextElementSibling: {
      tagName: 'PRE',
      textContent: 'adjacent-pre',
      querySelector() { return null; },
    },
  };

  assert.equal(findCodeBlockText(button), 'adjacent-pre');
});

test('ensureDetailsHaveSummary inserts default summary when missing', () => {
  const inserted = [];
  const detail = {
    firstChild: { nodeName: 'DIV' },
    querySelector(selector) {
      return selector === 'summary' ? null : null;
    },
    insertBefore(node, firstChild) {
      inserted.push({ node, firstChild });
    },
  };
  const documentStub = {
    createElement(tag) {
      return { tagName: tag.toUpperCase(), textContent: '' };
    },
  };

  ensureDetailsHaveSummary([detail], documentStub);

  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].node.tagName, 'SUMMARY');
  assert.equal(inserted[0].node.textContent, '详情');
});

test('createCalloutController toggles collapsed state and arrow text', () => {
  let collapsed = true;
  const listeners = [];
  const callout = {
    classList: {
      add(cls) { if (cls === 'callout-collapsed') collapsed = true; },
      toggle(cls) { if (cls === 'callout-collapsed') collapsed = !collapsed; },
      contains(cls) { return cls === 'callout-collapsed' ? collapsed : false; },
    },
  };
  const header = {
    appended: [],
    appendChild(node) { this.appended.push(node); },
    addEventListener(event, handler) { listeners.push({ event, handler }); },
  };
  const documentStub = {
    createElement() {
      return { className: '', textContent: '', style: {} };
    },
  };

  const toggle = createCalloutController(callout, header, documentStub);

  assert.equal(toggle.textContent, '▶');
  assert.equal(listeners.length, 1);
  listeners[0].handler();
  assert.equal(toggle.textContent, '▼');
  listeners[0].handler();
  assert.equal(toggle.textContent, '▶');
});
