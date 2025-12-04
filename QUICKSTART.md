# Quick Start - Railway Deployment

## ⚠️ PENTING: Test Dulu Sebelum Deploy!

**Lihat file [`TESTING.md`](TESTING.md) untuk panduan testing lengkap!**

Testing lokal memastikan semuanya works sebelum deploy production.

---

## 🚀 Deploy Sekarang (5 Menit!)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login Railway
```bash
railway login
```
Browser akan terbuka, login dengan GitHub.

### Step 3: Deploy Backend
```bash
cd backend
railway init
railway up
```

Railway akan deploy otomatis!

### Step 4: Add PostgreSQL Database
```bash
railway add
```
Pilih "PostgreSQL"

### Step 5: Initialize Database
1. Buka Railway dashboard: https://railway.app/dashboard
2. Klik project kamu
3. Klik "PostgreSQL" service
4. Tab "Query"
5. Copy-paste isi file `database/schema.sql`
6. Klik "Run Query"

### Step 6: Set Environment Variables
Di Railway dashboard → Backend service → Variables:
```
JWT_SECRET=buatRandomSecretKeyDiSini123456789
NODE_ENV=production
ADMIN_NRP=00000001
ADMIN_PASSWORD=admin123
```

### Step 7: Get Railway URL
Di Railway dashboard, copy public URL (contoh: `https://track-senpi-production.up.railway.app`)

### Step 8: Update Frontend
Edit file `js/api-client.js` baris 11:
```javascript
: 'https://track-senpi-production.up.railway.app/api'
```
Ganti dengan URL Railway kamu!

### Step 9: Test!
1. Buka `index.html` di browser
2. Login admin: NRP `00000001`, Password `admin123`
3. Sukses! ✅

## 💾 Import Data Firebase (Opsional)

Jika punya data di Firebase:

```javascript
// 1. Di Firebase console browser, export data
const snapshot = await firebase.database().ref('temp_users_data').once('value');
const data = snapshot.val();
console.log(JSON.stringify(data, null, 2));

// Copy output JSON

// 2. Import via API (di browser console halaman yang sudah login)
await apiClient.bulkUpdateUsers(pasteDataDiSini);
```

## 🔧 Local Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env, tambahkan DATABASE_URL dari Railway
npm run dev
```

Frontend: Buka `index.html` dengan Live Server VSCode.

## ✅ Checklist

- [ ] Railway CLI installed
- [ ] Backend deployed
- [ ] PostgreSQL added & schema initialized
- [ ] Environment variables set
- [ ] API URL updated in api-client.js
- [ ] Login test sukses

**Done! Sistem sudah jalan di Railway! 🎉**
