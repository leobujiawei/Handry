import assert from 'node:assert/strict'
import test from 'node:test'
import { markImportant, readStylePriority, stripImportant } from '../src/style-priority.ts'

test('reads and removes an important priority suffix', () => {
  assert.deepEqual(readStylePriority('#ffffff !important'), { value: '#ffffff', priority: 'important' })
  assert.equal(stripImportant('none !IMPORTANT'), 'none')
})

test('adds important once without duplicating the suffix', () => {
  assert.equal(markImportant('solid'), 'solid !important')
  assert.equal(markImportant('solid !important'), 'solid !important')
  assert.equal(markImportant(''), '')
})
