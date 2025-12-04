# 🚀 Deploy Track Senpi ke Render.com

## ✨ Kenapa Render?
- ✅ **100% GRATIS** tanpa kartu kredit
- ✅ PostgreSQL database gratis (1 GB storage)
- ✅ SSL/HTTPS otomatis
- ✅ Auto-deploy dari GitHub
- ✅ Region Singapore tersedia (low latency untuk Indonesia)

---

## 📋 Prerequisites

1. **Akun GitHub** (gratis)
2. **Akun Render.com** (gratis, daftar pakai GitHub)
3. **Push code ke GitHub**

---

## 🎯 Langkah-langkah Deployment

### 1️⃣ Push ke GitHub

```bash
# Inisialisasi Git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Ready for Render deployment"

# Buat repository baru di GitHub (via web: https://github.com/new)
# Nama repository: track-senpi

# Link ke GitHub
git remote add origin https://github.com/YOUR_USERNAME/track-senpi.git

# Push
git branch -M main
git push -u origin main
```

### 2️⃣ Daftar di Render.com

1. Buka https://render.com/
2. Klik **"Get Started for Free"**
3. Login dengan **GitHub** (paling gampang)
4. Authorize Render untuk akses GitHub

### 3️⃣ Deploy dari Dashboard

#### Opsi A: Pakai render.yaml (OTOMATIS) ⚡

1. Di Render Dashboard, klik **"New"** → **"Blueprint"**
2. Connect repository **track-senpi**
3. Render akan otomatis deteksi `render.yaml`
4. Klik **"Apply"**
5. Tunggu 3-5 menit, deployment selesai!

#### Opsi B: Manual Setup (jika render.yaml error)

**Setup Database:**
1. Klik **"New"** → **"PostgreSQL"**
2. Name: `track-senpi-db`
3. Database: `track_senpi`
4. User: `track_senpi_user`
5. Region: **Singapore**
6. Plan: **Free**
7. Klik **"Create Database"**
8. Copy **Internal Database URL** (simpan dulu)

**Setup Web Service:**
1. Klik **"New"** → **"Web Service"**
2. Connect repository **track-senpi**
3. Isi form:
   - **Name**: `track-senpi-backend`
   - **Region**: Singapore
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. **Environment Variables** (klik "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[paste Internal Database URL dari step database]
   JWT_SECRET=[generate random string 32 karakter]
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=Admin123!
   ADMIN_NRP=99999999
   ADMIN_NAMA=Administrator
   ```

5. Klik **"Create Web Service"**

### 4️⃣ Inisialisasi Database (Manual)

Jika auto-initialize dari `build.sh` gagal:

1. Buka **database** → **"Connect"** → pilih **"PSQL Command"**
2. Copy command (contoh):
   ```bash
   PGPASSWORD=xxxx psql -h dpg-xxxx-a.singapore-postgres.render.com -U track_senpi_user track_senpi
   ```
3. Buka terminal, jalankan command di atas
4. Paste isi file `backend/database/schema.sql`
5. Ketik `\q` untuk keluar

### 5️⃣ Update API URL di Frontend

Setelah deployment selesai, kamu akan dapat URL seperti:
```
https://track-senpi-backend.onrender.com
```

Update `js/api-client.js` line 11:
```javascript
// const API_URL = 'http://localhost:3000';
const API_URL = 'https://track-senpi-backend.onrender.com';
```

Commit dan push lagi:
```bash
git add js/api-client.js
git commit -m "Update API URL to Render"
git push
```

---

## 🧪 Testing

1. Buka URL Render kamu di browser:
   ```
   https://track-senpi-backend.onrender.com
   ```
   
   Harus muncul: `{"status":"OK","message":"Track Senpi API is running"}`

2. Test login:
   - Buka `index.html` (pakai Live Server atau host di Vercel/Netlify)
   - Login dengan:
     - **Username**: admin
     - **Password**: Admin123!

3. Cek real-time tracking di dashboard admin

---

## 📊 Monitoring

### Cek Logs
1. Buka Render Dashboard
2. Pilih service **track-senpi-backend**
3. Klik tab **"Logs"**
4. Lihat real-time logs

### Cek Database
1. Buka database **track-senpi-db**
2. Klik **"Connect"** → **"External Connection"**
3. Gunakan tools seperti:
   - DBeaver
   - pgAdmin
   - TablePlus

---

## ⚠️ Penting untuk Free Plan

### Limitasi Render Free Tier:
- ✅ **Web Service**: 750 jam/bulan (cukup untuk 1 bulan non-stop)
- ✅ **PostgreSQL**: 1 GB storage, max 97 connections
- ⚠️ **Sleep Mode**: Service akan tidur setelah 15 menit tidak ada traffic
- ⚠️ **Cold Start**: Butuh 30-60 detik untuk bangun dari tidur

### Tips Agar Service Tidak Tidur:
1. Pakai **cron job** ping setiap 10 menit:
   - UptimeRobot (gratis): https://uptimerobot.com/
   - Cron-job.org (gratis): https://cron-job.org/

2. Setup di UptimeRobot:
   - Monitor Type: **HTTP(s)**
   - URL: `https://track-senpi-backend.onrender.com`
   - Interval: **10 minutes**

---

## 🔧 Troubleshooting

### Build Failed
- Cek **Logs** di Render Dashboard
- Pastikan `build.sh` executable: `chmod +x backend/build.sh`
- Commit lagi dan push

### Database Connection Error
- Cek environment variable `DATABASE_URL` sudah benar
- Format harus: `postgresql://user:password@host:port/database`
- Pastikan database sudah **Active** (bukan Suspended)

### Service Tidak Bisa Diakses
- Tunggu 3-5 menit setelah deployment
- Cek status di Dashboard (harus **Live**)
- Pastikan tidak ada error di Logs

### Login Gagal
- Cek database sudah ter-initialize (tabel `users` ada)
- Cek default admin sudah terinsert
- Test langsung API: `https://your-url.onrender.com/api/auth/login`

---

## 🚀 Deploy Frontend (Opsional)

Frontend (HTML/JS) bisa di-host GRATIS di:

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Framework Preset: Other
# - Root Directory: ./
# - Build Command: (kosongkan)
# - Output Directory: ./
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### GitHub Pages
1. Push ke branch `gh-pages`
2. Settings → Pages → Source: `gh-pages`

---

## 📞 Support

Jika ada masalah:
1. Cek Render Logs terlebih dahulu
2. Cek `TEST-CHECKLIST.md` untuk testing
3. Baca dokumentasi Render: https://render.com/docs

---

## 🎉 Done!

Selamat! Track Senpi kamu sekarang sudah live di Render.com dengan:
- ✅ Backend API + WebSocket
- ✅ PostgreSQL Database
- ✅ SSL/HTTPS otomatis
- ✅ 100% GRATIS tanpa kartu kredit!

**URL Production**: `https://track-senpi-backend.onrender.com`
