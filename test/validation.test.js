import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresenceDuplicate } from '../js/utils/validation.js';

test('detecta presença duplicada da mesma turma no mesmo dia', () => {
    const lista = [{ prof: 'Carlos Lima', turma: '2º B', data: '2026-11-18' }];
    assert.equal(isPresenceDuplicate(lista, {
        prof: 'Carlos Lima',
        turma: '2º B',
        data: '2026-11-18'
    }), true);
});

test('permite presença quando muda o professor, turma ou data', () => {
    const lista = [{ prof: 'Carlos Lima', turma: '2º B', data: '2026-11-18' }];
    assert.equal(isPresenceDuplicate(lista, {
        prof: 'Renata Alves',
        turma: '2º B',
        data: '2026-11-18'
    }), false);
    assert.equal(isPresenceDuplicate(lista, {
        prof: 'Carlos Lima',
        turma: '3º A',
        data: '2026-11-18'
    }), false);
});
