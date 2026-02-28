@echo off
cd /d "%~dp0"

REM Chercher git.exe si pas dans le PATH
set "GIT=git"
where git >nul 2>&1
if errorlevel 1 (
  if exist "C:\Users\arnau\Downloads\PortableGit\bin\git.exe" set "GIT=C:\Users\arnau\Downloads\PortableGit\bin\git.exe"
  if exist "C:\Users\arnau\Downloads\PortableGit\cmd\git.exe" set "GIT=C:\Users\arnau\Downloads\PortableGit\cmd\git.exe"
  if exist "C:\Program Files\Git\cmd\git.exe" set "GIT=C:\Program Files\Git\cmd\git.exe"
  if exist "C:\Program Files (x86)\Git\cmd\git.exe" set "GIT=C:\Program Files (x86)\Git\cmd\git.exe"
  if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "GIT=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
)

"%GIT%" --version >nul 2>&1
if errorlevel 1 (
  echo Git introuvable. Installez-le depuis https://git-scm.com/download/win
  echo Puis relancez ce script.
  pause
  exit /b 1
)

echo Utilisation de: %GIT%
"%GIT%" add -A
"%GIT%" status
"%GIT%" commit -m "chore: push workflow gh-pages et fichiers validation-web"
"%GIT%" push origin main
pause
