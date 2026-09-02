import test from 'node:test';
import assert from 'node:assert/strict';
import { getClassOptions, userMatchesClass } from './classes.js';

test('class options are unique, trimmed, sorted, and include unassigned users', () => {
  const options = getClassOptions([
    { className: ' 2nd Hour ' },
    { className: '' },
    { className: '1st Hour' },
    { className: '2nd Hour' },
    {},
  ]);

  assert.deepEqual(options, ['', '1st Hour', '2nd Hour']);
});

test('class filter matches selected class and unassigned users', () => {
  assert.equal(userMatchesClass({ className: '1st Hour' }, '1st Hour'), true);
  assert.equal(userMatchesClass({ className: '2nd Hour' }, '1st Hour'), false);
  assert.equal(userMatchesClass({ className: '' }, ''), true);
  assert.equal(userMatchesClass({}, ''), true);
  assert.equal(userMatchesClass({ className: '1st Hour' }, 'all'), true);
});
