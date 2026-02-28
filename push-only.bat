@echo off
cd /d "%~dp0"
echo.
set "GIT=C:\Users\arnau\Downloads\PortableGit\bin\git.exe"
if not exist "%GIT%" (
  echo ERREUR: Git introuvable.
  goto fin
)

echo Annulation du merge en cours...
"%GIT%" merge --abort 2>nul

echo.
echo Envoi de ta version locale vers GitHub (remplace ce qui est en ligne)...
"%GIT%" push -u origin main --force
echo.
if errorlevel 1 (
  echo Echec du push. Verifie ta connexion et ton auth GitHub.
) else (
  echo OK. GitHub est a jour avec ton projet.
)

:fin
echo.
pause
