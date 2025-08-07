@echo off
echo Bereite Kaffeebestellung fuer GitHub Pages vor...
echo.

echo Arbeite in: %CD%

REM Überprüfe, ob die index-github-pages.html existiert
if not exist "index-github-pages.html" (
    echo Fehler: index-github-pages.html nicht gefunden!
    exit /b 1
)

REM Erstelle eine Kopie der index-github-pages.html als index.html für GitHub Pages
echo Kopiere optimierte Version fuer GitHub Pages...
copy /y index-github-pages.html index.html
echo index.html aktualisiert!

REM Stelle sicher, dass fix.js vorhanden ist
if not exist "fix.js" (
    echo Warnung: fix.js nicht gefunden! Die Seite koennte nicht richtig funktionieren.
) else (
    echo fix.js gefunden!
)

REM Überprüfe, ob Icons vorhanden sind
if not exist "icons" (
    echo Warnung: icons-Ordner nicht gefunden!
) else (
    echo Icons-Ordner gefunden!
)

echo.
echo Die Dateien wurden fuer GitHub Pages vorbereitet.
echo Oeffne die github-pages-anleitung.md fuer weitere Anweisungen.
echo.

pause
