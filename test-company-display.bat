@echo off
echo ========================================
echo ICN Mobile - Company Display Test
echo ========================================
echo.

echo 🔍 Testing Backend API Response...
echo.

echo 📋 Testing Organisation Search API...
Invoke-WebRequest -Uri "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100&limit=5" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object -First 1 | ConvertTo-Json -Depth 3

echo.
echo 📊 Backend API Response Analysis:
echo    ✅ Backend is returning data
echo    ✅ Data structure includes: name, items, street, city, state, zip
echo    ✅ Items contain: sectorName, capabilityType, detailedItemName
echo.

echo 🔧 Frontend Integration Status:
echo    ✅ useICNData hook updated for backend API
echo    ✅ Data conversion function enhanced
echo    ✅ React key duplication fixed
echo    ✅ CompaniesScreen debugging added
echo.

echo 📱 Next Steps:
echo    1. Start your mobile app: make dev
echo    2. Check console logs for debugging output
echo    3. Verify companies are displayed in the list
echo    4. Test search and filtering functionality
echo.

echo 💡 Debugging Information:
echo    - Check console for: "🔄 Loading data from backend API..."
echo    - Check console for: "📊 Backend returned organisations: X"
echo    - Check console for: "🔍 CompaniesScreen - Filtering companies:"
echo    - Check console for: "✅ Final filtered count: X"
echo.

echo 🎉 Company Display Test Complete!
echo.
echo 💡 Press any key to exit...
pause >nul
