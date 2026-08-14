import { pathToFileURL } from 'node:url'

const topLevelRedirect = /if\s*\(\s*window\.self\s*===\s*window\.top\s*\)\s*\{[\s\S]{0,1200}?window\.location(?:\.href)?\s*=\s*(['"])([^'"]+)\1/i

export function previewUrl(filePath:string,source:string){
  const fileUrl=pathToFileURL(filePath).href
  const redirect=topLevelRedirect.exec(source)?.[2]
  if(!redirect)return fileUrl
  try{return new URL(redirect,fileUrl).href}catch{return fileUrl}
}
