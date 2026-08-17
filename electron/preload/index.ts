import { contextBridge, ipcRenderer } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
contextBridge.exposeInMainWorld('visualEditor', {
  platform: process.platform,
  openProject: () => ipcRenderer.invoke('project:open'),
  readFile: (path:string) => ipcRenderer.invoke('file:read',path),
  saveFile: (request:unknown) => ipcRenderer.invoke('file:save',request),
  exportChangeDetails: (request:unknown) => ipcRenderer.invoke('change-log:export',request),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (record:unknown) => ipcRenderer.invoke('backup:restore',record),
  previewPreload: pathToFileURL(path.join(__dirname, 'preview.js')).href
})
