/**
 * MiniKodi - Preload Script
 * PromptOS v14.0 - Context Bridge seguro entre main y renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('minikodi', {
  // Información de la aplicación
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Torrent (funcionalidad real)
  torrent: {
    add: (magnetLink) => ipcRenderer.invoke('torrent-add', magnetLink),
    remove: (infoHash, removeFiles = false) => 
      ipcRenderer.invoke('torrent-remove', infoHash, removeFiles),
    list: () => ipcRenderer.invoke('torrent-list'),
    getProgress: (infoHash) => ipcRenderer.invoke('torrent-progress', infoHash)
  },
  
  // Sistema de archivos
  openFileDialog: (filters = []) => 
    ipcRenderer.invoke('open-file-dialog', filters),
  openPath: (filePath) => 
    ipcRenderer.invoke('open-path', filePath),
  
  // Eventos desde el main process
  onAppReady: (callback) => {
    ipcRenderer.on('app-ready', (event, data) => callback(data));
  },
  
  // Utilidades
  platform: process.platform
});

// Logger para debug en consola del renderer (solo desarrollo)
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  console.log('[PRELOAD] MiniKodi API expuesta correctamente');
}
