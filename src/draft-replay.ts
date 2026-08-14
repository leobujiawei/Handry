export type DraftColorGroup = {
  value: string
  uses: Array<{ selector: string; sourceSelector?: string; properties: string[] }>
}

export type DraftReplayItem = {
  selector: string
  styles: Record<string, string>
  textContent?: string
  elementKind: 'image' | 'svg' | 'other'
  imageUrl?: string
  svgCode?: string
  colorChanges: Record<string, string>
  colorGroups: DraftColorGroup[]
}

export type DraftReplayCommand = { channel: string; value?: unknown }

export function buildDraftReplayCommands(items: DraftReplayItem[]): DraftReplayCommand[] {
  if (!items.length) return []
  const commands: DraftReplayCommand[] = []
  for (const item of items) {
    commands.push({ channel: 'select-source', value: item.selector })
    commands.push({ channel: 'set-linked', value: false })
    if (item.elementKind === 'svg' && item.svgCode !== undefined) commands.push({ channel: 'apply-svg-code', value: item.svgCode })
    if (Object.keys(item.styles).length) commands.push({ channel: 'apply-style', value: item.styles })
    if (item.elementKind === 'image' && item.imageUrl !== undefined) commands.push({ channel: 'apply-image-url', value: item.imageUrl })
    if (item.textContent !== undefined) commands.push({ channel: 'apply-text', value: item.textContent })
    for (const [originalColor, color] of Object.entries(item.colorChanges)) {
      const uses = item.colorGroups.find(group => group.value === originalColor)?.uses
      if (uses) commands.push({ channel: 'apply-color-group', value: { uses, color } })
    }
  }
  commands.push({ channel: 'clear-selection' })
  return commands
}
