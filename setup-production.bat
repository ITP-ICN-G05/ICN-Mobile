@echo off
REM Production Setup Script for ICN Mobile
REM This script helps you set up Google Maps API key and get real organisation IDs

echo 🚀 ICN Mobile Production Setup
echo ================================

echo.
echo 📋 Step 1: Google Maps API Key Setup
echo =====================================
echo.
echo To get a Google Maps API Key:
echo 1. Go to: https://console.cloud.google.com/
echo 2. Create a new project or select existing one
echo 3. Enable these APIs:
echo    - Geocoding API
echo    - Maps JavaScript API
echo 4. Create credentials (API Key)
echo 5. Restrict the API key for security
echo.
set /p API_KEY="Enter your Google Maps API Key: "

if "%API_KEY%"=="" (
    echo ❌ No API key provided. Exiting...
    pause
    exit /b 1
)

echo.
echo 🔧 Setting environment variable...
setx GOOGLE_MAPS_API_KEY "%API_KEY%"
echo ✅ Environment variable set successfully!

echo.
echo 📋 Step 2: Get Real Organisation IDs
echo =====================================
echo.

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
echo 🔍 Getting organisation IDs from database...

REM Try to get organisation IDs using MongoDB shell
echo db.companies.find({}, {_id: 1, name: 1}).limit(5) | mongosh "mongodb://icn_app:icn_app_pass@localhost:27017/icn_dev" --quiet

echo.
echo 📋 Step 3: Test API with Real Data
echo ===================================
echo.

REM Start backend with new environment variable
echo 🔄 Starting backend with new configuration...
echo 💡 You may need to restart your terminal for the environment variable to take effect
echo.

cd /d "%~dp0..\ICN-Backend"
echo 📁 Current directory: %CD%

REM Check if pom.xml exists
if not exist "pom.xml" (
    echo ❌ pom.xml not found. Please run this script from the correct directory.
    pause
    exit /b 1
)

echo ✅ Found pom.xml, starting backend...
echo 💡 Backend will start in a new window with the new API key
start "ICN Backend with API Key" cmd /k "mvn spring-boot:run"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 15 /nobreak >nul

echo.
echo 🧪 Testing API with new configuration...
echo.

REM Test the email validation API
echo 🔄 Testing email validation API...
curl -s "http://localhost:8082/api/user/getCode?email=test@example.com" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Email validation API is working!
) else (
    echo ❌ Email validation API still failing. Check the backend logs.
)

echo.
echo 📋 Step 4: Update Mobile App Test
echo ==================================
echo.
echo To use real organisation IDs in your mobile app:
echo.
echo 1. Run the organisation search API to get real IDs:
echo    curl "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=5"
echo.
echo 2. Copy the _id values from the response
echo.
echo 3. Update your mobile app test with real IDs:
echo    - Replace 'test-org-id' with actual organisation ID
echo    - Replace 'test-user-id' with actual user ID
echo.

echo 🎉 Setup completed!
echo.
echo 📝 Next steps:
echo 1. Restart your terminal to pick up the new environment variable
echo 2. Test the mobile app with real organisation IDs
echo 3. Check the backend logs for any remaining issues
echo.
echo 💡 If you need to restart the backend:
echo    cd ..\ICN-Backend
echo    mvn spring-boot:run
echo.
pause
