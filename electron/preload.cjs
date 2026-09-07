const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, native desktop APIs to the renderer window
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch,

  // File System & Native Dialogs
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  revealInFinder: (filePath) => ipcRenderer.invoke('app:revealInFinder', filePath),

  // Local Offline Database & Storage
  getStorageStats: () => ipcRenderer.invoke('storage:getStats'),
  saveProjectLocally: (project) => ipcRenderer.invoke('storage:saveProject', project),
  loadProjectLocally: (projectId) => ipcRenderer.invoke('storage:loadProject', projectId),
  listLocalProjects: () => ipcRenderer.invoke('storage:listProjects'),
  importMediaToVault: (filePaths) => ipcRenderer.invoke('storage:importMedia', filePaths),

  // Native FFmpeg Execution Engine
  runFFmpegNative: (args, jobId) => ipcRenderer.invoke('ffmpeg:execute', { args, jobId }),
  onFFmpegProgress: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('ffmpeg:progress', subscription);
    return () => ipcRenderer.removeListener('ffmpeg:progress', subscription);
  },

  // System Hardware Diagnostics
  getSystemInfo: () => ipcRenderer.invoke('app:getSystemInfo'),
  
  // Menu Actions Listener
  onMenuAction: (callback) => {
    const subscription = (_event, action) => callback(action);
    ipcRenderer.on('menu:action', subscription);
    return () => ipcRenderer.removeListener('menu:action', subscription);
  }
});
