@echo off
REM ICN Mobile API Quick Start and Test Script (Windows Version)
REM This script will help you quickly start backend services and test API connections

echo 🚀 ICN Mobile API Quick Start Script
echo ==================================

REM Check if Docker is running
echo 📋 Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running, please start Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check backend directory
echo 📋 Checking backend directory...
if not exist "..\ICN-Backend" (
    echo ❌ ICN-Backend directory not found, please ensure correct project structure
    echo Expected structure:
    echo ICN\
    echo ├── ICN-Backend\
    echo └── ICN-Mobile\
    pause
    exit /b 1
)
echo ✅ Found ICN-Backend directory

REM Start MongoDB
echo 📋 Starting MongoDB...
cd /d "%~dp0..\ICN-Backend\infra\mongo"

docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ⚠️  MongoDB container is already running
) else (
    echo 🔄 Starting MongoDB container...
    docker-compose up -d
    
    echo ⏳ Waiting for MongoDB to start...
    timeout /t 10 /nobreak >nul
    
    docker-compose ps | findstr "Up" >nul
    if %errorlevel% equ 0 (
        echo ✅ MongoDB started successfully
    ) else (
        echo ❌ MongoDB startup failed
        pause
        exit /b 1
    )
)

cd /d "%~dp0..\..\.."

REM Start backend service
echo 📋 Starting backend service...
cd /d "%~dp0..\ICN-Backend"

REM Check Java version
java -version 2>&1 | findstr "18" >nul
if %errorlevel% neq 0 (
    echo ⚠️  Recommend using Java 18, current version:
    java -version
)

REM Check Maven
echo 🔍 Checking Maven installation...
mvn --version
if %errorlevel% neq 0 (
    echo ❌ Maven not found, please install Maven
    echo 💡 You can install Maven from: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)
echo ✅ Maven found

echo 🔄 Building backend project...
echo 💡 This may take a few minutes on first run...
echo 📁 Current directory: %CD%
echo 📄 Checking for pom.xml...
if not exist "pom.xml" (
    echo ❌ pom.xml not found in current directory
    echo 💡 Expected to be in ICN-Backend directory
    pause
    exit /b 1
)
echo ✅ pom.xml found, starting Maven build...
echo 🔄 Running: mvn clean install -DskipTests
echo 💡 If this takes too long, you can cancel with Ctrl+C and try running the backend manually
timeout /t 5 /nobreak >nul
mvn clean install -DskipTests -B
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    echo 💡 You can try building manually: cd ..\ICN-Backend && mvn clean install -DskipTests
    echo 💡 Or try starting the backend directly: cd ..\ICN-Backend && mvn spring-boot:run
    pause
    exit /b 1
)
echo ✅ Backend build successful

echo 🔄 Starting backend service...
echo 💡 Backend service will start in a new window...

REM Start Spring Boot application in new window
start "ICN Backend" cmd /k "mvn spring-boot:run"

echo ⏳ Waiting for backend service to start...
timeout /t 15 /nobreak >nul

REM Test backend connection
curl -s http://localhost:8082/api/user/getCode?email=test@example.com >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend service started successfully
    echo 🌐 API service address: http://localhost:8082/api
) else (
    echo ❌ Backend service startup failed or not responding
    echo 💡 Please check backend service window for detailed error information
    pause
    exit /b 1
)

cd /d "%~dp0"

REM Test API connection
echo 📋 Testing API connection...

echo 🔄 Testing basic connection...
curl -s -o nul -w "%%{http_code}" http://localhost:8082/api/user/getCode?email=test@example.com | findstr "202\|400" >nul
if %errorlevel% equ 0 (
    echo ✅ Basic connection test passed
) else (
    echo ❌ Basic connection test failed
    pause
    exit /b 1
)

echo 🔄 Testing organisation search API...
curl -s -o nul -w "%%{http_code}" "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100" | findstr "200\|400" >nul
if %errorlevel% equ 0 (
    echo ✅ Organisation search API test passed
) else (
    echo ❌ Organisation search API test failed
    pause
    exit /b 1
)

echo 🎉 All API tests passed!

echo.
echo 📱 Mobile startup instructions:
echo ==================================
echo 1. Start mobile development environment:
echo    make dev
echo.
echo 2. Or start Expo directly:
echo    make start
echo.
echo 3. Test API connection in app:
echo    - Import ApiIntegrationTest component
echo    - Run API test suite
echo.
echo 4. Platform-specific configuration:
echo    - Android emulator: Use 10.0.2.2:8082
echo    - iOS simulator: Use localhost:8082
echo    - Physical device: Use your computer's IP address
echo.
echo 📚 Detailed instructions: ICN_MOBILE_API_SETUP_GUIDE.md
echo.
echo 💡 Press any key to exit...
pause >nul
