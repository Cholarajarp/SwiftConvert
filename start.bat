@echo off
REM SwiftConvert - Production Build Launch Script
REM Start both backend and frontend servers

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         🚀 SwiftConvert - Production Build 🚀             ║
echo ║                                                            ║
echo ║  Starting both Backend and Frontend servers...            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if Pandoc is installed
where pandoc >nul 2>nul
if errorlevel 1 (
    echo WARNING: Pandoc not found!
    echo Install with: choco install pandoc
    echo Or download from: https://github.com/jgm/pandoc/releases
    echo.
)

REM Check if LibreOffice is installed
where libreoffice >nul 2>nul
if errorlevel 1 (
    echo WARNING: LibreOffice not found!
    echo Install with: choco install libreoffice-fresh
    echo Or download from: https://www.libreoffice.org/download/
    echo.
)

echo.
echo Starting services...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📡 Backend (Node.js):  http://localhost:3001
echo 🌐 Frontend (React):   http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start the development servers
call npm run dev:all

pause
