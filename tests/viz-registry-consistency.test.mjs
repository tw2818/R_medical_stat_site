import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function collectRegisteredTypes() {
  const vizDir = join(root, 'js/viz');
  const registered = new Set();
  for (const file of readdirSync(vizDir).filter(name => name.endsWith('.js'))) {
    const text = readFileSync(join(vizDir, file), 'utf8');
    for (const match of text.matchAll(/registerViz\(['"]([^'"]+)['"]/g)) {
      registered.add(match[1]);
    }
  }
  return registered;
}

function collectRegistrations() {
  const vizDir = join(root, 'js/viz');
  const registrations = [];
  for (const file of readdirSync(vizDir).filter(name => name.endsWith('.js'))) {
    const text = readFileSync(join(vizDir, file), 'utf8');
    for (const match of text.matchAll(/registerViz\(['"]([^'"]+)['"]\s*,\s*([A-Za-z0-9_$]+)/g)) {
      registrations.push({ type: match[1], fn: match[2], file });
    }
  }
  return registrations;
}

function collectUsedTypes() {
  const dataDir = join(root, 'data');
  const used = new Set();
  for (const file of readdirSync(dataDir).filter(name => name.endsWith('.html'))) {
    const text = readFileSync(join(dataDir, file), 'utf8');
    for (const match of text.matchAll(/class=["'][^"']*stat-(?:viz|calc)[^"']*["'][^>]*data-type=["']([^"']+)["']/g)) {
      used.add(match[1]);
    }
  }
  return used;
}

function collectReferencedTypes() {
  const referenced = new Set();
  const files = [
    ...readdirSync(join(root, 'data')).filter(name => name.endsWith('.html')).map(name => join(root, 'data', name)),
    ...readdirSync(join(root, 'js')).filter(name => name.endsWith('.js')).map(name => join(root, 'js', name)),
    ...readdirSync(join(root, 'js/viz')).filter(name => name.endsWith('.js')).map(name => join(root, 'js/viz', name)),
  ];

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/data-type=\\?["']([^\\"']+)\\?["']/g)) {
      referenced.add(match[1]);
    }
  }
  return referenced;
}

test('stat-viz registry has no duplicate type registrations', () => {
  const registrations = collectRegistrations();
  const duplicates = registrations
    .filter((registration, index, all) => all.findIndex(item => item.type === registration.type) !== index)
    .map(registration => registration.type)
    .sort();

  assert.deepEqual(duplicates, []);
});

test('every stat-viz/stat-calc data-type used in chapters has a registered renderer', () => {
  const registered = collectRegisteredTypes();
  const used = collectUsedTypes();
  const missing = [...used].filter(type => !registered.has(type)).sort();

  assert.deepEqual(missing, []);
});

test('registered stat-viz types are referenced by chapter HTML or dynamic injectors', () => {
  const registered = collectRegisteredTypes();
  const referenced = collectReferencedTypes();
  const orphaned = [...registered].filter(type => !referenced.has(type)).sort();

  assert.deepEqual(orphaned, []);
});

test('poisson renderer is registered and guarded by jStat availability check', () => {
  const distributions = read('js/viz/distributions.js');

  assert.match(distributions, /registerViz\(['"]poisson['"],\s*renderPoisson\)/);
  assert.match(distributions, /function renderPoisson\(el\)\s*{\s*if \(!ensureJStat\(el\)\) return;/);
});

test('jStat-dependent visualization renderers guard against missing jStat', () => {
  assert.match(read('js/viz/visualization.js'), /function renderHistogram\(el\)\s*{\s*if \(!ensureJStat\(el\)\) return;/);
  assert.match(read('js/viz/clinical-models.js'), /function renderROC\(el\)\s*{\s*if \(!ensureJStat\(el\)\) return;/);
  assert.match(read('js/viz/clinical-models.js'), /function renderROCCompare\(el\)\s*{\s*if \(!ensureJStat\(el\)\) return;/);
});

test('unknown stat-viz types render a visible error card instead of silent no-op', () => {
  const core = read('js/viz/_core.js');

  assert.match(core, /未注册的统计组件/);
  assert.match(core, /viz-error/);
});
