# MiniKodi v1.0.0 - Reproductor Multimedia Portable

[![Estado](https://img.shields.io/badge/estado-listo-success)](https://github.com/golosw/minikodi)
[![Versión](https://img.shields.io/badge/versión-1.0.0-blue)](https://github.com/golosw/minikodi/releases)
[![PromptOS](https://img.shields.io/badge/PromptOS-v14.0-orange)](https://promptos.dev)

## 📖 Descripción

MiniKodi es un reproductor multimedia de escritorio **100% portable** que no requiere instalación. Diseñado bajo el estándar **PromptOS v14.0 Hardened**, garantiza:

- ✅ **Cero intervención**: Doble-click y funciona en cualquier PC limpio
- ✅ **Portabilidad real**: Crea sus propias carpetas (log/, data/, temp/) al ejecutar
- ✅ **Logging avanzado**: Registros detallados desde el primer segundo
- ✅ **Sin placeholders**: Todas las funcionalidades UI tienen backend real o están explícitamente deshabilitadas

## 🚀 Instalación para Usuario Final

### Windows
1. Descargar `MiniKodi-Portable-1.0.0.exe` desde [Releases](https://github.com/golosw/minikodi/releases)
2. Hacer doble-click en el archivo descargado
3. ¡Listo! La aplicación se ejecuta sin instalar nada

### Linux
1. Descargar `MiniKodi-1.0.0.AppImage`
2. Dar permisos de ejecución: `chmod +x MiniKodi-1.0.0.AppImage`
3. Ejecutar: `./MiniKodi-1.0.0.AppImage`

### Carpetas Generadas Automáticamente
Al ejecutar, MiniKodi crea en su misma ubicación:
```
MiniKodi-Portable/
├── log/          # Logs detallados de ejecución
├── data/         # Favoritos y configuración persistente
└── temp/         # Archivos temporales de trabajo
```

## 🎯 Funcionalidades

### ✅ Completadas (Fase 1)
- **Reproductor Multimedia**: Soporte para video (mp4, mkv, avi) y audio (mp3, flac)
- **Gestor de Mods**: Instalación desde archivos ZIP locales
- **Favoritos**: Sistema persistente de marcadores
- **Logging Avanzado**: Logs rotativos con niveles (INFO, DEBUG, WARN, ERROR)
- **Detección Portable**: Paths dinámicos según contexto (dev vs producción)
- **UI Responsiva**: Diseño moderno en modo oscuro

### ⏸️ Pendientes (Fase 2 - Explícitamente Deshabilitadas)
- **Torrent**: Botón gris en UI con tooltip "Próximamente - Fase 2"
- **Actualizador Automático**: Conectado a GitHub Releases
- **Búsqueda Online de Mods**: API real de repositorios Kodi
- **Player Nativo Embebido**: Integración con VLC/MPV

## 🛠️ Para Desarrolladores

### Prerrequisitos
- Node.js 18+ 
- npm 9+

### Build desde Código Fuente

```bash
# Clonar repositorio
git clone https://github.com/golosw/minikodi.git
cd minikodi

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Construir ejecutables
npm run build:win    # Windows .exe portable
npm run build:linux  # Linux .AppImage
```

### Estructura del Proyecto
```
minikodi/
├── src/
│   ├── main.js              # Proceso principal Electron
│   ├── preload.js           # Puente seguro IPC
│   ├── backend/
│   │   └── torrent-engine.js # Motor WebTorrent (Fase 2)
│   └── renderer/
│       ├── index.html       # Interfaz de usuario
│       ├── styles.css       # Estilos
│       └── renderer.js      # Lógica UI
├── resources/
│   ├── icon.ico             # Icono Windows (multi-resolución)
│   └── icon.png             # Icono Linux (512x512)
├── help.txt                 # Documentación para usuario final
├── package.json             # Dependencias y configuración build
├── install.bat              # Script build Windows (desarrollador)
└── install.sh               # Script build Linux (desarrollador)
```

### Scripts de Build (Solo Desarrollador)
Estos scripts **NO** se distribuyen al usuario final:

**Windows (install.bat)**:
```batch
instala Node.js si falta
ejecuta npm install
construye dist/MiniKodi-Portable-1.0.0.exe
abre carpeta dist/ automáticamente
```

**Linux (install.sh)**:
```bash
detecta distribución
instala dependencias sistema (si necesarias)
ejecuta npm install
construye dist/MiniKodi-1.0.0.AppImage
abre carpeta dist/ automáticamente
```

## 📊 Stack Tecnológico

| Componente | Tecnología | Estado |
|------------|-----------|--------|
| Framework Desktop | Electron 28.x | ✅ Activo |
| Motor Torrent | WebTorrent 1.9.7 | ⏸️ Fase 2 |
| Empaquetado | electron-builder | ✅ Configurado |
| Logging | Custom AdvancedLogger | ✅ Implementado |
| UI | HTML5/CSS3/Vanilla JS | ✅ Completa |

## 🔍 Troubleshooting

### El ejecutable no arranca
1. Revisar logs en carpeta `log/app_YYYY-MM-DD.log`
2. Verificar que no haya antivirus bloqueando
3. Ejecutar como administrador (solo si es necesario)

### Error "Missing DLL" en Windows
- **No debería ocurrir**: El build es 100% portable
- Si ocurre, reportar issue con logs adjuntos

### Los favoritos no se guardan
- Verificar permisos de escritura en la carpeta del ejecutable
- Revisar logs para errores de I/O

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📬 Contacto

- **Repositorio**: https://github.com/golosw/minikodi
- **Issues**: https://github.com/golosw/minikodi/issues
- **Releases**: https://github.com/golosw/minikodi/releases

---

*Construido bajo estándar PromptOS v14.0 Hardened*  
*Última actualización: 2025-04-28*
