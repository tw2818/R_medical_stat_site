#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function validateCaseShape(testCase, index) {
  const prefix = `case[${index}]${testCase.id ? ` (${testCase.id})` : ''}`;
  if (!testCase.id || typeof testCase.id !== 'string') {
    fail(`${prefix}: missing string id`);
    return false;
  }
  if (!testCase.component || typeof testCase.component !== 'string') {
    fail(`${prefix}: missing string component`);
    return false;
  }
  if (!testCase.input || typeof testCase.input !== 'object') {
    fail(`${prefix}: missing input object`);
    return false;
  }
  if (!testCase.expected || typeof testCase.expected !== 'object') {
    fail(`${prefix}: missing expected object`);
    return false;
  }
  return true;
}

function validateTTestCase(testCase) {
  if (testCase.mode === 'one-sample') {
    const sample = testCase.input.sample;
    const mu0 = testCase.input.mu0;
    if (!Array.isArray(sample) || sample.length < 2 || !sample.every(isNumber)) {
      fail(`${testCase.id}: one-sample t-test requires numeric sample length >= 2`);
      return;
    }
    if (!isNumber(mu0)) {
      fail(`${testCase.id}: one-sample t-test requires numeric mu0`);
      return;
    }
    const m = mean(sample);
    const expectedN = testCase.expected.n;
    if (expectedN != null && expectedN !== sample.length) {
      fail(`${testCase.id}: expected n=${expectedN} but sample length is ${sample.length}`);
    } else {
      ok(`${testCase.id}: sample size matches expected n`);
    }
    if (typeof testCase.expected.xbar_approx === 'number') {
      const diff = Math.abs(m - testCase.expected.xbar_approx);
      if (diff > 1e-6) {
        fail(`${testCase.id}: mean mismatch, computed ${m}, expected ${testCase.expected.xbar_approx}`);
      } else {
        ok(`${testCase.id}: sample mean matches expected baseline`);
      }
    }
  }

  if (testCase.mode === 'two-sample-welch') {
    const g1 = testCase.input.group1;
    const g2 = testCase.input.group2;
    if (!Array.isArray(g1) || !Array.isArray(g2) || g1.length < 2 || g2.length < 2) {
      fail(`${testCase.id}: Welch test requires two numeric groups length >= 2`);
      return;
    }
    if (![...g1, ...g2].every(isNumber)) {
      fail(`${testCase.id}: Welch test groups must be numeric`);
      return;
    }
    ok(`${testCase.id}: Welch input shape valid`);
  }
}

function validateChisqCase(testCase) {
  const table = testCase.input.table;
  if (!Array.isArray(table) || table.length < 2 || !table.every(row => Array.isArray(row) && row.length >= 2 && row.every(isNumber))) {
    fail(`${testCase.id}: chi-square case must provide numeric matrix at least 2x2`);
    return;
  }
  ok(`${testCase.id}: contingency table shape valid`);
}

function validateKruskalCase(testCase) {
  const groups = testCase.input.groups;
  if (!groups || typeof groups !== 'object') {
    fail(`${testCase.id}: Kruskal case requires groups object`);
    return;
  }
  const values = Object.values(groups);
  if (values.length < 2 || values.some(arr => !Array.isArray(arr) || arr.length < 2 || !arr.every(isNumber))) {
    fail(`${testCase.id}: Kruskal groups must be numeric arrays length >= 2`);
    return;
  }
  ok(`${testCase.id}: Kruskal input groups valid`);
}

function validateFriedmanCase(testCase) {
  const blocks = testCase.input.blocks;
  if (!Array.isArray(blocks) || blocks.length < 2) {
    fail(`${testCase.id}: Friedman case requires block matrix`);
    return;
  }
  const width = blocks[0]?.length;
  if (!width || blocks.some(row => !Array.isArray(row) || row.length !== width || !row.every(isNumber))) {
    fail(`${testCase.id}: Friedman blocks must be rectangular numeric matrix`);
    return;
  }
  ok(`${testCase.id}: Friedman block matrix valid`);
}

function validateSurvivalCase(testCase) {
  if (!testCase.expected.step_function_monotone) {
    warn(`${testCase.id}: no monotonicity invariant declared`);
  } else {
    ok(`${testCase.id}: survival invariant declared`);
  }
}

function main() {
  const filePath = path.join(__dirname, 'stat_calculator_cases.json');
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${filePath}`);
    process.exit(process.exitCode || 1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON: ${error.message}`);
    process.exit(process.exitCode || 1);
  }

  if (!parsed || !Array.isArray(parsed.cases)) {
    fail('Top-level `cases` array is missing');
    process.exit(process.exitCode || 1);
  }

  ok(`Loaded ${parsed.cases.length} validation cases`);

  const seenIds = new Set();
  parsed.cases.forEach((testCase, index) => {
    if (!validateCaseShape(testCase, index)) return;
    if (seenIds.has(testCase.id)) {
      fail(`${testCase.id}: duplicate id`);
      return;
    }
    seenIds.add(testCase.id);

    switch (testCase.component) {
      case 'ttest':
        validateTTestCase(testCase);
        break;
      case 'chisq':
        validateChisqCase(testCase);
        break;
      case 'kruskal':
        validateKruskalCase(testCase);
        break;
      case 'friedman':
        validateFriedmanCase(testCase);
        break;
      case 'survival':
        validateSurvivalCase(testCase);
        break;
      default:
        warn(`${testCase.id}: no specialized validator for component ${testCase.component}`);
    }
  });

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\nValidation finished with errors.');
    process.exit(process.exitCode);
  }

  console.log('\nValidation finished successfully.');
}

main();
