import assert from 'node:assert/strict'
import test from 'node:test'
import { elementTreeContains, elementTreeRevealDelta, type ElementTreeNode } from '../src/element-tree-model.ts'

const tree:ElementTreeNode={
 sourceSelector:'body:nth-of-type(1)',
 tagName:'body',
 id:'',
 className:'',
 children:[{
  sourceSelector:'body:nth-of-type(1) > main:nth-of-type(1)',
  tagName:'main',
  id:'',
  className:'page',
  children:[{
   sourceSelector:'body:nth-of-type(1) > main:nth-of-type(1) > button#save',
   tagName:'button',
   id:'save',
   className:'primary',
   children:[],
  }],
 }],
}

test('finds a selected element anywhere in a collapsed tree branch',()=>{
 assert.equal(elementTreeContains(tree,'body:nth-of-type(1) > main:nth-of-type(1) > button#save'),true)
})

test('does not report unrelated selectors as descendants',()=>{
 assert.equal(elementTreeContains(tree,'body:nth-of-type(1) > footer:nth-of-type(1)'),false)
})

test('only scrolls the control panel when the selected row is outside its viewport',()=>{
 assert.equal(elementTreeRevealDelta(120,145,100,300),0)
 assert.equal(elementTreeRevealDelta(80,105,100,300),-20)
 assert.equal(elementTreeRevealDelta(295,320,100,300),20)
})
