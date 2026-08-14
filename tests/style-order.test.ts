import assert from 'node:assert/strict'
import test from 'node:test'
import { orderedStyleEntries } from '../src/style-order.ts'

test('linked radius clears old corners before applying the shorthand', () => {
  const entries = orderedStyleEntries({
    'border-radius': '24px',
    'border-top-left-radius': '',
    'border-top-right-radius': '',
    'border-bottom-left-radius': '',
    'border-bottom-right-radius': ''
  })
  assert.equal(entries.at(-1)?.[0], 'border-radius')
  assert.deepEqual(entries.at(-1), ['border-radius', '24px'])
})

test('independent corner overrides are applied after the linked radius', () => {
  const entries = orderedStyleEntries({
    'border-radius': '24px',
    'border-top-left-radius': '6px',
    'border-top-right-radius': ''
  })
  assert.deepEqual(entries.map(([property]) => property), [
    'border-top-right-radius',
    'border-radius',
    'border-top-left-radius'
  ])
})
