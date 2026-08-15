import assert from 'node:assert/strict'
import test from 'node:test'
import { buildChangeDetails, changeDetailsFileName, type ChangeDetailsItem } from '../src/change-details.ts'

function change(overrides:Partial<ChangeDetailsItem>={}):ChangeDetailsItem{return{
 filePath:'/project/pages/home.html',
 picked:{selector:'body > main > h1',sourceSelector:'body > main > h1',tagName:'h1',id:'hero',className:'title',styles:{'font-size':'32px',color:'rgb(0, 0, 0)'},textContent:'旧标题',imageUrl:'',svgCode:'',colorGroups:[]},
 styles:{'font-size':'40px'},textContent:'新标题',colorChanges:{},...overrides,
}}

test('exports developer-ready markdown with original and suggested values',()=>{
 const markdown=buildChangeDetails([change()],{projectRoot:'/project',exportedAt:'2026-08-15T01:02:03.000Z'})
 assert.match(markdown,/# Handry 改动明细/)
 assert.match(markdown,/不会修改任何原始 HTML 文件/)
 assert.match(markdown,/home\.html/)
 assert.match(markdown,/body > main > h1/)
 assert.match(markdown,/32px/)
 assert.match(markdown,/40px/)
 assert.match(markdown,/旧标题/)
 assert.match(markdown,/新标题/)
})

test('exports every file and every pending element change',()=>{
 const markdown=buildChangeDetails([change(),change({filePath:'/project/pages/about.html',textContent:undefined,imageUrl:'/new.png',picked:{...change().picked,tagName:'img',id:'logo',imageUrl:'/old.png'}})])
 assert.match(markdown,/涉及文件：2 个/)
 assert.match(markdown,/改动元素：2 个/)
 assert.match(markdown,/about\.html/)
 assert.match(markdown,/\/old\.png/)
 assert.match(markdown,/\/new\.png/)
})

test('uses a stable markdown filename',()=>{
 assert.equal(changeDetailsFileName(new Date(2026,7,15,9,7)),'Handry-改动明细-20260815-0907.md')
})
