import test from 'node:test';
import assert from 'node:assert/strict';

import { parseChapterMainContent, removeChapterScripts, removeBreadcrumbs } from '../js/app/chapter-dom.js';

test('parseChapterMainContent extracts quarto main innerHTML', () => {
  const parser = {
    parseFromString() {
      return {
        getElementById(id) {
          assert.equal(id, 'quarto-document-content');
          return {
            innerHTML: '<p>Hello</p>',
            querySelectorAll() { return []; },
          };
        },
      };
    },
  };
  assert.equal(parseChapterMainContent('<html></html>', parser), '<p>Hello</p>');
});

test('parseChapterMainContent throws when main content missing', () => {
  const parser = {
    parseFromString() {
      return { getElementById() { return null; } };
    },
  };
  assert.throws(() => parseChapterMainContent('<html></html>', parser), /无法解析章节内容/);
});

test('removeChapterScripts removes all script nodes from main element', () => {
  let removed = 0;
  const main = {
    querySelectorAll(selector) {
      assert.equal(selector, 'script');
      return [{ remove() { removed += 1; } }, { remove() { removed += 1; } }];
    },
  };
  removeChapterScripts(main);
  assert.equal(removed, 2);
});

test('removeBreadcrumbs removes quarto breadcrumb nodes', () => {
  let removed = 0;
  const container = {
    querySelectorAll(selector) {
      assert.equal(selector, '.quarto-page-breadcrumbs');
      return [{ remove() { removed += 1; } }];
    },
  };
  removeBreadcrumbs(container);
  assert.equal(removed, 1);
});
