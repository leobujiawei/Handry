import { app, BrowserWindow, dialog, ipcMain, type SaveDialogOptions } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { applySaveRequest, type SaveRequest } from './file-edit'
import { previewUrl } from './preview-url'
import { assertSeparateExportFile, markdownExportPath, safeSuggestedName, type ChangeExportRequest } from './change-export'

type TreeNode = { name: string; path: string; type: 'file' | 'directory'; children?: TreeNode[] }
type BackupRecord={id:string;timestamp:string;filePath:string;backupPath:string;size:number}

// Keep the existing backup/history location after the product rename.
app.setPath('userData',path.join(app.getPath('appData'),'Visual HTML Editor'))
app.setName('Handry')

async function createBackup(filePath:string,content:string){const timestamp=new Date().toISOString();const id=crypto.createHash('sha256').update(filePath+timestamp).digest('hex').slice(0,20);const group=crypto.createHash('sha256').update(filePath).digest('hex').slice(0,16);const dir=path.join(app.getPath('userData'),'backups',group);await fs.mkdir(dir,{recursive:true});const safeTime=timestamp.replace(/[:.]/g,'-');const backupPath=path.join(dir,`${safeTime}-${path.basename(filePath)}`);await fs.writeFile(backupPath,content,'utf8');const record:BackupRecord={id,timestamp,filePath,backupPath,size:Buffer.byteLength(content)};await fs.writeFile(backupPath+'.json',JSON.stringify(record),'utf8');return record}
async function listBackups(){const root=path.join(app.getPath('userData'),'backups');let groups:string[]=[];try{groups=await fs.readdir(root)}catch{return[]}const records:BackupRecord[]=[];for(const group of groups){const dir=path.join(root,group);let files:string[]=[];try{files=await fs.readdir(dir)}catch{continue}for(const name of files.filter(n=>n.endsWith('.json'))){try{records.push(JSON.parse(await fs.readFile(path.join(dir,name),'utf8')))}catch{}}}return records.sort((a,b)=>b.timestamp.localeCompare(a.timestamp))}

async function tree(dir: string): Promise<TreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const visible = entries.filter(e => !e.name.startsWith('.') && e.name !== 'node_modules').sort((a,b) => Number(b.isDirectory())-Number(a.isDirectory()) || a.name.localeCompare(b.name))
  return Promise.all(visible.map(async e => ({ name: e.name, path: path.join(dir, e.name), type: e.isDirectory() ? 'directory' : 'file', children: e.isDirectory() ? await tree(path.join(dir,e.name)) : undefined } as TreeNode)))
}

function createWindow() {
  const iconPath=path.join(__dirname,'../../assets/visual-html-editor-icon.png')
  if(process.platform==='darwin')app.dock?.setIcon(iconPath)
  const win = new BrowserWindow({ width: 1440, height: 900, minWidth: 980, minHeight: 640, title:'Handry — Visual HTML Editor', icon:iconPath, titleBarStyle: 'hiddenInset', backgroundColor: '#181818', webPreferences: { preload: path.join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, webSecurity: false } })
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(__dirname, '../../dist/index.html'))
  win.once('ready-to-show', () => { win.show(); win.focus(); app.focus({ steal: true }) })
}

ipcMain.handle('project:open', async event => {
  const parent = BrowserWindow.fromWebContents(event.sender)
  if (parent) { parent.show(); parent.focus(); app.focus({ steal: true }) }
  const r = parent
    ? await dialog.showOpenDialog(parent, { title: '选择 HTML 项目文件夹', buttonLabel: '打开', properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ title: '选择 HTML 项目文件夹', buttonLabel: '打开', properties: ['openDirectory'] })
  if (r.canceled) return null
  return {root:r.filePaths[0], nodes:await tree(r.filePaths[0])}
})
ipcMain.handle('file:read', async (_e,p:string) => {const source=await fs.readFile(p,'utf8');return{source,url:previewUrl(p,source)}})
ipcMain.handle('file:save', async (_e,req:SaveRequest) => { const current=await fs.readFile(req.filePath,'utf8');const next=applySaveRequest(current,req);await createBackup(req.filePath,current);const tmp=req.filePath+'.visual-editor.tmp';await fs.writeFile(tmp,next,'utf8');await fs.rename(tmp,req.filePath);const verified=await fs.readFile(req.filePath,'utf8');if(verified!==next)throw new Error('磁盘写入验证失败');return{source:verified,filePath:req.filePath,changed:true} })
ipcMain.handle('change-log:export',async(event,req:ChangeExportRequest)=>{if(!req||typeof req.content!=='string')throw new Error('导出内容无效');const parent=BrowserWindow.fromWebContents(event.sender),suggested=safeSuggestedName(req.suggestedName),defaultPath=req.directory?path.join(req.directory,suggested):suggested;const options:SaveDialogOptions={title:'导出改动明细',buttonLabel:'导出',defaultPath,filters:[{name:'Markdown 文件',extensions:['md']}]};const result=parent?await dialog.showSaveDialog(parent,options):await dialog.showSaveDialog(options);if(result.canceled||!result.filePath)return null;const output=assertSeparateExportFile(markdownExportPath(result.filePath),req.originalPaths||[]);await fs.writeFile(output,req.content,'utf8');return{filePath:output}})
ipcMain.handle('backup:list',()=>listBackups())
ipcMain.handle('backup:restore',async(_e,record:BackupRecord)=>{const root=path.resolve(app.getPath('userData'),'backups');const backup=path.resolve(record.backupPath);if(!backup.startsWith(root+path.sep))throw new Error('无效的备份路径');const restored=await fs.readFile(backup,'utf8');const current=await fs.readFile(record.filePath,'utf8');await createBackup(record.filePath,current);const tmp=record.filePath+'.visual-editor.restore.tmp';await fs.writeFile(tmp,restored,'utf8');await fs.rename(tmp,record.filePath);return{filePath:record.filePath,source:restored,url:previewUrl(record.filePath,restored)}})
app.whenReady().then(createWindow); app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()}); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})
