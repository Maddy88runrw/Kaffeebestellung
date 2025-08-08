#!/bin/bash

# Dieses Skript bereitet die Dateien für das Deployment auf GitHub Pages vor

# Farben für die Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Bereite Kaffeebestellung für GitHub Pages vor...${NC}"

# Aktuelles Verzeichnis
ROOT_DIR="$(pwd)"
echo -e "Arbeite in: ${ROOT_DIR}"

# Überprüfe, ob die github-pages-version.html existiert
if [ ! -f "github-pages-version.html" ]; then
    echo -e "${RED}Fehler: github-pages-version.html nicht gefunden!${NC}"
    exit 1
fi

# Erstelle eine Kopie der github-pages-version.html als index.html für GitHub Pages
echo -e "${GREEN}Kopiere optimierte Version für GitHub Pages...${NC}"
cp github-pages-version.html index.html
echo -e "${GREEN}index.html aktualisiert!${NC}"

# Stelle sicher, dass fix.js vorhanden ist
if [ ! -f "fix.js" ]; then
    echo -e "${RED}Warnung: fix.js nicht gefunden! Die Seite könnte nicht richtig funktionieren.${NC}"
else
    echo -e "${GREEN}fix.js gefunden!${NC}"
fi

# Überprüfe, ob Icons vorhanden sind
if [ ! -d "icons" ]; then
    echo -e "${RED}Warnung: icons-Ordner nicht gefunden!${NC}"
else
    echo -e "${GREEN}Icons gefunden: $(ls icons | wc -l) Dateien${NC}"
fi

# Git-Änderungen vorbereiten
echo -e "${YELLOW}Bereite Git-Commit vor...${NC}"
git add index.html fix.js icons/
git status

echo -e "${GREEN}Bereit für GitHub Pages!${NC}"
echo -e "${YELLOW}Führe folgende Befehle aus, um die Änderungen hochzuladen:${NC}"
echo "git commit -m 'Aktualisiere für GitHub Pages'"
echo "git push origin main"

echo -e "\n${GREEN}Nach dem Push wird die Seite unter https://maddy88runrw.github.io/Kaffeebestellung/ verfügbar sein.${NC}"
