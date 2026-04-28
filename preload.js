const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('minikodiAPI', {
  // Búsqueda de mods
  searchMods: (query) => ipcRenderer.invoke('search-mods', query),
  
  // Instalación de mods
  installMod: (modUrl, modInfo) => ipcRenderer.invoke('install-mod', modUrl, modInfo),
  
  // Gestión de favoritos
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  addFavorite: (item) => ipcRenderer.invoke('add-favorite', item),
  removeFavorite: (itemId) => ipcRenderer.invoke('remove-favorite', itemId),
  
  // Torrent (placeholder - implementar en fase 2)
  startTorrent: (magnetUri) => Promise.resolve({ success: false, message: 'Funcionalidad torrent próximamente' }),
  stopTorrent: (infoHash) => Promise.resolve({ success: false, message: 'Funcionalidad torrent próximamente' }),
  onTorrentProgress: (callback) => { /* No-op por ahora */ },
  
  // Reproducción
  playMedia: (filePath) => ipcRenderer.invoke('play-media', filePath),
  
  // Mods instalados
  getInstalledMods: () => ipcRenderer.invoke('get-installed-mods'),
  
  // Selector de archivos
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters)
});
