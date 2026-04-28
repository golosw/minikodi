# MiniKodi - Reproductor Multimedia Estilo Kodi

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/minikodi/minikodi)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/minikodi/minikodi)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/minikodi/minikodi/blob/main/LICENSE)

## 📺 Descripción

**MiniKodi** es un reproductor multimedia de código abierto inspirado en Kodi, diseñado para usuarios de **nivel 0** (sin conocimientos técnicos). Permite:

- ✅ **Búsqueda e instalación automática de mods** en formato ZIP
- ✅ **Reproductor multimedia** integrado para archivos locales
- ✅ **Descarga Torrent** con interfaz visual sencilla
- ✅ **Gestión de favoritos** para acceso rápido a contenido
- ✅ **Interfaz moderna** y fácil de usar
- ✅ **Portable** - funciona en Windows 10+ y Linux sin configuración

## 🚀 Instalación Rápida

### Windows

1. Descarga el instalador o clona este repositorio
2. Ejecuta `installers/install.bat` con doble-click
3. Espera a que se complete la instalación (se abrirá la carpeta `dist/`)
4. Ejecuta `MiniKodi Setup.exe` desde la carpeta `dist/`

**Requisitos:**
- Windows 10 o superior
- Conexión a internet (para descargar Node.js automáticamente si no está instalado)

### Linux

1. Abre una terminal en el directorio del proyecto
2. Ejecuta:
   ```bash
   chmod +x installers/install.sh
   ./installers/install.sh
   ```
3. Una vez completado, ejecuta el AppImage o instala el paquete `.deb`:
   ```bash
   # Opción 1: AppImage (portable)
   ./dist/MiniKodi-1.0.0.AppImage
   
   # Opción 2: Paquete DEB (instalación permanente)
   sudo dpkg -i dist/minikodi_1.0.0_amd64.deb
   ```

**Distribuciones soportadas:**
- Ubuntu 22.04+
- Fedora 37+
- Arch Linux / Manjaro

## 🎯 Características Principales

### 📦 Gestión de Mods

- **Buscar mods**: Usa la barra de búsqueda para encontrar skins, reproductores, addons
- **Instalar con 1 click**: Los mods se descargan e instalan automáticamente
- **Mods incluidos de ejemplo**:
  - Skin Ocean Dark
  - Video Player Enhanced
  - Torrent Integrator
  - Favorites Manager Pro
  - Subtitle Downloader

### 🎥 Reproductor Multimedia

- Soporta formatos: MP4, MKV, AVI, MOV, MP3, FLAC
- Apertura de archivos locales con selector nativo
- Reproducción desde favoritos
- Interfaz limpia tipo "teatro"

### 🌐 Cliente Torrent Integrado

- Pega enlaces magnet y descarga directamente
- Visualización de progreso en tiempo real
- Estadísticas de velocidad (subida/bajada)
- Gestión de peers
- Descargas en segundo plano

### ⭐ Favoritos

- Guarda tus mods, películas o series favoritas
- Acceso rápido desde cualquier sección
- Persistencia entre sesiones
- Eliminación sencilla

## 🏗️ Arquitectura Técnica

```
MiniKodi/
├── main.js              ← Proceso principal Electron (Node.js)
├── preload.js           ← Bridge seguro main↔renderer
├── src/renderer/
│   └── index.html       ← Frontend completo (HTML/CSS/JS)
├── installers/
│   ├── install.bat      ← Instalador Windows (ASCII, CRLF)
│   └── install.sh       ← Instalador Linux (UTF-8, LF)
├── resources/           ← Iconos y assets
├── package.json         ← Dependencias y configuración de build
└── electron-builder.yml ← Configuración de empaquetado
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Framework | Electron 28.x |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Backend | Node.js (procesos IPC) |
| Torrent | WebTorrent |
| Empaquetado | electron-builder |
| Mods | ZIP extraction (extract-zip) |

### Seguridad

- ✅ `contextIsolation: true` — Aislamiento del contexto
- ✅ `nodeIntegration: false` — Sin acceso directo a Node desde renderer
- ✅ IPC vía `contextBridge` — Comunicación segura
- ✅ Sin uso de `remote` module — Previene ataques de inyección

## 📁 Estructura de Datos

La aplicación crea los siguientes directorios en tiempo de ejecución:

```
[UserData]/
├── mods/                ← Mods instalados
│   ├── mod1/
│   └── mod2/
├── favorites.json       ← Lista de favoritos persistente
└── log/                 ← Logs de la aplicación
```

**Ubicaciones por plataforma:**

| Plataforma | Ruta UserData |
|------------|--------------|
| Windows | `%APPDATA%\minikodi` |
| Linux | `~/.config/minikodi` |
| macOS | `~/Library/Application Support/minikodi` |

## 🔧 Desarrollo

### Prerrequisitos

- Node.js 18.x o superior
- npm 9.x o superior

### Instalación para desarrollo

```bash
# Clonar repositorio
git clone https://github.com/minikodi/minikodi.git
cd minikodi

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Build para producción
npm run build        # Windows + Linux
npm run build:win    # Solo Windows
npm run build:linux  # Solo Linux
```

### Tests

```bash
npm test
```

## 📝 Roadmap

- [ ] Integración con API real de repositorio de mods
- [ ] Reproductor de video embebido (MPV/VLC backend)
- [ ] Soporte para subtítulos automáticos
- [ ] Scraping de metadatos (TMDB, TVDB)
- [ ] Actualizador automático (electron-updater)
- [ ] Temas personalizables
- [ ] Atajos de teclado configurables

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

**El instalador se cierra inmediatamente (Windows)**
- Verifica que no haya caracteres especiales en la ruta
- Ejecuta como administrador si hay errores de permisos
- Revisa `log/install.log` para detalles

**Error al construir en Linux**
- Instala dependencias del sistema:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6
  
  # Fedora
  sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst
  ```

**WebTorrent no funciona**
- Verifica tu conexión a internet
- Algunos ISPs bloquean tráfico torrent
- Prueba con torrents públicos de prueba

### Contacto

- Issues: https://github.com/minikodi/minikodi/issues
- Email: soporte@minikodi.dev (próximamente)

---

**Hecho con ❤️ para usuarios que solo quieren ver su contenido sin complicaciones.**
