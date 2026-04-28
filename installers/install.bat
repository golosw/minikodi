@echo off
REM ============================================================================
REM MiniKodi v1.0.0 - Script de Build para Windows (DESARROLLADOR)
REM Este script NO se distribuye al usuario final
REM ============================================================================

setlocal enabledelayedexpansion

REM Logging desde línea 1
set LOG_FILE=%~dp0build_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log
echo [INFO] [%time%] Iniciando build de MiniKodi >> "%LOG_FILE%"

echo.
echo ========================================
echo   MiniKodi v1.0.0 - Build Script
echo   SOLO PARA DESARROLLADORES
echo ========================================
echo.

REM Verificar Node.js
echo [1/5] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Instalando...
    echo [ERROR] Por favor instala Node.js desde https://nodejs.org
    echo [ERROR] Build cancelado.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

REM Instalar dependencias
echo.
echo [2/5] Instalando dependencias npm...
call npm install >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Error instalando dependencias
    echo [ERROR] Revisar log: %LOG_FILE%
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

REM Construir para Windows
echo.
echo [3/5] Construyendo ejecutable Windows portable...
call npm run build:win >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Error construyendo para Windows
    echo [ERROR] Revisar log: %LOG_FILE%
    pause
    exit /b 1
)
echo [OK] Executable Windows creado

REM Construir para Linux (si estamos en WSL o similar)
echo.
echo [4/5] Intentando build Linux (opcional)...
call npm run build:linux >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Build Linux fallido (esperado en Windows nativo)
) else (
    echo [OK] Executable Linux creado
)

REM Abrir carpeta dist
echo.
echo [5/5] Abriendo carpeta dist...
if exist "%~dp0dist" (
    explorer "%~dp0dist"
    echo [OK] Carpeta dist abierta
) else (
    echo [ERROR] Carpeta dist no encontrada
)

REM Resumen final
echo.
echo ========================================
echo   BUILD COMPLETADO
echo ========================================
echo.
echo Archivos generados en: %~dp0dist
echo Logs en: %LOG_FILE%
echo.
echo Para usuario final:
echo   - Windows: Ejecutar MiniKodi-Portable-1.0.0.exe
echo   - Linux: Ejecutar MiniKodi-1.0.0.AppImage
echo.
echo ¡NO es necesario instalar nada en el equipo destino!
echo.

pause
exit /b 0
