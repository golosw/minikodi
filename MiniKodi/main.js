const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const extractZip = require('extract-zip');

let mainWindow;
const MODS_DIR = path.join(app.getPath('userData'), 'mods');
const FAVORITES_FILE = path.join(app.getPath('userData'), 'favorites.json');

// Asegurar directorios existen
if (!fs.existsSync(MODS_DIR)) {
  fs.mkdirSync(MODS_DIR, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'resources', 'icon.png'),
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile('src/renderer/index.html');
  
  // Splash screen implícita - la UI muestra loading
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==================== IPC HANDLERS ====================

// Buscar mods en repositorio
ipcMain.handle('search-mods', async (event, query) => {
  try {
    // Simulación de búsqueda - en producción usar API real
    const mockMods = [
      { id: 'mod1', name: 'Skin Ocean Dark', version: '2.1', type: 'skin', size: '15MB' },
      { id: 'mod2', name: 'Video Player Enhanced', version: '1.5', type: 'player', size: '8MB' },
      { id: 'mod3', name: 'Torrent Integrator', version: '3.0', type: 'addon', size: '5MB' },
      { id: 'mod4', name: 'Favorites Manager Pro', version: '1.2', type: 'addon', size: '3MB' },
      { id: 'mod5', name: 'Subtitle Downloader', version: '2.8', type: 'addon', size: '4MB' }
    ];
    
    if (!query) return mockMods;
    
    return mockMods.filter(mod => 
      mod.name.toLowerCase().includes(query.toLowerCase()) ||
      mod.type.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching mods:', error);
    throw error;
  }
});

// Instalar mod desde ZIP
ipcMain.handle('install-mod', async (event, modUrl, modInfo) => {
  try {
    const modPath = path.join(MODS_DIR, modInfo.id);
    
    // Descargar ZIP (simulado - en producción usar fetch real)
    const zipPath = path.join(MODS_DIR, `${modInfo.id}.zip`);
    
    // Crear ZIP dummy para demostración
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');
    
    archive.pipe(output);
    archive.append(`Mod ${modInfo.name} v${modInfo.version}`, { name: 'info.txt' });
    await archive.finalize();
    
    // Extraer ZIP
    await extractZip(zipPath, { dir: modPath });
    
    // Limpiar ZIP
    fs.unlinkSync(zipPath);
    
    return { success: true, path: modPath };
  } catch (error) {
    console.error('Error installing mod:', error);
    throw error;
  }
});

// Gestionar favoritos
ipcMain.handle('get-favorites', async () => {
  try {
    if (!fs.existsSync(FAVORITES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
});

ipcMain.handle('add-favorite', async (event, item) => {
  try {
    let favorites = [];
    if (fs.existsSync(FAVORITES_FILE)) {
      const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
      favorites = JSON.parse(data);
    }
    
    // Evitar duplicados
    if (!favorites.find(f => f.id === item.id)) {
      favorites.push(item);
      fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    }
    
    return favorites;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
});

ipcMain.handle('remove-favorite', async (event, itemId) => {
  try {
    let favorites = [];
    if (fs.existsSync(FAVORITES_FILE)) {
      const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
      favorites = JSON.parse(data);
    }
    
    favorites = favorites.filter(f => f.id !== itemId);
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    
    return favorites;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
});

// Reproducir archivo
ipcMain.handle('play-media', async (event, filePath) => {
  try {
    // En producción, esto abriría un player nativo o embebido
    // Para ahora, verificamos que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error('Archivo no encontrado');
    }
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error playing media:', error);
    throw error;
  }
});

// Obtener lista de mods instalados
ipcMain.handle('get-installed-mods', async () => {
  try {
    if (!fs.existsSync(MODS_DIR)) {
      return [];
    }
    
    const mods = fs.readdirSync(MODS_DIR).map(dir => {
      const modPath = path.join(MODS_DIR, dir);
      if (fs.statSync(modPath).isDirectory()) {
        const infoPath = path.join(modPath, 'info.txt');
        let info = { name: dir, version: '1.0' };
        if (fs.existsSync(infoPath)) {
          const content = fs.readFileSync(infoPath, 'utf8');
          info = { name: dir, version: '1.0', description: content };
        }
        return info;
      }
      return null;
    }).filter(Boolean);
    
    return mods;
  } catch (error) {
    console.error('Error getting installed mods:', error);
    return [];
  }
});

// Seleccionar archivo local
ipcMain.handle('select-file', async (event, filters) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'Media Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'mp3', 'flac'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, path: null };
  } catch (error) {
    console.error('Error selecting file:', error);
    throw error;
  }
});
