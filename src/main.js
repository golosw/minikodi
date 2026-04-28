/**
 * MiniKodi - Main Process (Electron)
 * PromptOS v14.0 - Industrial AI Software Factory
 * 
 * Contrato R05: Detección Frozen/Dev implementada
 * Contrato R06: Logging Avanzado desde línea 1
 * Contrato R02: Torrent funcional real (webtorrent)
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Importar motor torrent
const TorrentEngine = require('./src/backend/torrent-engine');

// ============================================================================
// CONTRATO R05: DETECCIÓN DE CONTEXTO (Portable vs Desarrollo)
// ============================================================================

function getAppPaths() {
  const isPortable = process.env.PORTABLE_EXECUTABLE_DIR || app.isPackaged;
  const isDev = !app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR;
  
  let basePath;
  
  if (isPortable) {
    // En modo portable: todo relativo al ejecutable
    basePath = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
  } else {
    // En desarrollo: usar directorio del proyecto
    basePath = __dirname;
  }
  
  return {
    basePath,
    isPortable,
    isDev,
    logDir: path.join(basePath, 'log'),
    dataDir: path.join(basePath, 'data'),
    tempDir: path.join(basePath, 'temp'),
    downloadsDir: path.join(basePath, 'downloads')
  };
}

const paths = getAppPaths();

// ============================================================================
// CONTRATO R06: LOGGING AVANZADO
// ============================================================================

class AdvancedLogger {
  constructor(logDir, module = 'main') {
    this.logDir = logDir;
    this.module = module;
    this.logFile = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      
      const dateStr = new Date().toISOString().split('T')[0];
      this.logFile = path.join(this.logDir, `app_${dateStr}.log`);
      
      this._write('INFO', 'INIT', 'Logging iniciado', { 
        module: this.module,
        path: this.logFile,
        context: paths.isPortable ? 'PORTABLE' : 'DEV'
      });
    } catch (error) {
      console.error('[LOGGER] Fallo crítico:', error.message);
    }
  }

  _write(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] [${category}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`;
    
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, logLine);
      } catch (e) {
        console.error('[LOGGER] Error escribiendo log:', e.message);
      }
    }
    
    // También output a consola en modo desarrollo
    if (paths.isDev) {
      console.log(logLine.trim());
    }
  }

  info(category, message, data = null) {
    this._write('INFO', category, message, data);
  }

  debug(category, message, data = null) {
    this._write('DEBUG', category, message, data);
  }

  warn(category, message, data = null) {
    this._write('WARN', category, message, data);
  }

  error(category, message, data = null) {
    this._write('ERROR', category, message, data);
  }
}

const logger = new AdvancedLogger(paths.logDir, 'main');

// ============================================================================
// INICIALIZACIÓN DE RUTAS
// ============================================================================

function initializePaths() {
  logger.info('PATHS', 'Inicializando carpetas...', paths);
  
  const dirsToCreate = [paths.logDir, paths.dataDir, paths.tempDir, paths.downloadsDir];
  
  for (const dir of dirsToCreate) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info('PATHS', `Carpeta creada: ${dir}`);
    } else {
      logger.debug('PATHS', `Carpeta existe: ${dir}`);
    }
  }
  
  logger.info('PATHS', 'Carpetas inicializadas correctamente');
}

// ============================================================================
// MOTOR TORRENT
// ============================================================================

let torrentEngine = null;

function initializeTorrent() {
  try {
    torrentEngine = Object.create(TorrentEngine);
    const result = torrentEngine.initialize(paths.downloadsDir, logger);
    
    if (result.success) {
      logger.info('TORRENT', 'Motor WebTorrent inicializado', { 
        downloadPath: paths.downloadsDir 
      });
    } else {
      logger.error('TORRENT', 'Fallo al inicializar torrent', result);
    }
    
    return result;
  } catch (error) {
    logger.error('TORRENT', 'Excepción al inicializar', { error: error.message, stack: error.stack });
    return { success: false, message: error.message };
  }
}

// ============================================================================
// VENTANA PRINCIPAL
// ============================================================================

let mainWindow = null;

function createWindow() {
  logger.info('WINDOW', 'Creando ventana principal...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'resources', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'MiniKodi v1.0.0',
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    logger.info('WINDOW', 'Ventana cerrada');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('WINDOW', 'Ventana cargada completamente');
    mainWindow.webContents.send('app-ready', {
      version: '1.0.0',
      context: paths.isPortable ? 'PORTABLE' : 'DEV',
      paths: {
        log: paths.logDir,
        data: paths.dataDir,
        temp: paths.tempDir
      }
    });
  });

  mainWindow.webContents.on('crashed', () => {
    logger.error('WINDOW', 'La ventana ha crasheado');
  });

  logger.info('WINDOW', 'Ventana creada exitosamente');
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

function setupIpcHandlers() {
  logger.info('IPC', 'Configurando handlers...');

  // Obtener información de la aplicación
  ipcMain.handle('get-app-info', async () => {
    logger.debug('IPC', 'get-app-info solicitado');
    return {
      version: '1.0.0',
      context: paths.isPortable ? 'PORTABLE' : 'DEV',
      platform: process.platform,
      paths: {
        log: paths.logDir,
        data: paths.dataDir,
        temp: paths.tempDir,
        downloads: paths.downloadsDir
      }
    };
  });

  // ============================================================================
  // HANDLERS DE TORRENT (FUNCIONALIDAD REAL)
  // ============================================================================

  ipcMain.handle('torrent-add', async (event, magnetLink) => {
    logger.info('IPC', 'torrent-add', { magnetLink: magnetLink.substring(0, 50) + '...' });
    
    if (!torrentEngine) {
      const error = { success: false, message: 'Motor torrent no inicializado' };
      logger.error('IPC', 'torrent-add fallido', error);
      return error;
    }

    try {
      const result = await torrentEngine.addTorrent(magnetLink);
      logger.info('IPC', 'torrent-add completado', { 
        success: result.success, 
        name: result.info?.name 
      });
      return result;
    } catch (error) {
      logger.error('IPC', 'torrent-add excepción', { error: error.message });
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('torrent-remove', async (event, infoHash, removeFiles = false) => {
    logger.info('IPC', 'torrent-remove', { infoHash, removeFiles });
    
    if (!torrentEngine) {
      return { success: false, message: 'Motor torrent no inicializado' };
    }

    try {
      const result = await torrentEngine.removeTorrent(infoHash, removeFiles);
      logger.info('IPC', 'torrent-remove completado', result);
      return result;
    } catch (error) {
      logger.error('IPC', 'torrent-remove excepción', { error: error.message });
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('torrent-list', async () => {
    logger.debug('IPC', 'torrent-list solicitado');
    
    if (!torrentEngine) {
      return [];
    }

    return torrentEngine.getActiveTorrents();
  });

  ipcMain.handle('torrent-progress', async (event, infoHash) => {
    if (!torrentEngine) {
      return null;
    }

    return torrentEngine.getTorrentInfo(infoHash);
  });

  // ============================================================================
  // OTROS HANDLERS
  // ============================================================================

  ipcMain.handle('open-file-dialog', async (event, filters = []) => {
    logger.debug('IPC', 'open-file-dialog');
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters
    });
    
    return result;
  });

  ipcMain.handle('open-path', async (event, filePath) => {
    logger.info('IPC', 'open-path', { path: filePath });
    
    try {
      const { shell } = require('electron');
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      logger.error('IPC', 'open-path fallido', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  logger.info('IPC', 'Handlers configurados correctamente');
}

// ============================================================================
// CICLO DE VIDA DE LA APLICACIÓN
// ============================================================================

app.whenReady().then(() => {
  logger.info('APP', '=== MiniKodi Iniciando ===');
  logger.info('APP', 'Contexto', { 
    isPortable: paths.isPortable, 
    isDev: paths.isDev,
    platform: process.platform,
    nodeVersion: process.version
  });

  initializePaths();
  initializeTorrent();
  setupIpcHandlers();
  createWindow();

  logger.info('APP', 'Aplicación lista');
});

app.on('window-all-closed', () => {
  logger.info('APP', 'Todas las ventanas cerradas');
  
  // Limpiar motor torrent
  if (torrentEngine) {
    torrentEngine.destroy().then(() => {
      logger.info('APP', 'Motor torrent destruido');
      app.quit();
    });
  } else {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    logger.info('APP', 'Recreando ventana (macOS activate)');
    createWindow();
  }
});

app.on('will-quit', (event) => {
  logger.info('APP', 'Aplicación terminando...');
  
  // Prevenir cierre inmediato para limpieza asíncrona
  event.preventDefault();
  
  if (torrentEngine) {
    torrentEngine.destroy().then(() => {
      logger.info('APP', 'Limpieza completada, cerrando');
      app.quit();
    });
  } else {
    app.quit();
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('FATAL', 'Excepción no capturada', { 
    message: error.message, 
    stack: error.stack 
  });
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('FATAL', 'Promesa no manejada', { reason: String(reason) });
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

logger.info('MAIN', 'Script principal cargado');
