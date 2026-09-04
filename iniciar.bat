@echo off
chcp 65001 >nul
title Gestión Manager - Servidor de Desarrollo
cls
echo ====================================================================
echo   🚀 INICIANDO GESTIÓN MANAGER (ERP & POS MULTI-TENANT)
echo ====================================================================
echo.
echo [1/3] Sincronizando modelos de Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Falló la generación de Prisma Client.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Abriendo navegador en http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo [3/3] Iniciando servidor de desarrollo Next.js (Turbopack)...
echo ====================================================================
echo Presiona Ctrl+C en cualquier momento para detener el servidor.
echo.
call npm run dev
