import assert from 'node:assert/strict'
import test from 'node:test'
import { proportionalDimensionStyles, readAspectRatio } from '../src/aspect-ratio.ts'

test('reads a valid aspect ratio from CSS pixel values', () => {
  assert.equal(readAspectRatio('320px', '180px'), 16 / 9)
  assert.equal(readAspectRatio('0px', '180px'), null)
})

test('changing width updates height with the locked ratio', () => {
  assert.deepEqual(proportionalDimensionStyles('width', '640px', 16 / 9), {
    width: '640px',
    height: '360px'
  })
})

test('changing height updates width with the locked ratio', () => {
  assert.deepEqual(proportionalDimensionStyles('height', '225px', 16 / 9), {
    width: '400px',
    height: '225px'
  })
})

test('keeps the edited dimension when no valid ratio is available', () => {
  assert.deepEqual(proportionalDimensionStyles('width', '240px', null), { width: '240px' })
})
