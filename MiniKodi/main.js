const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const extractZip = require('extract-zip');

// ============================================
// SISTEMA DE LOGGING AVANZADO (DEBUG MODE)
// ============================================

class AdvancedLogger {
  constructor() {
    this.logDir = null;
    this.logFile = null;
    this.logStream = null;
    this.isPortable = false;
    this.startTime = new Date();
    this.phaseTimings = {};
  }

  initialize() {
    const exePath = process.execPath;
    const exeDir = path.dirname(exePath);
    
    // Detectar modo portable
    const portableLocations = ['Desktop', 'Downloads'];
    const currentFolder = exeDir.split(path.sep).pop().toLowerCase();
    const isRoot = exeDir.length <= 3;
    
    this.isPortable = portableLocations.some(loc => 
      exeDir.toLowerCase().includes(loc.toLowerCase())
    ) || isRoot || process.env.PORTABLE === 'true';

    if (this.isPortable) {
      this.logDir = path.join(exeDir, 'log');
    } else {
      this.logDir = path.join(app.getPath('userData'), 'log');
    }

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.logFile = path.join(this.logDir, `minikodi-${timestamp}.log`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a', encoding: 'utf8' });

    this._writeRaw(`\n${'='.repeat(80)}\n`);
    this._writeRaw(`MiniKodi v1.0.0 - Advanced Debug Log\n`);
    this._writeRaw(`Session Start: ${this.startTime.toISOString()}\n`);
    this._writeRaw(`${'='.repeat(80)}\n\n`);

    this.info('INIT', 'Starting MiniKodi v1.0.0');
    this.debug('SYSTEM', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      v8Version: process.versions.v8,
      exePath: exePath,
      exeDir: exeDir,
      isPortable: this.isPortable,
      logDir: this.logDir,
      logFile: this.logFile,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORTABLE: process.env.PORTABLE,
        APPDATA: process.env.APPDATA,
        USERPROFILE: process.env.USERPROFILE,
        HOME: process.env.HOME,
        PATH_LENGTH: process.env.PATH ? process.env.PATH.length : 0
      },
      memory: {
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
      }
    });

    return this.logFile;
  }

  _writeRaw(message) {
    if (this.logStream) {
      this.logStream.write(message);
      this.logStream.flush();
    }
  }

  _formatTimestamp() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0] + ',' + String(now.getMilliseconds()).padStart(3, '0');
    return `[${date} ${time}]`;
  }

  info(phase, message, data = null) {
    this._log('INFO', phase, message, data);
  }

  debug(phase, data) {
    this._log('DEBUG', phase, null, data);
  }

  error(phase, message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      syscall: error.syscall
    } : null;
    this._log('ERROR', phase, message, errorData);
  }

  warn(phase, message, data = null) {
    this._log('WARN', phase, message, data);
  }

  _log(level, phase, message, data) {
    const timestamp = this._formatTimestamp();
    const levelStr = `[${level}]`.padEnd(7);
    const phaseStr = `[${phase}]`.padEnd(15);
    
    let line = `${timestamp} ${levelStr} ${phaseStr}`;
    
    if (message) {
      line += ` ${message}`;
    }

    this._writeRaw(line + '\n');

    if (data !== null && data !== undefined) {
      if (typeof data === 'object') {
        try {
          const formatted = JSON.stringify(data, null, 2);
          const indented = formatted.split('\n').map(l => `    ${l}`).join('\n');
          this._writeRaw(indented + '\n');
        } catch (e) {
          this._writeRaw(`    [Object serialization error: ${e.message}]\n`);
        }
      } else {
        this._writeRaw(`    ${data}\n`);
      }
    }

    if (this.logStream) {
      this.logStream.flush();
    }
  }

  startPhase(phaseName) {
    this.phaseTimings[phaseName] = { start: Date.now(), end: null };
    this.info(phaseName, `>>> STARTING PHASE: ${phaseName}`);
  }

  endPhase(phaseName, success = true, details = null) {
    if (this.phaseTimings[phaseName]) {
      this.phaseTimings[phaseName].end = Date.now();
      const duration = this.phaseTimings[phaseName].end - this.phaseTimings[phaseName].start;
      const status = success ? 'SUCCESS' : 'FAILED';
      this.info(phaseName, `<<< ENDING PHASE: ${phaseName} - ${status} (${duration}ms)`);
      if (details) {
        this.debug(phaseName, details);
      }
    }
  }

  userEvent(action, details) {
    this.info('USER_EVENT', `User action: ${action}`, details);
  }

  close() {
    if (this.logStream) {
      this.info('SHUTDOWN', 'Closing logger and flushing buffers');
      this._writeRaw(`\n${'='.repeat(80)}\n`);
      this._writeRaw(`Session End: ${new Date().toISOString()}\n`);
      this._writeRaw(`Total Duration: ${Date.now() - this.startTime.getTime()}ms\n`);
      this._writeRaw(`${'='.repeat(80)}\n`);
      this.logStream.end();
      this.logStream = null;
    }
  }
}

const logger = new AdvancedLogger();
let logInitialized = false;

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

let mainWindow;
let MODS_DIR;
let FAVORITES_FILE;

// Inicializar logger y paths cuando app esté lista
app.on('ready', () => {
  try {
    const logFile = logger.initialize();
    logInitialized = true;
    
    // Ahora que app está ready, podemos usar app.getPath()
    MODS_DIR = path.join(app.getPath('userData'), 'mods');
    FAVORITES_FILE = path.join(app.getPath('userData'), 'favorites.json');
    
    logger.info('PATHS', 'Paths configured', {
      userData: app.getPath('userData'),
      modsDir: MODS_DIR,
      favoritesFile: FAVORITES_FILE
    });
  } catch (error) {
    console.error('Failed to initialize logger:', error);
  }
});

// Asegurar directorios existen
logger.startPhase('INITIALIZATION');
if (!fs.existsSync(MODS_DIR)) {
  fs.mkdirSync(MODS_DIR, { recursive: true });
  logger.info('INIT', 'Created MODS_DIR', { path: MODS_DIR });
} else {
  logger.info('INIT', 'MODS_DIR already exists', { path: MODS_DIR });
}

if (!fs.existsSync(path.dirname(FAVORITES_FILE))) {
  fs.mkdirSync(path.dirname(FAVORITES_FILE), { recursive: true });
}
logger.endPhase('INITIALIZATION', true, { modsDir: MODS_DIR, favoritesFile: FAVORITES_FILE });

function createWindow() {
  logger.startPhase('WINDOW_CREATION');
  
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

  logger.info('WINDOW', 'BrowserWindow created', {
    width: 1280,
    height: 720,
    contextIsolation: true,
    nodeIntegration: false
  });

  mainWindow.loadFile('src/renderer/index.html');
  logger.info('WINDOW', 'Loading index.html');
  
  mainWindow.once('ready-to-show', () => {
    logger.info('WINDOW', 'Ready to show - displaying window');
    mainWindow.show();
    logger.endPhase('WINDOW_CREATION', true);
  });

  mainWindow.on('closed', () => {
    logger.info('WINDOW', 'Window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('WINDOW', 'Page loaded successfully');
  });

  mainWindow.webContents.on('crashed', () => {
    logger.error('WINDOW', 'Renderer process crashed');
  });
}

app.whenReady().then(() => {
  logger.startPhase('APP_READY');
  logger.info('APP', 'Electron app is ready');
  createWindow();
  logger.endPhase('APP_READY', true);
});

app.on('window-all-closed', () => {
  logger.info('APP', 'All windows closed - quitting application');
  if (process.platform !== 'darwin') {
    logger.close();
    app.quit();
  }
});

app.on('activate', () => {
  logger.info('APP', 'Activate event received');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Evento de shutdown limpio
app.on('before-quit', () => {
  logger.startPhase('SHUTDOWN');
  logger.info('APP', 'Application is about to quit');
});

app.on('will-quit', (event) => {
  logger.info('APP', 'Application will quit - closing logger');
  logger.close();
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
  logger.userEvent('GET_FAVORITES');
  try {
    if (!fs.existsSync(FAVORITES_FILE)) {
      logger.info('FAVORITES', 'No favorites file found - returning empty array');
      return [];
    }
    const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
    const favorites = JSON.parse(data);
    logger.info('FAVORITES', 'Loaded favorites', { count: favorites.length });
    return favorites;
  } catch (error) {
    logger.error('FAVORITES', 'Error getting favorites', error);
    return [];
  }
});

ipcMain.handle('add-favorite', async (event, item) => {
  logger.userEvent('ADD_FAVORITE', { itemId: item.id, itemName: item.name });
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
      logger.info('FAVORITES', 'Added favorite', { item });
    } else {
      logger.warn('FAVORITES', 'Duplicate favorite ignored', { itemId: item.id });
    }
    
    return favorites;
  } catch (error) {
    logger.error('FAVORITES', 'Error adding favorite', error);
    throw error;
  }
});

ipcMain.handle('remove-favorite', async (event, itemId) => {
  logger.userEvent('REMOVE_FAVORITE', { itemId });
  try {
    let favorites = [];
    if (fs.existsSync(FAVORITES_FILE)) {
      const data = fs.readFileSync(FAVORITES_FILE, 'utf8');
      favorites = JSON.parse(data);
    }
    
    favorites = favorites.filter(f => f.id !== itemId);
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    logger.info('FAVORITES', 'Removed favorite', { itemId, remaining: favorites.length });
    
    return favorites;
  } catch (error) {
    logger.error('FAVORITES', 'Error removing favorite', error);
    throw error;
  }
});

// Reproducir archivo
ipcMain.handle('play-media', async (event, filePath) => {
  logger.userEvent('PLAY_MEDIA', { filePath });
  try {
    // En producción, esto abriría un player nativo o embebido
    // Para ahora, verificamos que el archivo existe
    if (!fs.existsSync(filePath)) {
      logger.error('PLAY_MEDIA', 'File not found', { filePath });
      throw new Error('Archivo no encontrado');
    }
    logger.info('PLAY_MEDIA', 'Media ready to play', { 
      filePath, 
      sizeBytes: fs.statSync(filePath).size 
    });
    return { success: true, path: filePath };
  } catch (error) {
    logger.error('PLAY_MEDIA', 'Error playing media', error);
    throw error;
  }
});

// Obtener lista de mods instalados
ipcMain.handle('get-installed-mods', async () => {
  logger.userEvent('GET_INSTALLED_MODS');
  try {
    if (!fs.existsSync(MODS_DIR)) {
      logger.info('MODS', 'MODS_DIR does not exist - returning empty array');
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
    
    logger.info('MODS', 'Found installed mods', { count: mods.length, mods: mods.map(m => m.name) });
    return mods;
  } catch (error) {
    logger.error('MODS', 'Error getting installed mods', error);
    return [];
  }
});

// Seleccionar archivo local
ipcMain.handle('select-file', async (event, filters) => {
  logger.userEvent('SELECT_FILE', { filters });
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'Media Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'mp3', 'flac'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      logger.info('SELECT_FILE', 'File selected', { path: result.filePaths[0] });
      return { success: true, path: result.filePaths[0] };
    }
    logger.info('SELECT_FILE', 'File selection cancelled');
    return { success: false, path: null };
  } catch (error) {
    logger.error('SELECT_FILE', 'Error selecting file', error);
    throw error;
  }
});

logger.endPhase('IPC_HANDLERS_REGISTRATION', true);
