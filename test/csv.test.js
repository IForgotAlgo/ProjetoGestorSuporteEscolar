import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvValue } from '../js/utils/csv.js';

test('escape aspas em valores CSV', () => {
    assert.equal(escapeCsvValue('Professor "Teste"'), '"Professor ""Teste"""');
});

test('neutraliza formulas iniciadas por operadores', () => {
    assert.equal(escapeCsvValue('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');
    assert.equal(escapeCsvValue('@comando'), '"\'@comando"');
});
