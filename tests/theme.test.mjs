import test from 'node:test';
import assert from 'node:assert/strict';

import { initTheme, toggleTheme, updateThemeToggle } from '../js/app/theme.js';

function createRoot(initialTheme = null) {
  let theme = initialTheme;
  return {
    getAttribute(name) {
      if (name === 'data-theme') return theme;
      return null;
    },
    setAttribute(name, value) {
      if (name === 'data-theme') theme = value;
    },
    removeAttribute(name) {
      if (name === 'data-theme') theme = null;
    },
  };
}

function createButton() {
  return {
    textContent: '',
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
}

function createStorage(savedTheme = null) {
  const data = new Map();
  if (savedTheme !== null) data.set('rstat_theme', savedTheme);
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
  };
}

test('initTheme restores dark theme from storage and updates button label', () => {
  const root = createRoot();
  const button = createButton();
  const storage = createStorage('dark');

  initTheme({ root, button, storage });

  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(button.textContent, '🌙');
  assert.equal(button.attrs['aria-label'], '切换浅色模式');
});

test('toggleTheme switches dark mode off and persists light preference', () => {
  const root = createRoot('dark');
  const button = createButton();
  const storage = createStorage('dark');

  toggleTheme({ root, button, storage });

  assert.equal(root.getAttribute('data-theme'), null);
  assert.equal(storage.getItem('rstat_theme'), 'light');
  assert.equal(button.textContent, '☀️');
  assert.equal(button.attrs['aria-label'], '切换深色模式');
});

test('updateThemeToggle leaves safely when button is missing', () => {
  const root = createRoot();
  assert.doesNotThrow(() => updateThemeToggle({ root, button: null }));
});
