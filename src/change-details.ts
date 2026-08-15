type ColorUse={selector:string;sourceSelector?:string;properties:string[]}
type ColorGroup={value:string;uses:ColorUse[]}

export type ChangeDetailsItem={
 filePath:string
 picked:{
  selector:string
  sourceSelector:string
  tagName:string
  id:string
  className:string
  styles:Record<string,string>
  textContent:string
  imageUrl:string
  svgCode:string
  colorGroups:ColorGroup[]
 }
 styles:Record<string,string>
 textContent?:string
 colorChanges:Record<string,string>
 imageUrl?:string
 svgCode?:string
}

const originalAliases:Record<string,string>={
 'border-width':'border-top-width',
 'border-style':'border-top-style',
 'border-color':'border-top-color',
}

function inline(value:string|undefined){
 const normalized=String(value??'').replace(/\r?\n/g,' ↵ ').trim()||'（空）'
 const longest=Math.max(0,...[...normalized.matchAll(/`+/g)].map(match=>match[0].length))
 const fence='`'.repeat(Math.max(1,longest+1))
 const padding=normalized.startsWith('`')||normalized.endsWith('`')?' ':''
 return `${fence}${padding}${normalized.replace(/\|/g,'\\|')}${padding}${fence}`
}

function codeBlock(value:string,language='text'){
 const longest=Math.max(0,...[...value.matchAll(/`+/g)].map(match=>match[0].length))
 const fence='`'.repeat(Math.max(3,longest+1))
 return `${fence}${language}\n${value}\n${fence}`
}

function visibleStyleEntries(item:ChangeDetailsItem){
 return Object.entries(item.styles).filter(([property,next])=>!(next===''&&property.endsWith('-radius')&&item.styles['border-radius']))
}

function componentName(item:ChangeDetailsItem){
 const tag=(item.picked.tagName||'element').toLowerCase()
 if(item.picked.id)return`${tag}#${item.picked.id}`
 const classes=item.picked.className.split(/\s+/).filter(Boolean).slice(0,2)
 return classes.length?`${tag}.${classes.join('.')}`:tag
}

function changeSummary(item:ChangeDetailsItem){
 const details=visibleStyleEntries(item).map(([property,next])=>`${property}: ${item.picked.styles[property]??item.picked.styles[originalAliases[property]||property]??'默认'} → ${next||'移除'}`)
 if(item.textContent!==undefined)details.push('文案已调整')
 if(item.imageUrl!==undefined)details.push('图片地址已调整')
 if(Object.keys(item.colorChanges).length)details.push(`${Object.keys(item.colorChanges).length} 项颜色已调整`)
 if(item.svgCode!==undefined)details.push('SVG 已调整')
 return`${componentName(item)} · ${details.join('；')||'内容已调整'}`
}

function colorLocations(item:ChangeDetailsItem,original:string){
 const group=item.picked.colorGroups.find(candidate=>candidate.value===original)
 if(!group?.uses.length)return '页面内对应颜色'
 return group.uses.map(use=>`${use.sourceSelector||use.selector} (${use.properties.join(', ')})`).join('；')
}

export function changeDetailsFileName(date:Date){
 const value=(part:number)=>String(part).padStart(2,'0')
 return `Handry-改动明细-${date.getFullYear()}${value(date.getMonth()+1)}${value(date.getDate())}-${value(date.getHours())}${value(date.getMinutes())}.md`
}

export function buildChangeDetails(items:ChangeDetailsItem[],options:{projectRoot?:string;exportedAt?:string}={}){
 const groups=new Map<string,ChangeDetailsItem[]>()
 for(const item of items)groups.set(item.filePath,[...(groups.get(item.filePath)??[]),item])
 const lines=[
  '# Handry 改动明细',
  '',
  '> 本文件仅记录待开发实现的页面改动，不会修改任何原始 HTML 文件。',
  '',
  `- 导出时间：${options.exportedAt??new Date().toISOString()}`,
  `- 项目目录：${inline(options.projectRoot||'未提供')}`,
  `- 涉及文件：${groups.size} 个`,
  `- 改动元素：${items.length} 个`,
  '',
  '## 开发说明',
  '',
  '- 元素定位基于导出时页面的 DOM 结构，请将改动落实到对应组件或 CSS 源码中。',
  '- “建议值”来自 Handry 当前尚未写入 HTML 的编辑状态。',
 ]
 let fileIndex=0
 for(const[filePath,fileItems]of groups){
  fileIndex++
  lines.push('',`## ${fileIndex}. ${filePath.split(/[\\/]/).pop()||filePath}`,'',`- 原文件：${inline(filePath)}`,`- 改动数量：${fileItems.length} 项`)
  fileItems.forEach((item,index)=>{
   const name=componentName(item)
   lines.push('',`### ${fileIndex}.${index+1} ${inline(name)}`,'',`- 改动摘要：${changeSummary(item)}`,`- 元素定位：${inline(item.picked.sourceSelector||item.picked.selector)}`)
   const styles=visibleStyleEntries(item)
   if(styles.length){
    lines.push('','#### 样式改动','','| CSS 属性 | 原值 | 建议值 |','| --- | --- | --- |')
    for(const[property,next]of styles){const previous=item.picked.styles[property]??item.picked.styles[originalAliases[property]||property];lines.push(`| ${inline(property)} | ${inline(previous)} | ${inline(next||'（移除）')} |`)}
   }
   if(item.textContent!==undefined)lines.push('','#### 文案改动','','原文：','',codeBlock(item.picked.textContent),'','建议文案：','',codeBlock(item.textContent))
   if(item.imageUrl!==undefined)lines.push('','#### 图片地址','','- 原地址：'+inline(item.picked.imageUrl),'- 建议地址：'+inline(item.imageUrl))
   const colors=Object.entries(item.colorChanges)
   if(colors.length){
    lines.push('','#### 颜色改动','','| 原颜色 | 建议颜色 | 影响位置 |','| --- | --- | --- |')
    for(const[original,next]of colors)lines.push(`| ${inline(original)} | ${inline(next)} | ${inline(colorLocations(item,original))} |`)
   }
   if(item.svgCode!==undefined)lines.push('','#### SVG 改动','','原 SVG：','',codeBlock(item.picked.svgCode,'html'),'','建议 SVG：','',codeBlock(item.svgCode,'html'))
  })
 }
 lines.push('','---','','由 Handry 导出。')
 return lines.join('\n')+'\n'
}
