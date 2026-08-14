type SaveChangeTarget={
 tagName:string
 id:string
 className:string
 styles:Record<string,string>
 textContent:string
 imageUrl:string
}

export type SaveChangeItem={
 picked:SaveChangeTarget
 styles:Record<string,string>
 textContent?:string
 colorChanges:Record<string,string>
 imageUrl?:string
 svgCode?:string
}

const propertyLabels:Record<string,string>={
 'font-size':'字号',color:'文字颜色',width:'宽度',height:'高度',
 'padding-top':'上内边距','padding-right':'右内边距','padding-bottom':'下内边距','padding-left':'左内边距',
 'margin-top':'上外边距','margin-right':'右外边距','margin-bottom':'下外边距','margin-left':'左外边距',
 'border-radius':'圆角','border-top-left-radius':'左上圆角','border-top-right-radius':'右上圆角',
 'border-bottom-right-radius':'右下圆角','border-bottom-left-radius':'左下圆角',
 'border-width':'描边宽度','border-style':'描边样式','border-color':'描边颜色',
 'background':'背景','background-color':'背景颜色','background-image':'背景',
 'font-weight':'字重','line-height':'行高','letter-spacing':'字间距','text-align':'对齐',gap:'间距',
 opacity:'透明度','object-fit':'图片填充',
}

const originalAliases:Record<string,string>={
 'border-width':'border-top-width',
 'border-style':'border-top-style',
 'border-color':'border-top-color',
}

function compactValue(value:string|undefined,maxLength=20){
 const normalized=String(value??'').replace(/\s*!important\s*$/i,'').replace(/\s+/g,' ').trim()||'默认'
 return normalized.length>maxLength?`${normalized.slice(0,maxLength-1)}…`:normalized
}

export function saveChangeComponentName(target:SaveChangeTarget){
 const tag=(target.tagName||'元素').toLowerCase()
 if(target.id)return `${tag}#${target.id}`
 const classes=String(target.className||'').split(/\s+/).filter(Boolean).slice(0,2)
 return classes.length?`${tag}.${classes.join('.')}`:tag
}

export function describeSaveChange(item:SaveChangeItem){
 const details:string[]=[]
 for(const[property,next]of Object.entries(item.styles)){
  // 联动圆角会清空四个单角值；只展示最终的整体圆角，避免产生五条噪音。
  if(next===''&&property.endsWith('-radius')&&item.styles['border-radius'])continue
  const originalProperty=originalAliases[property]||property
  const previous=item.picked.styles[property]??item.picked.styles[originalProperty]
  details.push(`${propertyLabels[property]||property}：${compactValue(previous)} → ${compactValue(next)}`)
 }
 if(item.textContent!==undefined)details.push(`文案：${compactValue(item.picked.textContent)} → ${compactValue(item.textContent)}`)
 for(const[previous,next]of Object.entries(item.colorChanges))details.push(`颜色：${compactValue(previous)} → ${compactValue(next)}`)
 if(item.imageUrl!==undefined)details.push(`图片：${compactValue(item.picked.imageUrl)} → ${compactValue(item.imageUrl)}`)
 if(item.svgCode!==undefined)details.push('SVG：原内容 → 新内容')
 return `${saveChangeComponentName(item.picked)} · ${details.join('；')||'内容已调整'}`
}
