import { parse } from 'parse5'

export type SaveRequest = {
  filePath: string
  selector: string
  selectors?: string[]
  styles: Record<string, string>
  batchChanges?: Array<{ selector: string; styles: Record<string, string> }>
  attributes?: Record<string, string>
  replacementHtml?: string
  removeElement?: boolean
  textContent?: string
  textNodeIndex?: number
  expectedSource: string
}

function cssEscape(value: string) {
  return value.replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g, '\\$1')
}

function findSourceNode(source: string, selector: string): any | null {
  const parts = selector.split('>').map(value => value.trim())
  const document = parse(source, { sourceCodeLocationInfo: true }) as any
  const rawChildren = (node: any) => [...(node?.childNodes || []), ...(node?.content?.childNodes || [])]
  const children = (node: any) => rawChildren(node).filter((child: any) => child.tagName)
  const all = (node: any): any[] => [node, ...rawChildren(node).flatMap((child: any) => all(child))]
  let current: any = null
  for (let index = 0; index < parts.length; index++) {
    const match = /^([\w-]+)(?:#([^:]+))?(?:\:nth-of-type\((\d+)\))?$/.exec(parts[index])
    if (!match) return null
    const [, tag, id, nthRaw] = match
    const nth = Number(nthRaw || 1)
    const pool = index === 0 || current?.tagName === 'template' ? all(index === 0 ? document : current) : children(current)
    const matches = pool.filter((node: any) => node.tagName === tag && (!id || (node.attrs || []).some((attribute: any) => attribute.name === 'id' && attribute.value === id)))
    current = id ? matches[0] : matches[nth - 1]
    if (!current) return null
  }
  return current
}

function findOpeningTag(source: string, selector: string): { start: number; end: number } | null {
  const current = findSourceNode(source, selector)
  const location = current?.sourceCodeLocation?.startTag || current?.sourceCodeLocation
  return location ? { start: location.startOffset, end: location.endOffset } : null
}

export function patchStyle(source: string, selector: string, styles: Record<string, string>) {
  const location = findOpeningTag(source, selector)
  if (!location) throw new Error(`无法在源文件中安全定位元素：${selector}`)
  let tag = source.slice(location.start, location.end)
  const styleMatch = /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i.exec(tag)
  const map = new Map<string, string>()
  if (styleMatch) styleMatch[2].split(';').forEach(declaration => {
    const colon = declaration.indexOf(':')
    if (colon > 0) map.set(declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim())
  })
  // Move edited declarations to the end so they win over earlier shorthand/longhand rules.
  Object.entries(styles).forEach(([property, value]) => {
    map.delete(property)
    if (value) map.set(property, value)
  })
  const value = [...map].map(([property, propertyValue]) => `${property}: ${propertyValue}`).join('; ') + (map.size ? ';' : '')
  if (styleMatch) tag = tag.slice(0, styleMatch.index) + ` style="${value}"` + tag.slice(styleMatch.index! + styleMatch[0].length)
  else if (/\s*\/>$/.test(tag)) tag = tag.replace(/\s*\/>$/, ` style="${value}" />`)
  else tag = tag.replace(/\s*>$/, ` style="${value}">`)
  return source.slice(0, location.start) + tag + source.slice(location.end)
}

export function patchText(source: string, selector: string, textContent: string, textNodeIndex = 0) {
  const node = findSourceNode(source, selector)
  if (!node) throw new Error(`无法在源文件中安全定位文字元素：${selector}`)
  const texts = (node.childNodes || []).filter((child: any) => child.nodeName === '#text' && child.sourceCodeLocation)
  const target = texts[textNodeIndex]
  if (!target) throw new Error(`无法定位文字节点：${selector}`)
  const location = target.sourceCodeLocation
  const escaped = textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return source.slice(0, location.startOffset) + escaped + source.slice(location.endOffset)
}

export function patchAttributes(source: string, selector: string, attributes: Record<string, string>) {
  const location = findOpeningTag(source, selector)
  if (!location) throw new Error(`无法定位属性元素：${selector}`)
  let tag = source.slice(location.start, location.end)
  for (const [name, value] of Object.entries(attributes)) {
    const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    const expression = new RegExp(`\\s${cssEscape(name)}\\s*=\\s*(["'])[\\s\\S]*?\\1`, 'i')
    tag = expression.test(tag)
      ? tag.replace(expression, ` ${name}="${escaped}"`)
      : tag.replace(/\s*\/?>$/, match => ` ${name}="${escaped}"${match.includes('/') ? ' />' : '>'}`)
  }
  return source.slice(0, location.start) + tag + source.slice(location.end)
}

export function patchElement(source: string, selector: string, replacement: string) {
  const node = findSourceNode(source, selector)
  const location = node?.sourceCodeLocation
  if (!location) throw new Error(`无法定位要替换的 SVG：${selector}`)
  if (!/^\s*<svg\b[\s\S]*<\/svg>\s*$/i.test(replacement)) throw new Error('SVG 代码必须以 <svg> 开始并以 </svg> 结束')
  return source.slice(0, location.startOffset) + replacement.trim() + source.slice(location.endOffset)
}

export function removeElement(source: string, selector: string) {
  const node = findSourceNode(source, selector)
  const location = node?.sourceCodeLocation
  if (!location) throw new Error(`无法定位要删除的元素：${selector}`)
  return source.slice(0, location.startOffset) + source.slice(location.endOffset)
}

export function applySaveRequest(source: string, request: SaveRequest) {
  if (request.expectedSource !== source) throw new Error('文件已被其他程序修改，请重新载入后再保存')
  let next = source
  // Replacement must happen first so later style/color edits are not discarded.
  if (request.replacementHtml) next = patchElement(next, request.selector, request.replacementHtml)
  if (Object.keys(request.styles).length) {
    for (const selector of request.selectors?.length ? request.selectors : [request.selector]) next = patchStyle(next, selector, request.styles)
  }
  for (const change of request.batchChanges || []) next = patchStyle(next, change.selector, change.styles)
  if (request.attributes) next = patchAttributes(next, request.selector, request.attributes)
  if (request.textContent !== undefined) next = patchText(next, request.selector, request.textContent, request.textNodeIndex)
  if (request.removeElement) next = removeElement(next, request.selector)
  if (next === source) throw new Error('没有生成可写入的修改')
  return next
}
