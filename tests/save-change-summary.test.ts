import test from 'node:test'
import assert from 'node:assert/strict'
import { describeSaveChange, saveChangeComponentName, type SaveChangeItem } from '../src/save-change-summary.ts'

function item(overrides:Partial<SaveChangeItem>={}):SaveChangeItem{
 return {
  picked:{tagName:'H1',id:'hero-title',className:'title large',styles:{'font-size':'32px','border-radius':'0px','border-top-left-radius':'0px'},textContent:'旧标题',imageUrl:''},
  styles:{'font-size':'40px'},textContent:undefined,colorChanges:{},imageUrl:undefined,svgCode:undefined,...overrides,
 }
}

test('component name prefers a stable id and falls back to compact classes',()=>{
 assert.equal(saveChangeComponentName(item().picked),'h1#hero-title')
 assert.equal(saveChangeComponentName({...item().picked,id:'',className:'title large extra'}),'h1.title.large')
})

test('summary only contains component and old-to-new value on one line',()=>{
 assert.equal(describeSaveChange(item()),'h1#hero-title · 字号：32px → 40px')
})

test('linked radius cleanup values are hidden from the summary',()=>{
 const result=describeSaveChange(item({styles:{'border-top-left-radius':'','border-top-right-radius':'','border-bottom-right-radius':'','border-bottom-left-radius':'','border-radius':'18px'}}))
 assert.equal(result,'h1#hero-title · 圆角：0px → 18px')
})

test('text changes are compacted to a single line',()=>{
 const result=describeSaveChange(item({styles:{},textContent:'新的 标题'}))
 assert.equal(result,'h1#hero-title · 文案：旧标题 → 新的 标题')
})
