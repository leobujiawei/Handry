import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('visualEditor', {
  openProject: () => ipcRenderer.invoke('project:open'),
  readFile: (path:string) => ipcRenderer.invoke('file:read',path),
  saveFile: (request:unknown) => ipcRenderer.invoke('file:save',request),
  exportChangeDetails: (request:unknown) => ipcRenderer.invoke('change-log:export',request),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (record:unknown) => ipcRenderer.invoke('backup:restore',record),
  previewPreload: `file://${__dirname.replace(/\\/g,'/')}/preview.js`
})
