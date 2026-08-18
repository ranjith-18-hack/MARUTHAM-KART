@echo off
setlocal
set "JAVA_HOME=C:\Users\ranji\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
echo [MARUTHAM KART] Building Customer Web Bundle...
call npm run build:customer
if %errorlevel% neq 0 (
    echo [MARUTHAM KART] Web build failed!
    exit /b %errorlevel%
)
echo [MARUTHAM KART] Syncing Capacitor Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [MARUTHAM KART] Capacitor sync failed!
    exit /b %errorlevel%
)
echo [MARUTHAM KART] Compiling Android APK with Gradle...
cd android
call .\gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [MARUTHAM KART] Gradle build failed!
    cd ..
    exit /b %errorlevel%
)
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "app\build\outputs\apk\debug\app-debug.apk" "app\build\outputs\apk\debug\MARUTHAM_KART_Customer.apk" >nul
    echo [MARUTHAM KART] SUCCESS: Generated APK at android\app\build\outputs\apk\debug\MARUTHAM_KART_Customer.apk
) else (
    echo [MARUTHAM KART] ERROR: APK file not found
    cd ..
    exit /b 1
)
cd ..
echo [MARUTHAM KART] Build Completed Successfully!
