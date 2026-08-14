const cornerRadiusProperties = new Set([
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius'
])

export function orderedStyleEntries(styles: Record<string, string>): Array<[string, string]> {
  const entries = Object.entries(styles)
  if (!Object.prototype.hasOwnProperty.call(styles, 'border-radius')) return entries
  const other = entries.filter(([property]) => property !== 'border-radius' && !cornerRadiusProperties.has(property))
  const corners = entries.filter(([property]) => cornerRadiusProperties.has(property))
  const clearedCorners = corners.filter(([, value]) => !value.trim())
  const overriddenCorners = corners.filter(([, value]) => value.trim())
  return [...other, ...clearedCorners, ['border-radius', styles['border-radius']], ...overriddenCorners]
}
