import assert from 'node:assert/strict'
import test from 'node:test'
import { displayFileName } from '../src/path-display.ts'

test('displays the file name for Unix and Windows paths', () => {
  assert.equal(displayFileName('/Users/example/project/index.html'), 'index.html')
  assert.equal(displayFileName('C:\\Users\\example\\project\\index.html'), 'index.html')
  assert.equal(displayFileName('index.html'), 'index.html')
})
