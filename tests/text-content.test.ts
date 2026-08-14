import assert from 'node:assert/strict'
import test from 'node:test'
import { hasUnambiguousTextContent } from '../src/text-content.ts'

test('a single direct text node is unambiguous', () => {
  assert.equal(hasUnambiguousTextContent(['Hello'], 0), true)
})

test('multiple direct text nodes are ambiguous', () => {
  assert.equal(hasUnambiguousTextContent(['Hello', 'World'], 0), false)
})

test('mixed text and child elements are ambiguous', () => {
  assert.equal(hasUnambiguousTextContent(['Start learning'], 1), false)
})

test('a container with only child elements is not a text target', () => {
  assert.equal(hasUnambiguousTextContent([], 4), false)
})
