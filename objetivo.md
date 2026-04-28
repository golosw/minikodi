# RESUMEN TÉCNICO: Aplicación MiniKodi v3.0

## Objetivo Principal
Reproductor multimedia estilo Kodi para usuarios nivel 0, con búsqueda e instalación automática de mods en ZIP, gestión de favoritos persistente, y reproductor integrado con soporte torrent. El usuario solo debe hacer doble-click al EXE final y funcionar sin instalación ni preguntas.

## Cambio Estructural Principal: Separación de Contextos
**Antes (v1-v2)**: Ambigüedad peligrosa - `install.bat` podía ser para desarrollador o usuario final.  
**Ahora (v3)**: Separación explícita:

- **Desarrollador**: `install.bat/sh` → compila → `dist/`
- **Usuario Final**: `dist/AppName.exe` → doble-click → funciona

La herramienta `install.bat` es exclusivamente para build, **no se distribuye al usuario final**. El producto es la carpeta `dist/`.

## Qué va DENTRO del binario
Configuración exacta de qué incluir con electron-builder en `package.json`:

**Incluir:**
- `main.js`, `preload.js`, `src/renderer/**`
- `node_modules/` (automático)
- `webtorrent`, `extract-zip`
- `resources/icon.*`

**No incluir:**
- DLLs del sistema como `msvcp140.dll`, `vcruntime140.dll` (ya presentes en Win10+)

Esto evita problemas como el de OpenSSL que costó 6 iteraciones en versiones anteriores.

## Carpetas creadas al primer arranque
El ejecutable crea automáticamente al iniciar:
- `log/` → Logs detallados con niveles INFO/DEBUG/WARN/ERROR
- `temp/` → Archivos temporales de trabajo
- `data/` → Datos persistentes (favoritos, configuración, mods instalados)

**Ubicación:**
- Si es **portable**: en el mismo directorio donde vive el `.exe`
- Si está **instalado oficialmente**: en `XDG_DATA_HOME` (Linux) o `%APPDATA%` (Windows)

Esto ocurre **al primer arranque**, no durante el build, **sin preguntar nada al usuario**.

## Detección frozen/dev en main.js
Patrón explícito con `app.isPackaged` y `process.env.PORTABLE_EXECUTABLE_DIR` para que el mismo código funcione tanto en desarrollo como en producción, cambiando automáticamente los paths de datos según el contexto:

```javascript
const isDev = !app.isPackaged;
const baseDir = isDev 
  ? process.cwd() 
  : (process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe')));

// Rutas automáticas:
const logDir = path.join(baseDir, 'log');
const dataDir = path.join(baseDir, 'data');
const tempDir = path.join(baseDir, 'temp');
```

## Launcher script Linux (opcional)
Para distribución como AppImage, no se requiere launcher script ya que Electron bundea Chromium internamente. El AppImage funciona directamente sin variables de entorno adicionales.

Si se distribuye como `tar.gz` con estructura `onedir`:
- Incluir script `minikodi` que establece variables de entorno si son necesarias
- El usuario ejecuta `./minikodi`, no el binario interno directamente

## Principios Clave

| Principio | Descripción |
|-----------|-------------|
| **Cero intervención** | Usuario nivel 0 solo hace doble-click |
| **Mismo código dev/prod** | Funciona en desarrollo y portable sin cambios |
| **Auto-contenido** | Todo lo necesario dentro del bundle |
| **Portable entre PCs** | Copiar y ejecutar en cualquier equipo |
| **Carpetas dinámicas** | Se crean según contexto (portable/instalado) |
| **Separación clara** | Herramientas de build ≠ producto final |

## Flujo de Trabajo

### Para Desarrollador
```bash
# 1. Modificar código
# 2. Ejecutar install.bat (Win) o install.sh (Lin)
# 3. Verificar dist/MiniKodi-Portable.exe o dist/linux-unpacked/minikodi
# 4. Testear en entorno limpio
```

### Para Usuario Final
```
1. Recibe carpeta dist/ o archivo .tar.gz
2. Extrae (si es necesario)
3. Doble-click en MiniKodi-Portable.exe (Win) o ./minikodi (Lin)
4. La app crea log/, data/, temp/ automáticamente
5. Usa la app sin configuración previa
```

## Logging Avanzado (Modo Debug)
El ejecutable genera logs detallados desde el primer milisegundo:

**Formato:**
```
[2025-04-28 14:19:11.037] [INFO] [INIT] Starting MiniKodi v3.0.0
[2025-04-28 14:19:11.038] [DEBUG] [PATHS] baseDir: C:\Users\x\Desktop\MiniKodi-Portable
[2025-04-28 14:19:11.039] [DEBUG] [PATHS] logDir: C:\Users\x\Desktop\MiniKodi-Portable\log
[2025-04-28 14:19:11.040] [DEBUG] [ENV] isPackaged: true, PORTABLE: true
[2025-04-28 14:19:11.050] [INFO] [MODS] Scanning for installed mods...
[2025-04-28 14:19:11.055] [INFO] [MODS] Found 3 mods
[2025-04-28 14:19:11.060] [INFO] [FAVORITES] Loaded 5 favorites from data/favorites.json
...
```

**Niveles:**
- `INFO`: Eventos normales del flujo
- `DEBUG`: Variables, paths, estados internos
- `WARN`: Problemas no críticos
- `ERROR`: Fallos con stack trace completo

**Rotación:** Máximo 10MB por archivo, mantener últimos 5 logs.

---

*Documento técnico v3.0 - PromptOS v13.1.0 compliant*  
*Última actualización: 2025-04-28*
