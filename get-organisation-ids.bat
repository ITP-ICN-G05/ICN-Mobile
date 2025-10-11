@echo off
REM Get Real Organisation IDs from Database
REM This script helps you get real organisation IDs for testing

echo 🗄️ Getting Organisation IDs from Database
echo ==========================================

REM Check if MongoDB is running
docker ps | findstr "mongo" >nul
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running. Please start it first:
    echo    cd ..\ICN-Backend\infra\mongo
    echo    docker-compose up -d
    pause
    exit /b 1
)

echo ✅ MongoDB is running
echo.

echo 🔍 Method 1: Using API (if backend is running)
echo ===============================================

REM Check if backend is running
curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running, getting organisation IDs via API...
    echo.
    echo 📋 Organisation IDs from API:
    curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3"
    echo.
    echo.
) else (
    echo ❌ Backend is not running. Starting backend first...
    echo.
    echo 🔄 Starting backend...
    cd /d "%~dp0..\ICN-Backend"
    start "ICN Backend" cmd /k "mvn spring-boot:run"
    
    echo ⏳ Waiting for backend to start...
    timeout /t 20 /nobreak >nul
    
    echo 🔄 Trying API again...
    curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3"
    echo.
    echo.
)

echo 🔍 Method 2: Using MongoDB Shell
echo =================================
echo.
echo 📋 Organisation IDs from MongoDB:
echo.

REM Try to use MongoDB shell to get IDs
echo db.companies.find({}, {_id: 1, name: 1}).limit(5).pretty() | mongosh "mongodb://icn_app:icn_app_pass@localhost:27017/icn_dev" --quiet 2>nul

echo.
echo 🔍 Method 3: Using Docker Exec
echo ===============================
echo.
echo 📋 Organisation IDs via Docker:
echo.

REM Use docker exec to run MongoDB commands
docker exec icn-mongo mongosh "mongodb://icn_app:icn_app_pass@localhost:27017/icn_dev" --eval "db.companies.find({}, {_id: 1, name: 1}).limit(5)" --quiet

echo.
echo 📝 How to Use These IDs:
echo ========================
echo.
echo 1. Copy the _id values from the output above
echo 2. In your mobile app, replace test IDs with real ones:
echo    - Replace 'test-org-id' with actual organisation ID
echo    - Replace 'test-user-id' with actual user ID
echo.
echo 3. Example usage in API calls:
echo    curl "http://localhost:8082/api/organisation/specific?organisationId=REAL_ID_HERE&user=REAL_USER_ID_HERE"
echo.
echo 💡 Note: If the database is empty, you may need to:
echo    1. Import sample data
echo    2. Use the organisation search API to populate the database
echo    3. Check if the backend is properly connected to MongoDB
echo.
pause
