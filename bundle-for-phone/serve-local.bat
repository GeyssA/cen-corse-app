@echo off
echo.
echo Serveur local pour tester l'app et l'icone playstore-icon.png
echo.
echo Demarrage sur http://localhost:8000
echo Sur votre telephone (meme WiFi) : http://VOTRE_IP:8000
echo.
cd public
python -m http.server 8000 2>nul
if errorlevel 1 (
    echo Python non installe. Utilisez: npx serve public -p 8000
    pause
)
