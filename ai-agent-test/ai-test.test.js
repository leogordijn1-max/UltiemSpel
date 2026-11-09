const assert = require('node:assert/strict');
const calculateDamage = require('./ai-test.js');

const tests = [
    { input: [10, 2], expected: 20 },
    { input: ['text', 2], expected: 0 },
    { input: [NaN, 2], expected: 0 },
    { input: [Infinity, 2], expected: 0 },
    { input: [5, Infinity], expected: 0 },
    { input: [5, 0], expected: 0 },
    { input: [5, -3], expected: -15 },
];

for (const { input, expected } of tests) {
    const [baseDamage, multiplier] = input;
    const result = calculateDamage(baseDamage, multiplier);
    assert.strictEqual(result, expected);
}
