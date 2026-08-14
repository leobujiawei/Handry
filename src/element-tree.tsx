import { useEffect, useRef, useState } from 'react'
import { elementTreeContains, elementTreeRevealDelta, type ElementTreeNode } from './element-tree-model'

export type { ElementTreeNode } from './element-tree-model'

function nodeSuffix(node:ElementTreeNode){
 if(node.id)return`#${node.id}`
 const classes=node.className.trim().split(/\s+/).filter(Boolean).slice(0,2)
 return classes.length?`.${classes.join('.')}`:''
}

export function ElementTree({nodes,selectedSelector,onSelect}:{nodes:ElementTreeNode[];selectedSelector:string;onSelect:(selector:string)=>void}){
 const selectedRef=useRef<HTMLButtonElement|null>(null)
 useEffect(()=>{const frame=window.requestAnimationFrame(()=>{const target=selectedRef.current,panel=target?.closest<HTMLElement>('.files');if(!target||!panel)return;const itemRect=target.getBoundingClientRect(),panelRect=panel.getBoundingClientRect();panel.scrollTop+=elementTreeRevealDelta(itemRect.top,itemRect.bottom,panelRect.top,panelRect.bottom)});return()=>window.cancelAnimationFrame(frame)},[selectedSelector])
 if(!nodes.length)return <div className="empty small element-tree-empty">打开 HTML 文件后显示页面控件</div>
 return <div className="element-tree" role="tree" aria-label="页面控件目录">{nodes.map(node=><ElementTreeItem key={node.sourceSelector} node={node} depth={0} selectedSelector={selectedSelector} onSelect={onSelect} selectedRef={selectedRef}/>)}</div>
}

function ElementTreeItem({node,depth,selectedSelector,onSelect,selectedRef}:{node:ElementTreeNode;depth:number;selectedSelector:string;onSelect:(selector:string)=>void;selectedRef:React.MutableRefObject<HTMLButtonElement|null>}){
 const selected=node.sourceSelector===selectedSelector
 const selectedInside=Boolean(selectedSelector)&&elementTreeContains(node,selectedSelector)
 const[expanded,setExpanded]=useState(depth<2)
 useEffect(()=>{if(selectedInside)setExpanded(true)},[selectedInside])
 const hasChildren=node.children.length>0
 const suffix=nodeSuffix(node)
 return <div className="element-tree-node" role="treeitem" aria-selected={selected} aria-expanded={hasChildren?expanded:undefined}>
  <div className={`element-tree-row${selected?' selected':''}`} style={{paddingLeft:8+depth*14}}>
   <button type="button" className={`element-tree-chevron${hasChildren?'':' leaf'}`} aria-label={expanded?'折叠':'展开'} tabIndex={hasChildren?0:-1} onClick={()=>hasChildren&&setExpanded(value=>!value)}>{hasChildren?(expanded?'⌄':'›'):'·'}</button>
   <button type="button" className="element-tree-target" ref={selected?selectedRef:undefined} title={node.sourceSelector} onClick={()=>onSelect(node.sourceSelector)}>
    <span className="element-tree-tag">{node.tagName}</span>{suffix&&<span className="element-tree-suffix">{suffix}</span>}{node.context&&<span className="element-tree-context">{node.context}</span>}
   </button>
  </div>
  {hasChildren&&expanded&&<div role="group">{node.children.map(child=><ElementTreeItem key={child.sourceSelector} node={child} depth={depth+1} selectedSelector={selectedSelector} onSelect={onSelect} selectedRef={selectedRef}/>)}</div>}
 </div>
}
