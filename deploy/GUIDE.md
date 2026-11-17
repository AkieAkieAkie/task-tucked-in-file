# Installer « Cercle privé » sur ton VPS

Ce guide suppose un VPS **Ubuntu 22.04 ou 24.04** et un nom de domaine pointant vers l'IP du VPS (enregistrement DNS de type **A**).
Remplace `ton-domaine.fr`, `IP_DU_VPS` et les mots de passe par tes propres valeurs.

---

## 0. Avant de commencer : sauvegarder tes fiches

1. Ouvre le site actuel, passe en mode admin.
2. Clique sur **« ⇩ Sauvegarder toutes les fiches »** : un fichier `cercle-sauvegarde-AAAA-MM-JJ.json` est téléchargé.
3. Garde-le précieusement : tu le restaureras à l'étape 8.

## 1. Récupérer le code

Dans Lovable : **GitHub → Connect** pour envoyer le projet sur un dépôt GitHub (recommandé),
ou télécharge le code en ZIP depuis GitHub une fois connecté.

## 2. Se connecter au VPS en SSH

Depuis ton PC (Terminal sur Mac/Linux, PowerShell sur Windows) :

```bash
ssh root@IP_DU_VPS
```

Recommandé : créer un utilisateur au lieu de travailler en root.

```bash
adduser cercle
usermod -aG sudo cercle
exit
ssh cercle@IP_DU_VPS
```

## 3. Installer les logiciels

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx postgresql ufw curl unzip
# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
# Bun (pour construire) et PM2 (pour garder le site allumé)
curl -fsSL https://bun.sh/install | bash && source ~/.bashrc
sudo npm install -g pm2
```

Pare-feu :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 4. Créer la base de données

```bash
sudo -u postgres psql
```

Puis dans PostgreSQL (choisis un vrai mot de passe) :

```sql
CREATE USER cercle WITH PASSWORD 'MOT_DE_PASSE_BDD';
CREATE DATABASE cercle OWNER cercle;
\q
```

## 5. Envoyer le code sur le VPS

**Option A – Git (le plus simple pour les mises à jour)**

```bash
sudo mkdir -p /var/www/cercle && sudo chown cercle:cercle /var/www/cercle
git clone https://github.com/TON_COMPTE/TON_DEPOT.git /var/www/cercle
```

**Option B – FTP/SFTP (FileZilla)**

1. Dans FileZilla : Hôte `sftp://IP_DU_VPS`, utilisateur `cercle`, ton mot de passe, port `22`.
2. Crée d'abord le dossier en SSH : `sudo mkdir -p /var/www/cercle && sudo chown cercle:cercle /var/www/cercle`
3. Glisse tout le contenu du projet (sauf `node_modules` et `.git`) dans `/var/www/cercle`.

Ensuite, créer les tables :

```bash
cd /var/www/cercle
psql "postgres://cercle:MOT_DE_PASSE_BDD@127.0.0.1:5432/cercle" -f deploy/schema.sql
```

## 6. Configurer et construire le site

```bash
cd /var/www/cercle
cp deploy/env.example .env
nano .env
```

Remplis `DATABASE_URL`, `SITE_PASSWORD`, `ADMIN_PASSWORD`, et pour `SESSION_SECRET` colle le résultat de :

```bash
openssl rand -hex 32
```

Puis construire pour Node :

```bash
bun install
NITRO_PRESET=node-server bun run build
```

Le site construit se trouve dans `.output/`.

Lancer avec PM2 :

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # copie-colle la commande qu'il affiche
```

Vérifier : `curl -I http://127.0.0.1:3000` doit répondre `200`.

## 7. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cercle
sudo nano /etc/nginx/sites-available/cercle      # mets ton domaine
sudo ln -s /etc/nginx/sites-available/cercle /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Certificat HTTPS gratuit (obligatoire : le cookie de connexion ne marche qu'en HTTPS) :

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.fr -d www.ton-domaine.fr
```

## 8. Restaurer tes fiches

1. Ouvre `https://ton-domaine.fr`, entre le code du site puis le code admin.
2. Clique **« ⇧ Restaurer une sauvegarde »** et choisis le fichier JSON de l'étape 0.

## Mettre à jour le site plus tard

```bash
cd /var/www/cercle
git pull                       # ou renvoie les fichiers par FTP
bun install
NITRO_PRESET=node-server bun run build
pm2 delete cercle; pm2 start deploy/ecosystem.config.cjs && pm2 save
```

## Sauvegarde automatique de la base (conseillé)

```bash
crontab -e
# ajoute cette ligne (sauvegarde chaque nuit à 3h) :
0 3 * * * pg_dump "postgres://cercle:MOT_DE_PASSE_BDD@127.0.0.1:5432/cercle" > /home/cercle/backup-$(date +\%F).sql
```

## En cas de problème

| Symptôme | Commande |
|---|---|
| Voir les erreurs du site | `pm2 logs cercle` |
| Le site ne répond pas | `pm2 status` puis `pm2 restart cercle` |
| Erreur 502 Nginx | le site n'est pas lancé : `pm2 logs cercle` |
| Erreur Nginx | `sudo nginx -t` et `sudo tail /var/log/nginx/error.log` |
| Le code d'accès ne garde pas la connexion | vérifie que tu es bien en **https://** |
| « This page didn't load » | `pm2 logs cercle --lines 50` : la vraie cause est affichée (souvent `.env` incomplet ou base injoignable) |
| « Réglages du serveur incomplets » | complète le `.env` comme indiqué sur la page, puis `pm2 delete cercle && pm2 start deploy/ecosystem.config.cjs && pm2 save` |
| « Base de données : … » | suis le message (mot de passe ou adresse dans `DATABASE_URL`, ou relancer `deploy/schema.sql`) |

### Repartir proprement si le site affiche une erreur

```bash
cd /var/www/cercle
git pull                                  # récupère la dernière version
cat .env                                  # les 4 réglages doivent être remplis, SESSION_SECRET = 64 caractères
psql "$(grep ^DATABASE_URL .env | cut -d= -f2-)" -c "select 1"   # doit afficher 1
psql "$(grep ^DATABASE_URL .env | cut -d= -f2-)" -f deploy/schema.sql
bun install
NITRO_PRESET=node-server bun run build
pm2 delete cercle; pm2 start deploy/ecosystem.config.cjs && pm2 save
```
