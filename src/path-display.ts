export function displayFileName(filePath: string) {
  const name = filePath.split(/[\\/]/).filter(Boolean).pop()
  return name || filePath
}
