import path from 'node:path'

export type ChangeExportRequest={content:string;suggestedName:string;directory?:string;originalPaths:string[]}

export function markdownExportPath(filePath:string){return /\.md$/i.test(filePath)?filePath:filePath+'.md'}

export function assertSeparateExportFile(filePath:string,originalPaths:string[]){
 const output=path.resolve(filePath)
 if(originalPaths.some(original=>path.resolve(original)===output))throw new Error('导出文件不能覆盖原始 HTML 文件')
 return output
}

export function safeSuggestedName(value:string){
 const name=path.basename(value||'Handry-改动明细.md')
 return /\.md$/i.test(name)?name:name+'.md'
}
