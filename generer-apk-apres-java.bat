@echo off
REM Java + Android SDK requis. JAVA_HOME = JDK (ex: Eclipse Temurin).
REM Android SDK = installer Android Studio ou definir ANDROID_HOME.

echo.
echo Generation de l'APK (icone playstore-icon.png)...
echo.

if "%JAVA_HOME%"=="" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
    if not exist "%JAVA_HOME%\bin\java.exe" (
        echo ERREUR: JAVA_HOME non trouve. Definissez JAVA_HOME ou installez le JDK.
        pause
        exit /b 1
    )
)

if defined ANDROID_HOME (
    echo sdk.dir=%ANDROID_HOME:\=/%> "%~dp0android\local.properties"
)

cd /d "%~dp0android"
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo Erreur Gradle. Verifiez que Java est bien installe.
    pause
    exit /b 1
)

copy /Y "app\build\outputs\apk\release\app-release.apk" "..\bundle-for-phone\app-release.apk"
echo.
echo OK. APK copie dans deploy\bundle-for-phone\app-release.apk
echo.
pause
