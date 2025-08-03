@echo off
REM ========================================================================
REM ComfortNest Property Rental Application - Quick Start Script
REM
REM This batch file provides a simple way to install dependencies and start
REM the ComfortNest development server on Windows systems.
REM
REM WHAT THIS SCRIPT DOES:
REM 1. Installs all required npm dependencies
REM 2. Starts the development server with nodemon for auto-restart
REM
REM REQUIREMENTS:
REM - Node.js (v14 or higher) installed on system
REM - npm (Node Package Manager) available in PATH
REM - Internet connection for dependency installation
REM - MongoDB connection configured in .env file
REM
REM USAGE:
REM - Double-click this file to start the application
REM - Or run from command line: start.bat
REM
REM The server will start on http://localhost:5000 by default
REM
REM @author ComfortNest Development Team
REM @version 1.0.0
REM ========================================================================

echo Installing ComfortNest dependencies...
npm install

echo Starting the ComfortNest development server...
npm run dev