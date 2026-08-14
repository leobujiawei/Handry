import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDraftReplayCommands } from '../src/draft-replay.ts'

test('rebuilds every unsaved edit when returning to an HTML tab', () => {
  const commands = buildDraftReplayCommands([
    {
      selector: 'main:nth-of-type(1) > div#card',
      styles: { width: '320px', 'border-radius': '18px' },
      textContent: '未保存文案',
      elementKind: 'other',
      colorChanges: {},
      colorGroups: []
    },
    {
      selector: 'main:nth-of-type(1) > img:nth-of-type(1)',
      styles: { width: '96px' },
      imageUrl: 'images/draft.png',
      elementKind: 'image',
      colorChanges: {},
      colorGroups: []
    }
  ])
  assert.equal(commands.filter(command => command.channel === 'select-source').length, 2)
  assert.equal(commands.filter(command => command.channel === 'apply-style').length, 2)
  assert.deepEqual(commands.find(command => command.channel === 'apply-text')?.value, '未保存文案')
  assert.deepEqual(commands.find(command => command.channel === 'apply-image-url')?.value, 'images/draft.png')
  assert.equal(commands.at(-1)?.channel, 'clear-selection')
})

test('does not create replay work for a clean tab', () => {
  assert.deepEqual(buildDraftReplayCommands([]), [])
})
