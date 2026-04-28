/**
 * Motor WebTorrent Real para MiniKodi
 * Implementación completa para descarga de torrents desde magnet links
 * 
 * @module torrent-engine
 */

const WebTorrent = require('webtorrent');
const path = require('path');
const fs = require('fs');

class TorrentEngine {
  constructor() {
    this.client = null;
    this.activeTorrents = new Map();
    this.downloadPath = null;
    this.logger = null;
  }

  /**
   * Inicializa el cliente WebTorrent
   * @param {string} downloadPath - Ruta donde se guardarán las descargas
   * @param {object} logger - Instancia del logger avanzado
   */
  initialize(downloadPath, logger) {
    try {
      this.downloadPath = downloadPath;
      this.logger = logger;
      
      // Crear carpeta de descargas si no existe
      if (!fs.existsSync(this.downloadPath)) {
        fs.mkdirSync(this.downloadPath, { recursive: true });
        this.logger.info('[TORRENT]', `Carpeta de descargas creada: ${this.downloadPath}`);
      }

      // Inicializar cliente WebTorrent
      this.client = new WebTorrent({
        maxConns: 55,
        uploadLimit: 1024 * 1024, // 1 MB/s upload limit
        downloadLimit: 10 * 1024 * 1024 // 10 MB/s download limit
      });

      this.client.on('error', (err) => {
        this.logger.error('[TORRENT]', `Error del cliente: ${err.message}`);
      });

      this.logger.info('[TORRENT]', 'Cliente WebTorrent inicializado correctamente');
      return { success: true, message: 'Motor torrent inicializado' };
    } catch (error) {
      this.logger.error('[TORRENT]', `Fallo al inicializar: ${error.message}`);
      return { 
        success: false, 
        message: `Error al inicializar motor torrent: ${error.message}`,
        error: error.stack 
      };
    }
  }

  /**
   * Añade un torrent desde magnet link o archivo .torrent
   * @param {string} torrentId - Magnet link o path a archivo .torrent
   * @param {string} subFolder - Subcarpeta opcional para organizar descargas
   * @returns {Promise<object>} - Información del torrent añadido
   */
  async addTorrent(torrentId, subFolder = '') {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        const error = { success: false, message: 'Motor torrent no inicializado' };
        this.logger.error('[TORRENT]', error.message);
        return resolve(error);
      }

      try {
        const destPath = subFolder 
          ? path.join(this.downloadPath, subFolder)
          : this.downloadPath;

        // Crear subcarpeta si es necesario
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }

        this.logger.info('[TORRENT]', `Añadiendo torrent: ${torrentId.substring(0, 50)}...`);

        this.client.add(torrentId, { path: destPath }, (torrent) => {
          const torrentInfo = {
            infoHash: torrent.infoHash,
            name: torrent.name,
            length: torrent.length,
            downloaded: 0,
            uploaded: 0,
            downloadSpeed: 0,
            uploadSpeed: 0,
            progress: 0,
            numPeers: 0,
            done: false
          };

          this.activeTorrents.set(torrent.infoHash, {
            torrent,
            info: torrentInfo,
            startTime: Date.now()
          });

          // Event listeners para actualizaciones
          torrent.on('metadata', () => {
            this.logger.info('[TORRENT]', `Metadatos recibidos: ${torrent.name}`);
            this._emitUpdate(torrent.infoHash);
          });

          torrent.on('done', () => {
            this.logger.info('[TORRENT]', `Descarga completada: ${torrent.name}`);
            const stored = this.activeTorrents.get(torrent.infoHash);
            if (stored) {
              stored.info.done = true;
              stored.info.progress = 100;
            }
            this._emitUpdate(torrent.infoHash);
          });

          torrent.on('error', (err) => {
            this.logger.error('[TORRENT]', `Error en torrent ${torrent.infoHash}: ${err.message}`);
            reject({ success: false, message: err.message, infoHash: torrent.infoHash });
          });

          // Actualizar estadísticas periódicamente
          const updateInterval = setInterval(() => {
            if (!this.client || !this.activeTorrents.has(torrent.infoHash)) {
              clearInterval(updateInterval);
              return;
            }

            const stored = this.activeTorrents.get(torrent.infoHash);
            if (stored && !stored.info.done) {
              stored.info.downloaded = torrent.downloaded;
              stored.info.uploaded = torrent.uploaded;
              stored.info.downloadSpeed = torrent.downloadSpeed;
              stored.info.uploadSpeed = torrent.uploadSpeed;
              stored.info.progress = Math.round(torrent.progress * 10000) / 100;
              stored.info.numPeers = torrent.numPeers;
              
              this._emitUpdate(torrent.infoHash);
            }
          }, 1000);

          this.logger.info('[TORRENT]', `Torrent añadido: ${torrent.name} (${torrent.length} bytes)`);
          
          resolve({
            success: true,
            message: 'Torrent añadido correctamente',
            info: torrentInfo
          });
        });

      } catch (error) {
        this.logger.error('[TORRENT]', `Error al añadir torrent: ${error.message}`);
        resolve({ 
          success: false, 
          message: `Error al añadir torrent: ${error.message}`,
          error: error.stack 
        });
      }
    });
  }

  /**
   * Elimina un torrent activo
   * @param {string} infoHash - Hash del torrent a eliminar
   * @param {boolean} removeFiles - Si true, elimina también los archivos descargados
   * @returns {Promise<object>}
   */
  async removeTorrent(infoHash, removeFiles = false) {
    return new Promise((resolve) => {
      if (!this.client || !this.activeTorrents.has(infoHash)) {
        resolve({ 
          success: false, 
          message: 'Torrent no encontrado' 
        });
        return;
      }

      const stored = this.activeTorrents.get(infoHash);
      const torrentName = stored.torrent.name;

      this.client.remove(infoHash, { destroyStore: removeFiles }, () => {
        this.activeTorrents.delete(infoHash);
        this.logger.info('[TORRENT]', `Torrent eliminado: ${torrentName}`);
        resolve({ 
          success: true, 
          message: `Torrent "${torrentName}" eliminado${removeFiles ? ' (archivos borrados)' : ''}` 
        });
      });
    });
  }

  /**
   * Obtiene información de todos los torrents activos
   * @returns {Array<object>} - Lista de torrents con su estado
   */
  getActiveTorrents() {
    const torrents = [];
    for (const [infoHash, stored] of this.activeTorrents.entries()) {
      torrents.push({
        infoHash,
        ...stored.info
      });
    }
    return torrents;
  }

  /**
   * Obtiene información de un torrent específico
   * @param {string} infoHash - Hash del torrent
   * @returns {object|null}
   */
  getTorrentInfo(infoHash) {
    const stored = this.activeTorrents.get(infoHash);
    return stored ? { infoHash, ...stored.info } : null;
  }

  /**
   * Pausa todas las descargas
   */
  pauseAll() {
    if (!this.client) return;
    
    for (const [, stored] of this.activeTorrents.entries()) {
      stored.torrent.pause();
    }
    this.logger.info('[TORRENT]', 'Todas las descargas pausadas');
  }

  /**
   * Reanuda todas las descargas
   */
  resumeAll() {
    if (!this.client) return;
    
    for (const [, stored] of this.activeTorrents.entries()) {
      stored.torrent.resume();
    }
    this.logger.info('[TORRENT]', 'Todas las descargas reanudadas');
  }

  /**
   * Detiene el cliente WebTorrent (cierra todas las conexiones)
   * @returns {Promise<void>}
   */
  async destroy() {
    return new Promise((resolve) => {
      if (!this.client) {
        resolve();
        return;
      }

      this.logger.info('[TORRENT]', 'Deteniendo cliente WebTorrent...');
      
      // Eliminar todos los torrents
      const removals = [];
      for (const [infoHash] of this.activeTorrents.entries()) {
        removals.push(this.removeTorrent(infoHash, false));
      }

      Promise.all(removals).then(() => {
        this.client.destroy((err) => {
          if (err) {
            this.logger.error('[TORRENT]', `Error al destruir cliente: ${err.message}`);
          } else {
            this.logger.info('[TORRENT]', 'Cliente WebTorrent destruido correctamente');
          }
          this.client = null;
          this.activeTorrents.clear();
          resolve();
        });
      });
    });
  }

  /**
   * Emite actualización de estado (para comunicación con renderer)
   * @private
   */
  _emitUpdate(infoHash) {
    // Esta función sería conectada con ipcMain para notificar al renderer
    // Se implementa en main.js cuando se registra el handler
    const info = this.getTorrentInfo(infoHash);
    if (info) {
      this.logger.debug('[TORRENT]', `Actualización: ${info.name} - ${info.progress}%`);
    }
  }

  /**
   * Formatea bytes a string legible
   * @param {number} bytes - Cantidad de bytes
   * @returns {string}
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatea velocidad (bytes/seg)
   * @param {number} bytesPerSec
   * @returns {string}
   */
  static formatSpeed(bytesPerSec) {
    return this.formatBytes(bytesPerSec) + '/s';
  }
}

// Exportar instancia singleton
module.exports = new TorrentEngine();
