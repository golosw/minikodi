/**
 * MiniKodi - Renderer Process
 * Maneja la interfaz de usuario y comunicación con el proceso principal
 */

const { ipcRenderer } = require('electron');

// Estado de la aplicación
let currentSection = 'home';
let favorites = [];
let installedMods = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RENDERER] Iniciando MiniKodi UI...');
    initializeNavigation();
    loadDashboard();
    loadFavorites();
    displayPaths();
});

// Navegación entre secciones
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn:not(.disabled)');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            switchSection(sectionId);
        });
    });

    // Manejar botones deshabilitados (mostrar tooltip)
    const disabledButtons = document.querySelectorAll('.nav-btn.disabled');
    disabledButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('⏸️ Esta funcionalidad estará disponible en Fase 2', 'warning');
        });
    });
}

function switchSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Activar botón correspondiente
        const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        console.log(`[RENDERER] Sección cambiada a: ${sectionId}`);
    }
}

// Cargar dashboard
async function loadDashboard() {
    try {
        const stats = await ipcRenderer.invoke('get-dashboard-stats');
        document.getElementById('mods-count').textContent = stats.mods || 0;
        document.getElementById('favorites-count').textContent = stats.favorites || 0;
        document.getElementById('recent-count').textContent = stats.recent || 0;
    } catch (error) {
        console.error('[RENDERER] Error cargando dashboard:', error);
    }
}

// Cargar favoritos
async function loadFavorites() {
    try {
        const result = await ipcRenderer.invoke('get-favorites');
        favorites = result.success ? result.data : [];
        renderFavorites();
    } catch (error) {
        console.error('[RENDERER] Error cargando favoritos:', error);
    }
}

function renderFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No hay favoritos guardados</p>';
        return;
    }

    favorites.forEach((fav, index) => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.innerHTML = `
            <h4>${fav.name}</h4>
            <p>${fav.path}</p>
            <button class="remove-btn" data-index="${index}" title="Eliminar">×</button>
        `;
        container.appendChild(item);
    });

    // Añadir listeners para eliminar
    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            await removeFavorite(index);
        });
    });
}

async function removeFavorite(index) {
    try {
        const favorite = favorites[index];
        const result = await ipcRenderer.invoke('remove-favorite', favorite.path);
        
        if (result.success) {
            showNotification('Favorito eliminado', 'success');
            loadFavorites();
            loadDashboard();
        } else {
            showNotification('Error al eliminar: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[RENDERER] Error eliminando favorito:', error);
        showNotification('Error al eliminar favorito', 'error');
    }
}

// Mostrar rutas del sistema
async function displayPaths() {
    try {
        const paths = await ipcRenderer.invoke('get-system-paths');
        const display = document.getElementById('paths-display');
        if (display) {
            display.textContent = JSON.stringify(paths, null, 2);
        }
    } catch (error) {
        console.error('[RENDERER] Error obteniendo rutas:', error);
    }
}

// Event Listeners para botones de acción
document.addEventListener('DOMContentLoaded', () => {
    // Botón Explorar Mods
    const btnBrowseMods = document.getElementById('btn-browse-mods');
    if (btnBrowseMods) {
        btnBrowseMods.addEventListener('click', () => {
            switchSection('mods');
        });
    }

    // Botón Buscar Mods
    const btnSearchMods = document.getElementById('btn-search-mods');
    if (btnSearchMods) {
        btnSearchMods.addEventListener('click', searchMods);
    }

    // Input de búsqueda con Enter
    const modSearchInput = document.getElementById('mod-search');
    if (modSearchInput) {
        modSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMods();
        });
    }

    // Botón Instalar ZIP
    const btnInstallZip = document.getElementById('btn-install-zip');
    if (btnInstallZip) {
        btnInstallZip.addEventListener('click', installModFromZip);
    }

    // Botón Abrir Archivo Multimedia
    const btnOpenFile = document.getElementById('btn-open-file');
    if (btnOpenFile) {
        btnOpenFile.addEventListener('click', () => {
            document.getElementById('media-file-input').click();
        });
    }

    // Input de archivo multimedia
    const mediaFileInput = document.getElementById('media-file-input');
    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', handleMediaFileSelect);
    }

    // Botón Añadir Favorito
    const btnAddFavorite = document.getElementById('btn-add-favorite');
    if (btnAddFavorite) {
        btnAddFavorite.addEventListener('click', addFavoriteDialog);
    }

    // Botón Reproducir Archivo
    const btnPlayMedia = document.getElementById('btn-play-media');
    if (btnPlayMedia) {
        btnPlayMedia.addEventListener('click', () => {
            switchSection('media');
            document.getElementById('btn-open-file').click();
        });
    }

    // Botón Buscar Actualizaciones
    const btnCheckUpdates = document.getElementById('btn-check-updates');
    if (btnCheckUpdates) {
        btnCheckUpdates.addEventListener('click', checkForUpdates);
    }

    // Botón Abrir help.txt
    const btnOpenHelp = document.getElementById('btn-open-help-file');
    if (btnOpenHelp) {
        btnOpenHelp.addEventListener('click', async () => {
            const result = await ipcRenderer.invoke('open-help-file');
            if (!result.success) {
                showNotification('Error abriendo help.txt: ' + result.message, 'error');
            }
        });
    }
});

// Búsqueda de mods (simulada - Fase 1)
async function searchMods() {
    const query = document.getElementById('mod-search').value.trim();
    const resultsContainer = document.getElementById('mods-results');
    
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<p>Buscando...</p>';

    try {
        // Simulación de búsqueda - en Fase 2 conectar a API real
        const mockMods = [
            { name: 'Skin Aeon Nox', description: 'Skin popular para Kodi', version: '7.0.0' },
            { name: 'Repository Official', description: 'Repositorio oficial de addons', version: '1.0.0' },
            { name: 'PVR Simple Client', description: 'Cliente PVR para TV en vivo', version: '2.1.0' },
            { name: 'YouTube Addon', description: 'Ver videos de YouTube', version: '6.8.0' }
        ];

        const filtered = query 
            ? mockMods.filter(mod => mod.name.toLowerCase().includes(query.toLowerCase()))
            : mockMods;

        renderModsResults(filtered);
    } catch (error) {
        console.error('[RENDERER] Error buscando mods:', error);
        resultsContainer.innerHTML = '<p style="color: var(--error)">Error en la búsqueda</p>';
    }
}

function renderModsResults(mods) {
    const container = document.getElementById('mods-results');
    if (!container) return;

    container.innerHTML = '';

    if (mods.length === 0) {
        container.innerHTML = '<p>No se encontraron mods</p>';
        return;
    }

    mods.forEach(mod => {
        const item = document.createElement('div');
        item.className = 'mod-item';
        item.innerHTML = `
            <h4>${mod.name}</h4>
            <p>${mod.description}</p>
            <p><small>v${mod.version}</small></p>
            <button class="action-btn" onclick="installMockMod('${mod.name}')">Instalar</button>
        `;
        container.appendChild(item);
    });
}

// Función global para instalación mock
window.installMockMod = async (modName) => {
    showNotification(`⏸️ Instalación de "${modName}" pendiente - Fase 2`, 'warning');
};

// Instalación desde ZIP
async function installModFromZip() {
    const input = document.getElementById('mod-zip-input');
    const file = input.files[0];

    if (!file) {
        showNotification('Selecciona un archivo ZIP primero', 'warning');
        return;
    }

    try {
        const filePath = input.value; // Ruta completa del archivo
        const result = await ipcRenderer.invoke('install-mod-zip', filePath);

        if (result.success) {
            showNotification(`Mod instalado: ${result.message}`, 'success');
            loadDashboard();
            input.value = ''; // Limpiar input
        } else {
            showNotification('Error instalando mod: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[RENDERER] Error instalando ZIP:', error);
        showNotification('Error instalando mod desde ZIP', 'error');
    }
}

// Selección de archivo multimedia
async function handleMediaFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const filePath = event.target.value;
    
    try {
        const result = await ipcRenderer.invoke('play-media', filePath);
        
        if (result.success) {
            const isVideo = file.type.startsWith('video/') || filePath.match(/\.(mp4|mkv|avi|mov|wmv)$/i);
            const player = isVideo 
                ? document.getElementById('media-player')
                : document.getElementById('audio-player');
            
            if (player) {
                player.src = filePath;
                player.play();
                showNotification('Reproduciendo: ' + file.name, 'success');
                
                // Añadir a recientes (en implementación real)
            } else {
                showNotification('Reproductor no disponible', 'error');
            }
        } else {
            showNotification('Error reproduciendo: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[RENDERER] Error reproduciendo archivo:', error);
        showNotification('Error reproduciendo archivo', 'error');
    }
}

// Diálogo para añadir favorito
async function addFavoriteDialog() {
    const name = prompt('Nombre para el favorito:');
    if (!name) return;

    // En una implementación real, abriría un diálogo de selección de archivo
    const path = prompt('Ruta completa del archivo/carpeta:');
    if (!path) return;

    try {
        const result = await ipcRenderer.invoke('add-favorite', { name, path });
        
        if (result.success) {
            showNotification('Favorito añadido', 'success');
            loadFavorites();
            loadDashboard();
        } else {
            showNotification('Error añadiendo favorito: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[RENDERER] Error añadiendo favorito:', error);
        showNotification('Error añadiendo favorito', 'error');
    }
}

// Verificar actualizaciones
async function checkForUpdates() {
    const btn = document.getElementById('btn-check-updates');
    if (btn) btn.disabled = true;

    try {
        const result = await ipcRenderer.invoke('check-for-updates');
        
        if (result.success) {
            if (result.updateAvailable) {
                showNotification(`Actualización disponible: ${result.version}`, 'info');
                const confirmUpdate = confirm('¿Descargar e instalar actualización?');
                if (confirmUpdate) {
                    await ipcRenderer.invoke('download-update');
                }
            } else {
                showNotification('Ya tienes la última versión', 'success');
            }
        } else {
            showNotification('Error verificando actualizaciones: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('[RENDERER] Error verificando actualizaciones:', error);
        showNotification('Error verificando actualizaciones', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Escuchar eventos del proceso principal
ipcRenderer.on('torrent-event', (event, data) => {
    console.log('[RENDERER] Evento torrent:', data);
    showNotification(data.message, data.type);
});

ipcRenderer.on('update-status', (event, data) => {
    console.log('[RENDERER] Estado de actualización:', data);
    showNotification(data.message, data.type);
});

console.log('[RENDERER] UI inicializada correctamente');
