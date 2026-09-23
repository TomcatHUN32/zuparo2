# 🚀 ZUPARO Éttermi Rendszer - VPS Telepítési Útmutató (Ubuntu / Debian)

Ez az útmutató lépésről lépésre végigvezet a rendszer telepítésén és éles üzembe helyezésén egy tetszőleges VPS szerveren (pl. Hetzner, DigitalOcean, Linode, Contabo vagy saját szerver).

---

## 📋 1. Szükséges előfeltételek
- **Operációs rendszer:** Ubuntu 22.04 LTS / 24.04 LTS vagy Debian 11/12
- **Domain név:** `zuparo.hu` és `www.zuparo.hu` (az A rekord mutasson a VPS IP címére)
- **Minimum VPS konfiguráció:** 2 CPU mag, 2-4 GB RAM, 20 GB SSD

---

## 🛠️ 2. Rendszercsomagok frissítése & Alapok telepítése

Lépj be a szerverre SSH-val (`ssh root@SZERVER_IP_CÍM`), majd futtasd:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
```

---

## 🟢 3. Node.js 20+ és NPM telepítése

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verzió ellenőrzése (Node v20+, npm v10+)
node -v
npm -v
```

---

## 🍃 4. MongoDB 7+ Adatbázis telepítése & Indítása

```bash
# MongoDB hivatalos GPG kulcs és repository hozzáadása
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# MongoDB indítása és bekapcsolása a gép indulásakor
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod

# Ellenőrzés:
sudo systemctl status mongod
```

---

## 📦 5. Projekt letöltése / klónozása a szerverre

Hozzuk létre a weboldal könyvtárát a `/var/www/food2` mappában (vagy töröljük a régit, ha tiszta telepítést végzünk):

```bash
# Ha már létezik egy régi verzió, töröljük le teljesen:
sudo rm -rf /var/www/food2

# Klónozzuk a legfrissebb repót:
sudo git clone https://github.com/TomcatHUN32/zuparo2.git /var/www/food2
sudo chown -R $USER:$USER /var/www/food2
cd /var/www/food2
```

Telepítsd a függőségeket és futtasd le a buildet:

```bash
cd /var/www/food2
npm install
npm run build
```

---

## ⚙️ 6. A `.env` környezeti fájl létrehozása

Hozd létre a `.env` fájlt:

```bash
nano /var/www/food2/.env
```

Illeszd be az alábbi tartalmat (állítsd be a saját titkos kulcsodat és domain címedet):

```env
# Database & Server settings
PORT=3000
NODE_ENV=production
TZ=Europe/Budapest
MONGO_URI=mongodb://127.0.0.1:27017/szesztestverek
JWT_SECRET=szesztestverek_jwt_secret_production_key_2026
APP_URL=https://zuparo.hu
```
Mentés: `Ctrl + O`, majd `Enter`, kilépés: `Ctrl + X`.

---

## 🔄 7. Folyamatkezelő (PM2) telepítése & Szerver indítása 24/7

A **PM2** gondoskodik róla, hogy az alkalmazás a háttérben fusson, hiba esetén azonnal újrainduljon, és szerver újraindításakor is magától elinduljon.

```bash
sudo npm install -g pm2

# Régi folyamatok leállítása és törlése (ha volt):
pm2 delete all 2>/dev/null || true

# Indítás PM2-vel
cd /var/www/food2
pm2 start dist/server.js --name "food2"

# Mentés, hogy szerver reboot esetén is automatikusan elinduljon:
pm2 save
pm2 startup
# (Futtasd le a parancsot, amit a pm2 startup kiír)

# Állapot ellenőrzése:
pm2 status
# Logok megtekintése:
pm2 logs food2
```

---

## 🌐 8. Nginx beállítása Reverse Proxy-ként

Másold be az elkészített `nginx.conf` konfigurációt:

```bash
sudo nano /etc/nginx/sites-available/zuparo.conf
```

*(Illeszd be a projekt gyökerében található `nginx.conf` tartalmát, a szervernév: `zuparo.hu www.zuparo.hu`)*

Aktiváld az oldalt:
```bash
sudo ln -sf /etc/nginx/sites-available/zuparo.conf /etc/nginx/sites-enabled/
# Alapértelmezett Nginx oldal letiltása (ha van):
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx szintaxis tesztelése:
sudo nginx -t

# Újratöltés:
sudo systemctl reload nginx
```

---

## 🔒 9. Ingyenes SSL Tanúsítvány (HTTPS - Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d zuparo.hu -d www.zuparo.hu
```
A Certbot automatikusan bekonfigurálja a HTTPS-t és megújítja a tanúsítványt 3 havonta.

---

## 🎯 10. Kész! Tesztelés & Karbantartás

Nyisd meg a böngészőben: `https://zuparo.hu`
- Adminisztrációs felület: `https://zuparo.hu/belepes`
- Alapértelmezett admin belépés (első indításkor automatikusan létrejön a MongoDB-ben):
  - **Email:** `admin@zuparo.hu`
  - **Jelszó:** `admin123`

### Hasznos parancsok a mindennapi karbantartáshoz:
- **Alkalmazás újraindítása:** `pm2 restart food2`
- **Alkalmazás logjai (hibák, rendelések):** `pm2 logs food2`
- **MongoDB állapot:** `sudo systemctl status mongod`
- **Nginx állapot:** `sudo systemctl status nginx`
