#!/usr/bin/env bash
set -euo pipefail

# ============================================
# MiniKodi Installer - Linux
# UTF-8, LF line endings
# Log activo desde primera linea
# ============================================

LOGFILE="log/install.log"

# Crear carpeta de log inmediatamente
mkdir -p log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] MiniKodi Installation Started" >> "$LOGFILE"

echo "============================================"
echo "  MiniKodi Installer for Linux"
echo "============================================"
echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting installation..." >> "$LOGFILE"

# Detectar gestor de paquetes
detect_package_manager() {
    if command -v apt &> /dev/null; then
        echo "apt"
    elif command -v dnf &> /dev/null; then
        echo "dnf"
    elif command -v pacman &> /dev/null; then
        echo "pacman"
    else
        echo "unknown"
    fi
}

PM=$(detect_package_manager)
echo "Detected package manager: $PM" | tee -a "$LOGFILE"

# Instalar Node.js si no existe
echo "Checking Node.js installation..." | tee -a "$LOGFILE"

if ! command -v node &> /dev/null; then
    echo "Node.js not found! Installing..." | tee -a "$LOGFILE"
    
    case $PM in
        apt)
            curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - >> "$LOGFILE" 2>&1
            apt-get install -y nodejs >> "$LOGFILE" 2>&1
            ;;
        dnf)
            dnf install -y nodejs >> "$LOGFILE" 2>&1
            ;;
        pacman)
            pacman -S --noconfirm nodejs npm >> "$LOGFILE" 2>&1
            ;;
        *)
            echo "Unsupported package manager. Please install Node.js manually from https://nodejs.org" | tee -a "$LOGFILE"
            exit 1
            ;;
    esac
    
    echo "Node.js installed!" | tee -a "$LOGFILE"
else
    echo "Node.js found!" | tee -a "$LOGFILE"
fi

# Mostrar versiones
node --version >> "$LOGFILE" 2>&1
npm --version >> "$LOGFILE" 2>&1

# Instalar dependencias del sistema para Electron
echo "" | tee -a "$LOGFILE"
echo "Installing system dependencies for Electron..." | tee -a "$LOGFILE"

case $PM in
    apt)
        apt-get install -y \
            libgtk-3-0 \
            libnotify4 \
            libnss3 \
            libxss1 \
            libxtst6 \
            xdg-utils \
            libatspi2.0-0 \
            libdrm2 \
            libgbm1 \
            >> "$LOGFILE" 2>&1 || echo "Warning: Some system deps may have failed" | tee -a "$LOGFILE"
        ;;
    dnf)
        dnf install -y \
            gtk3 \
            libnotify \
            nss \
            libXScrnSaver \
            libXtst \
            xdg-utils \
            at-spi2-atk \
            libdrm \
            mesa-libgbm \
            >> "$LOGFILE" 2>&1 || echo "Warning: Some system deps may have failed" | tee -a "$LOGFILE"
        ;;
    pacman)
        pacman -S --noconfirm \
            gtk3 \
            libnotify \
            nss \
            libxss \
            libxtst \
            xdg-utils \
            at-spi2-atk \
            libdrm \
            mesa \
            >> "$LOGFILE" 2>&1 || echo "Warning: Some system deps may have failed" | tee -a "$LOGFILE"
        ;;
esac

# Instalar dependencias del proyecto
echo "" | tee -a "$LOGFILE"
echo "Installing project dependencies..." | tee -a "$LOGFILE"

npm install >> "$LOGFILE" 2>&1
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies!" | tee -a "$LOGFILE"
    pause
    exit 1
fi

echo "Dependencies installed successfully!" | tee -a "$LOGFILE"

# Verificar webtorrent funcionalmente
echo "" | tee -a "$LOGFILE"
echo "Verifying webtorrent module..." | tee -a "$LOGFILE"

if node -e "require('webtorrent'); console.log('webtorrent OK')" >> "$LOGFILE" 2>&1; then
    echo "webtorrent module verified!" | tee -a "$LOGFILE"
else
    echo "Warning: webtorrent verification failed, but continuing..." | tee -a "$LOGFILE"
fi

# Build de la aplicacion
echo "" | tee -a "$LOGFILE"
echo "Building MiniKodi..." | tee -a "$LOGFILE"

npm run build:linux >> "$LOGFILE" 2>&1
if [ $? -ne 0 ]; then
    echo "Build failed! Check log/install.log for details." | tee -a "$LOGFILE"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build completed successfully" >> "$LOGFILE"

# Abrir carpeta de salida e intentar instalar .deb automaticamente
echo "" | tee -a "$LOGFILE"
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "Portable executables created:" | tee -a "$LOGFILE"

if [ -f "dist/MiniKodi-1.0.0.AppImage" ]; then
    echo "  - MiniKodi-1.0.0.AppImage (portable)" | tee -a "$LOGFILE"
    chmod +x dist/MiniKodi-1.0.0.AppImage
fi

if [ -f "dist/minikodi_1.0.0_amd64.deb" ]; then
    echo "  - minikodi_1.0.0_amd64.deb (Debian/Ubuntu)" | tee -a "$LOGFILE"
    echo "" | tee -a "$LOGFILE"
    echo "Installing .deb package automatically..." | tee -a "$LOGFILE"
    
    # Instalacion automatica del .deb sin intervencion
    if command -v apt &> /dev/null; then
        apt-get install -y ./dist/minikodi_1.0.0_amd64.deb >> "$LOGFILE" 2>&1 && \
        echo "MiniKodi installed successfully via .deb!" | tee -a "$LOGFILE" || \
        echo "Warning: .deb installation failed, use AppImage instead" | tee -a "$LOGFILE"
    elif command -v dpkg &> /dev/null; then
        dpkg -i ./dist/minikodi_1.0.0_amd64.deb >> "$LOGFILE" 2>&1 || {
            echo "Some dependencies missing, fixing..." | tee -a "$LOGFILE"
            apt-get install -f -y >> "$LOGFILE" 2>&1 && \
            echo "MiniKodi installed successfully!" | tee -a "$LOGFILE"
        }
    fi
    
    echo "" | tee -a "$LOGFILE"
    echo "You can now launch MiniKodi from your applications menu or run:" | tee -a "$LOGFILE"
    echo "  minikodi" | tee -a "$LOGFILE"
fi

if [ -f "dist/MiniKodi-1.0.0.AppImage" ]; then
    echo "" | tee -a "$LOGFILE"
    echo "AppImage is portable - just copy and run on any Linux machine!" | tee -a "$LOGFILE"
    echo "Launching MiniKodi AppImage..." | tee -a "$LOGFILE"
    ./dist/MiniKodi-1.0.0.AppImage &
fi

echo ""
echo "============================================"
echo "  IMPORTANT FOR PORTABILITY:"
echo "  - AppImage: Copy to any Linux machine and run"
echo "  - .deb: Already installed system-wide"
echo "============================================"

echo ""
echo "Opening file manager..." | tee -a "$LOGFILE"

# Intentar abrir el gestor de archivos
if command -v nautilus &> /dev/null; then
    nautilus dist/ &> /dev/null &
elif command -v dolphin &> /dev/null; then
    dolphin dist/ &> /dev/null &
elif command -v thunar &> /dev/null; then
    thunar dist/ &> /dev/null &
elif command -v xdg-open &> /dev/null; then
    xdg-open dist/ &> /dev/null &
fi
