@echo off
REM ============================================
REM MiniKodi Installer - Windows
REM ASCII puro, CRLF line endings
REM Log activo desde primera linea
REM ============================================

setlocal enabledelayedexpansion

REM Crear carpeta de log inmediatamente
if not exist "log" mkdir log
set LOGFILE=log\install.log
echo [%date% %time%] MiniKodi Installation Started >> %LOGFILE%

echo ============================================
echo   MiniKodi Installer for Windows
echo ============================================
echo.
echo [%date% %time%] Starting installation... >> %LOGFILE%

REM Verificar Node.js
echo Checking Node.js installation...
echo [%date% %time%] Checking Node.js >> %LOGFILE%

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found! Installing...
    echo [%date% %time%] Node.js not found, installing >> %LOGFILE%
    
    REM Instalar Node.js via winget
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements >> %LOGFILE% 2>&1
    
    if %errorlevel% neq 0 (
        echo Failed to install Node.js via winget. Please install manually from https://nodejs.org
        echo [%date% %time%] FAILED to install Node.js >> %LOGFILE%
        pause
        exit /b 1
    )
    
    echo Waiting for Node.js installation to complete...
    timeout /t 5 /nobreak >nul
) else (
    echo Node.js found!
    echo [%date% %time%] Node.js found >> %LOGFILE%
)

REM Mostrar version de Node
node --version >> %LOGFILE% 2>&1
npm --version >> %LOGFILE% 2>&1

REM Instalar dependencias del proyecto
echo.
echo Installing project dependencies...
echo [%date% %time%] Running npm install >> %LOGFILE%

call npm install >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo Failed to install dependencies!
    echo [%date% %time%] FAILED npm install >> %LOGFILE%
    pause
    exit /b 1
)

echo Dependencies installed successfully!
echo [%date% %time%] Dependencies installed >> %LOGFILE%

REM Verificar webtorrent funcionalmente
echo.
echo Verifying webtorrent module...
echo [%date% %time%] Testing webtorrent >> %LOGFILE%

node -e "require(webtorrent); console.log(webtorrent