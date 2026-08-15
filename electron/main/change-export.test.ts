import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSeparateExportFile, markdownExportPath, safeSuggestedName } from './change-export'

test('always exports to a markdown file',()=>{
 assert.equal(markdownExportPath('/project/Handry-改动明细'),'/project/Handry-改动明细.md')
 assert.equal(markdownExportPath('/project/changes.MD'),'/project/changes.MD')
})

test('never allows an export to overwrite an original HTML file',()=>{
 assert.throws(()=>assertSeparateExportFile('/project/index.html',['/project/index.html']),/不能覆盖/)
 assert.equal(assertSeparateExportFile('/project/changes.md',['/project/index.html']),'/project/changes.md')
})

test('removes directory traversal from the suggested filename',()=>{
 assert.equal(safeSuggestedName('../exports/details'),'details.md')
})
