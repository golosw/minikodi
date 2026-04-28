@echo off
REM ============================================
REM MiniKodi Installer - Windows
REM ASCII puro, CRLF line endings
REM Log activo desde primera linea
REM Zero intervencion - instala todo automaticamente
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
    echo Node.js not found! Installing automatically...
    echo [%date% %time%] Node.js not found, installing automatically >> %LOGFILE%
    
    REM Metodo 1: winget (Windows 10 1709+)
    echo Trying winget method...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements >> %LOGFILE% 2>&1
    if %errorlevel% equ 0 (
        echo Winget installation successful
        echo [%date% %time%] Winget Node.js install success >> %LOGFILE%
        goto :wait_node
    )
    
    REM Metodo 2: PowerShell + descargador directo
    echo [%date% %time%] Winget failed, trying PowerShell direct download >> %LOGFILE%
    echo Trying PowerShell direct download method...
    
    powershell -Command "& { $url = 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi'; $installer = '$env:TEMP\node-installer.msi'; Invoke-WebRequest -Uri $url -OutFile $installer; Start-Process msiexec.exe -ArgumentList '/i', $installer, '/quiet', '/norestart' -Wait; Remove-Item $installer }" >> %LOGFILE% 2>&1
    
    if %errorlevel% neq 0 (
        echo [%date% %time%] PowerShell method also failed >> %LOGFILE%
    )
    
    :wait_node
    echo Waiting for Node.js installation to propagate...
    timeout /t 10 /nobreak >nul
    echo Refreshing environment...
    refreshenv >nul 2>&1 || set "PATH=%PATH%;C:\Program Files\nodejs"
    timeout /t 3 /nobreak >nul
) else (
    echo Node.js found!
    echo [%date% %time%] Node.js found >> %LOGFILE%
)

REM Verificar que node funciona ahora
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js installation failed. Please install from https://nodejs.org
    echo [%date% %time%] CRITICAL: Node.js not available after install attempts >> %LOGFILE%
    pause
    exit /b 1
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

node -e "require('webtorrent'); console.log('OK')" >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo Warning: webtorrent verification failed, but continuing...
    echo [%date% %time%] webtorrent verification warning >> %LOGFILE%
)

REM Build de Electron
echo.
echo Building Electron application...
echo [%date% %time%] Running electron-builder >> %LOGFILE%

call npx electron-builder --win --linux >> %LOGFILE% 2>&1
if %errorlevel% neq 0 (
    echo Failed to build application!
    echo [%date% %time%] FAILED electron-builder >> %LOGFILE%
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Installation completed successfully!
echo ============================================
echo [%date% %time%] Installation completed >> %LOGFILE%
echo.
echo Portable executable created:
dir /b dist\*.exe >> %LOGFILE% 2>&1
for %%f in (dist\*.exe) do (
    echo   - %%f
    echo [%date% %time%] Portable exe: %%f >> %LOGFILE%
)
echo.
echo Opening dist folder...
explorer dist

echo.
echo ============================================
echo   IMPORTANT: The .exe in dist/ is PORTABLE
echo   Just copy it and double-click to run!
echo   No installation required on other PCs.
echo ============================================

pause
