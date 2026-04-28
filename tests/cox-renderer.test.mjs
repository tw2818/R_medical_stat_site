import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const rendererPath = join(ROOT, 'js/viz/clinical-models.js');
const renderer = readFileSync(rendererPath, 'utf8');

const coxBody = renderer.slice(
  renderer.indexOf('function renderCoxHR'),
  renderer.indexOf("registerViz('cox'", renderer.indexOf('function renderCoxHR'))
);

test('renderCoxHR validates numeric arrays before log-scale drawing', () => {
  assert.match(renderer, /parseCoxNumberList|validateCoxRows|renderCoxError/);
  assert.match(renderer, /Number\.isFinite/);
  assert.match(renderer, />\s*0/, 'HR and CI values must be positive before Math.log');
  assert.match(renderer, /values\.length\s*={2,3}\s*lower\.length|same length|长度一致/);
  assert.match(coxBody, /validateCoxRows\(values, lower, upper, pvals\)/);
  assert.doesNotMatch(coxBody, /Math\.log\(v\)\),\s*minLog/, 'raw Math.log arrays should not define domain without validation');
});

test('renderCoxHR uses deterministic ids and escapes HTML injected from dataset', () => {
  assert.match(renderer, /coxHrCounter/);
  assert.doesNotMatch(coxBody, /Math\.random/);
  assert.match(coxBody, /escapeHtml\(/);
  assert.match(coxBody, /aria-label=/);
});

test('renderCoxHR draws readable publication-style HR forest annotations', () => {
  assert.match(coxBody, /lower\[i\]\.toFixed\(3\)/);
  assert.match(coxBody, /upper\[i\]\.toFixed\(3\)/);
  assert.match(coxBody, /95%\s*CI|95%CI|–/);
  assert.match(coxBody, /textAlign\s*=\s*'right'|measureText/, 'text labels should avoid right-edge overflow');
  assert.match(coxBody, /ctx\.moveTo\(tickX,\s*padT\)|vertical grid|网格线/);
});

test('renderCoxHR keeps log-scale bounds on the natural-log scale', () => {
  assert.match(coxBody, /Math\.exp\(minLog\)/);
  assert.match(coxBody, /Math\.exp\(maxLog\)/);
  assert.doesNotMatch(coxBody, /Math\.pow\(10,\s*minLog\)/);
  assert.doesNotMatch(coxBody, /Math\.pow\(10,\s*maxLog\)/);
  assert.match(coxBody, /maxLog\s*=\s*Math\.max\([^;]+\)\s*\+\s*0\.5/);
});
