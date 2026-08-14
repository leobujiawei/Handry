export type DimensionProperty = 'width' | 'height'

export function readAspectRatio(width: string | number, height: string | number) {
  const parsedWidth = typeof width === 'number' ? width : Number.parseFloat(width)
  const parsedHeight = typeof height === 'number' ? height : Number.parseFloat(height)
  if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) return null
  return parsedWidth / parsedHeight
}

function pixelValue(value: number) {
  return `${Number(value.toFixed(3))}px`
}

export function proportionalDimensionStyles(property: DimensionProperty, rawValue: string, ratio: number | null) {
  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) return { [property]: rawValue }
  const value = Number.parseFloat(rawValue)
  if (!Number.isFinite(value)) return { [property]: rawValue }
  return property === 'width'
    ? { width: rawValue, height: pixelValue(value / ratio) }
    : { width: pixelValue(value * ratio), height: rawValue }
}
