#!/usr/bin/env bash
# Met à jour le site sur le serveur : bash deploy/mettre-a-jour.sh
set -euo pipefail
# PM2 lancé en root (sudo pm2) si le fichier deploy/.pm2-sudo existe, sinon PM2 de l'utilisateur
PM2="pm2"; [ -f /var/www/cercle/deploy/.pm2-sudo ] && PM2="sudo pm2"
cd /var/www/cercle

# Anciennes installations : les réglages étaient dans .env, ce qui bloquait git pull.
if [ ! -f serveur.env ] && grep -q '^DATABASE_URL=' .env 2>/dev/null; then
  cp .env serveur.env
  echo "→ Réglages copiés de .env vers serveur.env"
fi
if [ ! -f serveur.env ]; then
  echo "✗ serveur.env manquant : cp deploy/env.example serveur.env puis nano serveur.env"; exit 1
fi
chmod 600 serveur.env
git checkout -- .env 2>/dev/null || true

echo "→ Récupération de la dernière version"
if ! git pull --ff-only; then
  echo "✗ git pull refusé. Fichiers modifiés sur le serveur :"; git status --short
  echo "  Pour les remettre comme sur le projet : git checkout -- . puis relance ce script."; exit 1
fi

echo "→ Vérification des réglages"
for k in DATABASE_URL SITE_PASSWORD ADMIN_PASSWORD SESSION_SECRET; do
  v=$(grep -E "^$k=" serveur.env | tail -1 | cut -d= -f2- | tr -d "\"'" || true)
  if [ -z "$v" ]; then echo "✗ $k est vide dans serveur.env"; exit 1; fi
  if [ "$k" = SESSION_SECRET ] && [ ${#v} -lt 32 ]; then echo "✗ SESSION_SECRET trop court : mets le résultat de openssl rand -hex 32"; exit 1; fi
done
DB=$(grep -E '^DATABASE_URL=' serveur.env | tail -1 | cut -d= -f2- | tr -d "\"'")
if ! psql "$DB" -qAtc "select 1" >/dev/null; then echo "✗ Base de données injoignable avec DATABASE_URL"; exit 1; fi
psql "$DB" -q -f deploy/schema.sql >/dev/null

echo "→ Construction"
bun install
NITRO_PRESET=node-server bun run build

PORT=$(grep -E '^PORT=' serveur.env | tail -1 | cut -d= -f2- | tr -d "\"'" || true); PORT=${PORT:-3000}
echo "→ Redémarrage"
$PM2 delete cercle >/dev/null 2>&1 || true
$PM2 start deploy/ecosystem.config.cjs && $PM2 save
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/ || true)
  [ "$code" = 200 ] && break; sleep 1
done
if [ "$code" = 200 ]; then echo "✓ Site en ligne"; else echo "✗ Le site répond $code : pm2 logs cercle --lines 50"; exit 1; fi
