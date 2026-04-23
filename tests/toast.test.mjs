import test from 'node:test';
import assert from 'node:assert/strict';

import { createToastLifecycle } from '../js/app/toast.js';

test('createToastLifecycle removes existing toast before showing a new one', () => {
  const events = [];
  const existing = { remove() { events.push('remove-existing'); } };
  const toast = {
    className: '',
    textContent: '',
    classList: { add(cls) { events.push(`add:${cls}`); }, remove(cls) { events.push(`remove:${cls}`); } },
    remove() { events.push('remove-toast'); },
  };
  const documentStub = {
    querySelector(selector) { assert.equal(selector, '.toast'); return existing; },
    createElement(tag) { assert.equal(tag, 'div'); return toast; },
    body: { appendChild(node) { events.push(`append:${node === toast}`); } },
  };
  const callbacks = [];
  const lifecycle = createToastLifecycle(documentStub, (fn, delay) => { callbacks.push({ fn, delay }); return fn; });

  lifecycle.show('hello');
  callbacks[0].fn();

  assert.equal(toast.textContent, 'hello');
  assert.deepEqual(events.slice(0, 3), ['remove-existing', 'append:true', 'add:show']);
  assert.deepEqual(callbacks.map(item => item.delay), [10, 2000]);
});
