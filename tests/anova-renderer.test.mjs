import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseNumericAttribute, calculateAnovaSummary } from '../js/viz/hypothesis-remaining.js';

const hypothesisRemaining = readFileSync(new URL('../js/viz/hypothesis-remaining.js', import.meta.url), 'utf8');

test('parseNumericAttribute accepts comma-separated and JSON array formats used by stat-viz HTML', () => {
  assert.deepEqual(parseNumericAttribute('83.3,106.7,116.7'), [83.3, 106.7, 116.7]);
  assert.deepEqual(parseNumericAttribute('[83.3,106.7,116.7]'), [83.3, 106.7, 116.7]);
  assert.deepEqual(parseNumericAttribute('', [1, 2]), [1, 2]);
});

test('calculateAnovaSummary returns finite ANOVA terms for the chapter 14 anova card', () => {
  const summary = calculateAnovaSummary({
    means: [83.3, 106.7, 116.7],
    sds: [20.2, 23.1, 39.1],
    ns: [9, 9, 9],
  });

  assert.equal(summary.k, 3);
  assert.equal(summary.dfWithin, 24);
  assert.ok(Number.isFinite(summary.Fstat));
  assert.ok(summary.Fstat > 2.5 && summary.Fstat < 3.5);
  assert.ok(summary.ssBetween > 0);
  assert.ok(summary.ssWithin > 0);
});

test('renderANOVA uses visible jStat guard and supports non-JSON chapter attributes', () => {
  assert.match(hypothesisRemaining, /function renderANOVA\(el\)[\s\S]*ensureJStat\(el\)/);
  assert.match(hypothesisRemaining, /parseNumericAttribute\(el\.dataset\.means/);
  assert.match(hypothesisRemaining, /parseNumericAttribute\(el\.dataset\.sds/);
  assert.match(hypothesisRemaining, /parseNumericAttribute\(el\.dataset\.ns/);
});

test('renderFactorialInteraction handles malformed means without throwing through raw JSON.parse', () => {
  const interactionStart = hypothesisRemaining.indexOf('function renderFactorialInteraction');
  const interactionEnd = hypothesisRemaining.indexOf("registerViz('interaction'", interactionStart);
  const interactionSource = hypothesisRemaining.slice(interactionStart, interactionEnd);

  assert.match(interactionSource, /try\s*{/);
  assert.match(interactionSource, /catch\s*\(/);
  assert.doesNotMatch(interactionSource, /const means = el\.dataset\.means \? JSON\.parse/);
});
