#!/bin/bash
# ============================================================================
# MiniKodi v1.0.0 - Script de Build para Linux (DESARROLLADOR)
# Este script NO se distribuye al usuario final
# ============================================================================

set -euo pipefail

# Logging desde línea 1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/build_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "========================================"
echo "  MiniKodi v1.0.0 - Build Script Linux"
echo "  SOLO PARA DESARROLLADORES"
echo "========================================"
echo ""

# Detectar distribución
echo "[1/6] Detectando distribución Linux..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$ID
    echo "Distribución detectada: $DISTRO ($PRETTY_NAME)"
else
    echo "[WARN] No se pudo detectar la distribución"
    DISTRO="unknown"
fi

# Verificar Node.js
echo ""
echo "[2/6] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no encontrado"
    echo "[INFO] Instalando Node.js..."
    
    case $DISTRO in
        ubuntu|debian|linuxmint)
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        fedora|centos|rhel)
            sudo dnf install -y nodejs
            ;;
        arch|manjaro)
            sudo pacman -S --noconfirm nodejs npm
            ;;
        *)
            echo "[ERROR] Distribución no soportada automáticamente"
            echo "[INFO] Por favor instala Node.js manualmente desde https://nodejs.org"
            exit 1
            ;;
    esac
else
    NODE_VERSION=$(node --version)
    echo "[OK] Node.js encontrado: $NODE_VERSION"
fi

# Verificar npm
echo ""
echo "[3/6] Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm no encontrado"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "[OK] npm encontrado: $NPM_VERSION"

# Instalar dependencias
echo ""
echo "[4/6] Instalando dependencias npm..."
cd "$SCRIPT_DIR/.."
npm install
echo "[OK] Dependencias instaladas"

# Construir para Linux
echo ""
echo "[5/6] Construyendo AppImage para Linux..."
npm run build:linux
echo "[OK] AppImage creado"

# Abrir carpeta dist
echo ""
echo "[6/6] Listando archivos en dist/..."
if [ -d "$SCRIPT_DIR/../dist" ]; then
    ls -lh "$SCRIPT_DIR/../dist"
    echo ""
    echo "[OK] Carpeta dist disponible"
    
    # Hacer ejecutable el AppImage
    if [ -f "$SCRIPT_DIR/../dist/"*AppImage ]; then
        chmod +x "$SCRIPT_DIR/../dist/"*AppImage
        echo "[OK] AppImage marcado como ejecutable"
    fi
else
    echo "[ERROR] Carpeta dist no encontrada"
    exit 1
fi

# Resumen final
echo ""
echo "========================================"
echo "  BUILD COMPLETADO"
echo "========================================"
echo ""
echo "Archivos generados en: $SCRIPT_DIR/../dist"
echo "Logs en: $LOG_FILE"
echo ""
echo "Para usuario final:"
echo "  1. Copiar el archivo .AppImage a cualquier ubicación"
echo "  2. Dar permisos: chmod +x MiniKodi-*.AppImage"
echo "  3. Ejecutar: ./MiniKodi-*.AppImage"
echo ""
echo "¡NO es necesario instalar nada en el equipo destino!"
echo ""

# Abrir carpeta si hay gestor de archivos
if command -v xdg-open &> /dev/null; then
    xdg-open "$SCRIPT_DIR/../dist" || true
fi

exit 0
