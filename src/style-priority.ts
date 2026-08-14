const importantSuffix = /\s*!important\s*$/i

export function stripImportant(value: string) {
  return value.replace(importantSuffix, '').trim()
}

export function readStylePriority(value: string) {
  return {
    value: stripImportant(value),
    priority: importantSuffix.test(value) ? 'important' : ''
  } as const
}

export function markImportant(value: string) {
  const cleanValue = stripImportant(value)
  return cleanValue ? `${cleanValue} !important` : ''
}
