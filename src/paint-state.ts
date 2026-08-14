const stripPriority = (value: string) => value.replace(/\s*!important\s*$/i, '').trim()

export type PaintState = {
  backgroundColor: string
  backgroundImage: string
  fillEnabled: boolean
  borderColor: string
  borderStyle: string
  borderWidth: string
  strokeEnabled: boolean
}

export function isTransparentPaint(value: string) {
  const color = stripPriority(value).toLowerCase()
  return color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'rgb(0 0 0 / 0)' || color === 'rgba(0,0,0,0)'
}

export function resolvePaintState(base: Record<string, string>, pending: Record<string, string>): PaintState {
  const value = (property: string, fallbackProperty = property) => pending[property] ?? base[fallbackProperty] ?? ''
  const backgroundColor = value('background-color')
  const backgroundImage = value('background-image')
  const visibleSide = ['top', 'right', 'bottom', 'left'].find(side => {
    const style = stripPriority(base[`border-${side}-style`] ?? '')
    const width = Number.parseFloat(stripPriority(base[`border-${side}-width`] ?? ''))
    return style !== 'none' && width > 0
  }) ?? 'top'
  const borderColor = value('border-color', `border-${visibleSide}-color`)
  const borderStyle = value('border-style', `border-${visibleSide}-style`)
  const borderWidth = value('border-width', `border-${visibleSide}-width`)
  return {
    backgroundColor,
    backgroundImage,
    fillEnabled: stripPriority(backgroundImage) !== 'none' || !isTransparentPaint(backgroundColor),
    borderColor,
    borderStyle,
    borderWidth,
    strokeEnabled: stripPriority(borderStyle) !== 'none' && Number.parseFloat(stripPriority(borderWidth)) > 0
  }
}
