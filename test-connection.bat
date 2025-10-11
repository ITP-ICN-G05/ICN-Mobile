@echo off
REM Test Frontend-Backend Connection
echo 🧪 Testing Frontend-Backend Connection
echo =====================================

echo.
echo ⏳ Waiting for backend to start...
timeout /t 20 /nobreak >nul

echo.
echo 🔍 Test 1: Basic Backend Health Check
echo =====================================
curl -s "http://localhost:8082/api/user/getCode?email=test@example.com" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend is not responding
    echo 💡 Make sure backend is running: cd ..\ICN-Backend && mvn spring-boot:run
    pause
    exit /b 1
)

echo.
echo 🔍 Test 2: Email Validation API (with Google Maps API Key)
echo ==========================================================
curl -s "http://localhost:8082/api/user/getCode?email=test@example.com"
echo.
echo.

echo.
echo 🔍 Test 3: Organisation Search API
echo ===================================
curl -s "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=3"
echo.
echo.

echo.
echo 🔍 Test 4: Mobile App API Test
echo ===============================
echo 💡 Now test in your mobile app:
echo 1. Open your mobile app
echo 2. Navigate to the API Integration Test screen
echo 3. Run the API tests
echo 4. Check the results
echo.

echo 📊 Expected Results:
echo ====================
echo ✅ Basic Connection: Should work
echo ✅ Email Validation: Should work (no more 500 error)
echo ✅ Organisation Search: Should work
echo ❌ Organisation Details: Will fail with test IDs (expected)
echo.

echo 🎉 Connection test completed!
echo.
echo 💡 If email validation still fails, check:
echo 1. Backend logs for any error messages
echo 2. Google Maps API key is properly set
echo 3. MongoDB is running and accessible
echo.
pause
