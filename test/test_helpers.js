/**
 * Lightweight Test Harness & Assertion Library for CampingTrip E2E Test Suite
 * Supports Tier 1 (Feature), Tier 2 (Boundary), Tier 3 (Pairwise), Tier 4 (Scenario)
 */

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }

  /**
   * Register a test case
   * @param {string} description Test description
   * @param {number} tier Tier number (1, 2, 3, or 4)
   * @param {Function} fn Test execution function
   */
  test(description, tier, fn) {
    if (typeof tier === 'function') {
      fn = tier;
      tier = 1;
    }
    this.tests.push({ description, tier, fn });
  }

  async run() {
    this.results = [];
    for (const t of this.tests) {
      const start = Date.now();
      try {
        await t.fn();
        this.results.push({
          description: t.description,
          tier: t.tier,
          passed: true,
          duration: Date.now() - start,
          error: null
        });
      } catch (err) {
        this.results.push({
          description: t.description,
          tier: t.tier,
          passed: false,
          duration: Date.now() - start,
          error: err
        });
      }
    }
    return this.results;
  }
}

// Assertions
const assert = (condition, message = 'Assertion failed') => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(message || `Expected [${expected}] (${typeof expected}) but got [${actual}] (${typeof actual})`);
  }
};

const assertNotEqual = (actual, expected, message) => {
  if (actual === expected) {
    throw new Error(message || `Expected value not to equal [${expected}]`);
  }
};

const assertDeepEqual = (actual, expected, message) => {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Deep equality failed:\nActual: ${actualStr}\nExpected: ${expectedStr}`);
  }
};

const assertCloseTo = (actual, expected, delta = 0.01, message) => {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(message || `Expected ${actual} to be close to ${expected} within ±${delta} (diff: ${Math.abs(actual - expected)})`);
  }
};

const assertInRange = (value, min, max, message) => {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be in range [${min}, ${max}]`);
  }
};

const assertMatch = (str, pattern, message) => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  if (!regex.test(str)) {
    throw new Error(message || `Expected "${str}" to match pattern ${regex}`);
  }
};

const assertType = (value, type, message) => {
  if (typeof value !== type) {
    throw new Error(message || `Expected type "${type}" but got "${typeof value}"`);
  }
};

const assertArray = (value, minLength = 0, message) => {
  if (!Array.isArray(value) || value.length < minLength) {
    throw new Error(message || `Expected array with at least ${minLength} items, got ${Array.isArray(value) ? value.length : typeof value}`);
  }
};

const assertThrows = (fn, expectedErrMsg) => {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    if (expectedErrMsg && !err.message.includes(expectedErrMsg)) {
      throw new Error(`Expected error message containing "${expectedErrMsg}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new Error('Expected function to throw an error, but it succeeded');
  }
};

module.exports = {
  TestSuite,
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertCloseTo,
  assertInRange,
  assertMatch,
  assertType,
  assertArray,
  assertThrows
};
