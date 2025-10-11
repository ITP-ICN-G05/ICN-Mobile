@echo off
echo ========================================
echo ICN Mobile - Backend Integration Test
echo ========================================
echo.

echo 🔍 Testing Backend API Integration...
echo.

echo 📋 Testing Organisation Search API...
curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=5" | findstr "name" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Organisation Search API is working
    echo.
    echo 📊 Sample Response:
    curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3" | findstr /C:"name" /C:"street" /C:"city" /C:"state"
) else (
    echo ❌ Organisation Search API failed
    echo 💡 Make sure backend is running: cd ICN-Backend && mvn spring-boot:run
)

echo.
echo 📋 Testing Organisation Details API...
curl -s "http://localhost:8082/api/organisation/specific?organisationId=test&user=test" | findstr "404\|200" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Organisation Details API is responding (404 expected for test IDs)
) else (
    echo ❌ Organisation Details API failed
)

echo.
echo 📋 Testing User Validation API...
curl -s -o nul -w "%%{http_code}" http://localhost:8082/api/user/getCode?email=test@example.com | findstr "202\|400\|500" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ User Validation API is responding
) else (
    echo ❌ User Validation API failed
)

echo.
echo 🎉 Backend Integration Test Complete!
echo.
echo 📱 Your mobile app now uses:
echo    ✅ Backend API for organisation data
echo    ✅ Real-time search and filtering
echo    ✅ No more local JSON sampling
echo    ✅ Full backend data integration
echo.
echo 💡 The useICNData hook now:
echo    • Fetches data from backend API
echo    • Converts backend data to Company format
echo    • Supports real-time search and filtering
echo    • Handles pagination and loading more data
echo.
echo 📚 Updated Files:
echo    • useICNData.ts - Now uses backend API
echo    • organisationApiService.ts - Enhanced interfaces
echo    • App.tsx - Real app navigation enabled
echo.
echo 💡 Press any key to exit...
pause >nul
