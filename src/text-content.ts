export function hasUnambiguousTextContent(textValues: string[], childElementCount: number) {
  const meaningfulTextNodes = textValues.filter(value => value.trim().length > 0)
  return childElementCount === 0 && meaningfulTextNodes.length === 1
}
