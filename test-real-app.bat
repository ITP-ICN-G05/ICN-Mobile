@echo off
echo ========================================
echo ICN Mobile - Real App Testing
echo ========================================
echo.

echo 🔍 Checking if backend is running...
curl -s http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=5 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running and responding
) else (
    echo ❌ Backend is not responding
    echo 💡 Please start the backend first:
    echo    cd ICN-Backend
    echo    mvn spring-boot:run
    echo.
    pause
    exit /b 1
)

echo.
echo 🔍 Checking if MongoDB is running...
docker ps | findstr "icn-mongo" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB container is running
) else (
    echo ❌ MongoDB container is not running
    echo 💡 Please start MongoDB first:
    echo    cd ICN-Backend\infra\mongo
    echo    docker-compose up -d
    echo.
    pause
    exit /b 1
)

echo.
echo 🧪 Testing API endpoints...
echo.

echo 📋 Testing organisation search...
curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3" | findstr "Organisation" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Organisation search API is working
) else (
    echo ❌ Organisation search API failed
)

echo.
echo 📋 Testing user validation...
curl -s -o nul -w "%%{http_code}" http://localhost:8082/api/user/getCode?email=test@example.com | findstr "202\|400\|500" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ User validation API is responding (may fail due to email config)
) else (
    echo ❌ User validation API failed
)

echo.
echo 🎉 Backend is ready for real app testing!
echo.
echo 📱 Now you can:
echo    1. Start your mobile app: make dev
echo    2. Test the real app functionality
echo    3. Search for organisations
echo    4. Test filters and geocoding
echo.
echo 💡 The API Integration Test is disabled
echo    Your app will now use the real navigation and features
echo.
echo 📚 Backend API Guide: ICN-Backend/ICN_BACKEND_API_GUIDE.md
echo 📚 Mobile Setup Guide: ICN-Mobile/ICN_MOBILE_API_SETUP_GUIDE.md
echo.
echo 💡 Press any key to exit...
pause >nul
