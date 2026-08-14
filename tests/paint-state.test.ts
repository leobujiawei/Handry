import assert from 'node:assert/strict'
import test from 'node:test'
import { isTransparentPaint, resolvePaintState } from '../src/paint-state.ts'

test('pending paint values consistently override the originally selected styles', () => {
  const state = resolvePaintState({
    'background-color': 'rgb(255, 0, 0)',
    'background-image': 'none',
    'border-top-color': 'rgb(0, 0, 0)',
    'border-top-style': 'none',
    'border-top-width': '0px'
  }, {
    'background-color': '#00ff00 !important',
    'border-color': '#0000ff !important',
    'border-style': 'solid !important',
    'border-width': '4px !important'
  })

  assert.equal(state.backgroundColor, '#00ff00 !important')
  assert.equal(state.borderColor, '#0000ff !important')
  assert.equal(state.borderWidth, '4px !important')
  assert.equal(state.fillEnabled, true)
  assert.equal(state.strokeEnabled, true)
})

test('transparent pending fill and disabled pending stroke win over base paint', () => {
  const state = resolvePaintState({
    'background-color': '#ffffff',
    'background-image': 'linear-gradient(90deg, #000, #fff)',
    'border-top-color': '#222222',
    'border-top-style': 'solid',
    'border-top-width': '2px'
  }, {
    'background-color': 'rgba(0, 0, 0, 0) !important',
    'background-image': 'none !important',
    'border-style': 'none !important',
    'border-width': '0px !important'
  })

  assert.equal(state.fillEnabled, false)
  assert.equal(state.strokeEnabled, false)
  assert.equal(isTransparentPaint(state.backgroundColor), true)
})

test('a visible side border is used when the top border is absent', () => {
  const state = resolvePaintState({
    'background-color': 'transparent',
    'background-image': 'none',
    'border-top-color': 'rgb(0, 0, 0)',
    'border-top-style': 'none',
    'border-top-width': '0px',
    'border-bottom-color': 'rgb(65, 110, 234)',
    'border-bottom-style': 'solid',
    'border-bottom-width': '3px'
  }, {})

  assert.equal(state.borderColor, 'rgb(65, 110, 234)')
  assert.equal(state.borderStyle, 'solid')
  assert.equal(state.borderWidth, '3px')
  assert.equal(state.strokeEnabled, true)
})
