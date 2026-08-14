import { ipcRenderer } from 'electron'
type Picked = { selector:string; tagName:string; id:string; className:string; styles:Record<string,string> }
const props=['font-size','color','background-color','width','height','padding','margin','border-radius']
let selected: HTMLElement|null=null, hover:HTMLElement|null=null, overlay:HTMLDivElement, mode:'interact'|'select'='interact'
function selector(el:Element) { const parts:string[]=[]; let node:Element|null=el; while(node&&node!==document.documentElement){ let s=node.tagName.toLowerCase(); if(node.id){s+='#'+node.id;parts.unshift(s);break} const cls=[...node.classList].slice(0,2); if(cls.length)s+='.'+cls.join('.'); const same=node.parentElement?[...node.parentElement.children].filter(x=>x.tagName===node!.tagName):[]; if(same.length>1)s+=`:nth-of-type(${same.indexOf(node)+1})`; parts.unshift(s);node=node.parentElement } return parts.join(' > ') }
function draw(el:HTMLElement|null,_color='#416eea'){ if(!el){overlay.style.display='none';return} const r=el.getBoundingClientRect(); Object.assign(overlay.style,{display:'block',left:`${r.left+scrollX}px`,top:`${r.top+scrollY}px`,width:`${r.width}px`,height:`${r.height}px`,borderColor:'#416eea'}) }
function payload(el:HTMLElement):Picked { const cs=getComputedStyle(el); return {selector:selector(el),tagName:el.tagName.toLowerCase(),id:el.id,className:el.className,styles:Object.fromEntries(props.map(p=>[p,cs.getPropertyValue(p)]))} }
window.addEventListener('DOMContentLoaded',()=>{ overlay=document.createElement('div'); Object.assign(overlay.style,{position:'absolute',zIndex:'2147483647',pointerEvents:'none',border:'2px solid #416eea',boxSizing:'border-box',display:'none'}); document.body.appendChild(overlay)
 document.addEventListener('mousemove',e=>{if(mode!=='select')return;hover=(e.target as HTMLElement);if(hover!==overlay)draw(hover)},true)
 document.addEventListener('click',e=>{if(mode!=='select')return;e.preventDefault();e.stopPropagation();selected=e.target as HTMLElement;if(selected===overlay)return;draw(selected,'#a78bfa');ipcRenderer.sendToHost('element-selected',payload(selected))},true)
 ipcRenderer.on('set-mode',(_e,next:'interact'|'select')=>{mode=next;document.documentElement.style.cursor=mode==='select'?'crosshair':'';if(mode==='interact')draw(null)})
 ipcRenderer.on('apply-style',(_e,styles:Record<string,string>)=>{if(!selected)return;Object.entries(styles).forEach(([k,v])=>selected!.style.setProperty(k,v));draw(selected,'#a78bfa');ipcRenderer.sendToHost('element-selected',payload(selected))})
})
