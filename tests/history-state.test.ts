import assert from 'node:assert/strict'
import test from 'node:test'
import { recordTimeline, redoTimeline, undoTimeline, type Timeline } from '../src/history-state.ts'

type State = { value: number; pendingSave: number }

test('undo and redo restore visual and pending-save state together', () => {
  let timeline: Timeline<State> = { past: [], future: [] }
  timeline = recordTimeline(timeline, { before: { value: 10, pendingSave: 10 }, after: { value: 20, pendingSave: 20 } }, false)
  const undone = undoTimeline(timeline)
  assert.deepEqual(undone?.snapshot, { value: 10, pendingSave: 10 })
  const redone = redoTimeline(undone!)
  assert.deepEqual(redone?.snapshot, { value: 20, pendingSave: 20 })
})

test('a new edit after undo clears the forward stack', () => {
  const first = recordTimeline<State>({ past: [], future: [] }, { before: { value: 0, pendingSave: 0 }, after: { value: 1, pendingSave: 1 } }, false)
  const undone = undoTimeline(first)!
  const branched = recordTimeline(undone, { before: undone.snapshot, after: { value: 2, pendingSave: 2 } }, false)
  assert.equal(branched.future.length, 0)
  assert.deepEqual(branched.past.at(-1)?.after, { value: 2, pendingSave: 2 })
})

test('continuous input replaces one history entry instead of adding many', () => {
  let timeline: Timeline<State> = { past: [], future: [] }
  timeline = recordTimeline(timeline, { before: { value: 0, pendingSave: 0 }, after: { value: 1, pendingSave: 1 } }, false)
  timeline = recordTimeline(timeline, { before: { value: 0, pendingSave: 0 }, after: { value: 25, pendingSave: 25 } }, true)
  assert.equal(timeline.past.length, 1)
  assert.deepEqual(undoTimeline(timeline)?.snapshot, { value: 0, pendingSave: 0 })
})

test('corner radius undo and redo restore preview and save values together', () => {
  type RadiusState = { preview: Record<string, string>; pendingSave: Record<string, string> }
  const before: RadiusState = { preview: { 'border-radius': '8px' }, pendingSave: { 'border-radius': '8px' } }
  const after: RadiusState = {
    preview: {
      'border-top-left-radius': '4px',
      'border-top-right-radius': '8px',
      'border-bottom-left-radius': '12px',
      'border-bottom-right-radius': '16px'
    },
    pendingSave: {
      'border-top-left-radius': '4px',
      'border-top-right-radius': '8px',
      'border-bottom-left-radius': '12px',
      'border-bottom-right-radius': '16px'
    }
  }
  const timeline = recordTimeline<RadiusState>({ past: [], future: [] }, { before, after }, false)
  const undone = undoTimeline(timeline)!
  assert.deepEqual(undone.snapshot, before)
  assert.deepEqual(redoTimeline(undone)?.snapshot, after)
})

test('fill and stroke are separate global history entries', () => {
  type PaintHistory = { styles: Record<string, string> }
  const original: PaintHistory = { styles: { 'background-color': '#ffffff', 'border-width': '0px' } }
  const filled: PaintHistory = { styles: { 'background-color': '#3157d5', 'border-width': '0px' } }
  const stroked: PaintHistory = { styles: { 'background-color': '#3157d5', 'border-width': '4px' } }
  let timeline: Timeline<PaintHistory> = { past: [], future: [] }
  timeline = recordTimeline(timeline, { before: original, after: filled }, false)
  timeline = recordTimeline(timeline, { before: filled, after: stroked }, false)

  const undoStroke = undoTimeline(timeline)!
  assert.deepEqual(undoStroke.snapshot, filled)
  const undoFill = undoTimeline(undoStroke)!
  assert.deepEqual(undoFill.snapshot, original)
})

test('page background participates in undo and redo with its pending save state', () => {
  type PageHistory = { preview: string; dirty: Record<string, string> }
  const before: PageHistory = { preview: '#ffffff', dirty: {} }
  const after: PageHistory = { preview: '#3157d5', dirty: { 'body:nth-of-type(1)': '#3157d5' } }
  const timeline = recordTimeline<PageHistory>({ past: [], future: [] }, { before, after }, false)
  const undone = undoTimeline(timeline)!

  assert.deepEqual(undone.snapshot, before)
  assert.deepEqual(redoTimeline(undone)?.snapshot, after)
})
