# 🚀 Deploy Track Senpi ke Vercel + Supabase

## ✨ Kenapa Vercel + Supabase?
- ✅ **100% GRATIS SELAMANYA** tanpa kartu kredit
- ✅ **Unlimited bandwidth** & deployments
- ✅ **PostgreSQL 500 MB gratis** (Supabase)
- ✅ **Auto SSL/HTTPS** + Custom domain gratis
- ✅ **Serverless** - gak perlu manage server
- ✅ **Edge Network** - super cepat di seluruh dunia
- ✅ **Zero cold start** untuk frontend

---

## 📋 Prerequisites

1. **Akun GitHub** (sudah ada ✅)
2. **Akun Vercel** (gratis, login pakai GitHub)
3. **Akun Supabase** (gratis, login pakai GitHub)

---

## 🎯 Part 1: Setup Supabase (Database)

### 1️⃣ Daftar di Supabase

1. Buka https://supabase.com/
2. Klik **"Start your project"**
3. **Sign in with GitHub**
4. Authorize Supabase

### 2️⃣ Buat Project Baru

1. Klik **"New Project"**
2. Isi form:
   - **Name**: `track-senpi`
   - **Database Password**: (buat password kuat, simpan!)
   - **Region**: Singapore (Southeast Asia)
   - **Pricing Plan**: **Free** ✅
3. Klik **"Create new project"**
4. Tunggu 2-3 menit setup database

### 3️⃣ Initialize Database Schema

1. Setelah project ready, klik tab **"SQL Editor"** (sidebar kiri)
2. Klik **"New Query"**
3. Copy paste isi file `backend/database/schema.sql` ke SQL editor
4. Klik **"Run"** (Ctrl+Enter)
5. Seharusnya muncul "Success. No rows returned"

### 4️⃣ Copy Connection String

1. Klik **Settings** (gear icon) → **Database**
2. Scroll ke **Connection String** → pilih **URI**
3. Copy connection string (format: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`)
4. Replace `[password]` dengan password yang kamu buat tadi
5. **SIMPAN** connection string ini! (akan dipakai di Vercel)

**Contoh**:
```
postgresql://postgres:mySecurePassword123@db.abcdefghijk.supabase.co:5432/postgres
```

---

## 🎯 Part 2: Deploy ke Vercel

### 1️⃣ Install Vercel CLI

```powershell
npm install -g vercel
```

### 2️⃣ Login ke Vercel

```powershell
vercel login
```

Pilih **GitHub** → authorize di browser

### 3️⃣ Deploy Project

```powershell
# Di root folder track-senpi
vercel

# Ikuti prompts:
# ? Set up and deploy "~/track-senpi"? [Y/n] Y
# ? Which scope? [pilih account kamu]
# ? Link to existing project? [N]
# ? What's your project's name? track-senpi
# ? In which directory is your code located? ./
```

Vercel akan:
- Upload semua files
- Build project
- Deploy ke production
- Kasih URL: `https://track-senpi.vercel.app`

### 4️⃣ Set Environment Variables

```powershell
# Set DATABASE_URL dari Supabase
vercel env add DATABASE_URL

# Paste connection string dari Supabase, pilih: Production, Preview, Development

# Set JWT Secret (generate random)
vercel env add JWT_SECRET
# Paste: [generate random 32 char string]

# Set admin credentials
vercel env add ADMIN_USERNAME
# Value: admin

vercel env add ADMIN_PASSWORD
# Value: Admin123!

vercel env add ADMIN_NRP
# Value: 99999999

vercel env add ADMIN_NAMA
# Value: Administrator
```

### 5️⃣ Redeploy dengan Environment Variables

```powershell
vercel --prod
```

---

## 🎯 Part 3: Update Frontend

### 1️⃣ Update API URL

Setelah deployment selesai, kamu akan dapat URL seperti:
```
https://track-senpi.vercel.app
```

Update `js/api-client.js` line 11:

```javascript
// const API_URL = 'http://localhost:3000';
const API_URL = 'https://track-senpi.vercel.app/api';
```

### 2️⃣ Commit & Push

```powershell
git add js/api-client.js
git commit -m "Update API URL to Vercel"
git push
```

Vercel akan **auto-deploy** setiap kali ada push ke GitHub! 🎉

---

## 🧪 Testing

### 1️⃣ Test API Endpoint

Buka di browser:
```
https://track-senpi.vercel.app/api
```

Harus muncul:
```json
{
  "status": "OK",
  "message": "Track Senpi API is running on Vercel",
  "timestamp": "2025-12-05T..."
}
```

### 2️⃣ Test Login

1. Buka `https://track-senpi.vercel.app/index.html`
2. Login dengan:
   - **Username**: admin
   - **Password**: Admin123!
3. Seharusnya redirect ke dashboard

### 3️⃣ Test Real-Time Tracking

1. Buka dashboard admin
2. Cek map muncul
3. Test add user, add senpi
4. Test location tracking

---

## 📊 Monitoring

### Vercel Dashboard
1. Buka https://vercel.com/dashboard
2. Pilih project **track-senpi**
3. Lihat:
   - **Deployments**: history semua deployment
   - **Analytics**: traffic, performance
   - **Logs**: real-time function logs
   - **Settings**: environment variables, domains

### Supabase Dashboard
1. Buka https://supabase.com/dashboard
2. Pilih project **track-senpi**
3. Lihat:
   - **Table Editor**: lihat/edit data
   - **SQL Editor**: run queries
   - **Database**: connection stats
   - **Logs**: query logs

---

## ⚙️ Custom Domain (Opsional)

Kalau punya domain sendiri (misal: `track.polda.id`):

1. Di Vercel Dashboard → Settings → Domains
2. Add domain kamu
3. Ikuti instruksi setup DNS (CNAME record)
4. SSL otomatis di-provision

---

## 🔧 Troubleshooting

### API Error 500
- Cek Vercel Logs: Dashboard → Logs
- Pastikan environment variables sudah di-set
- Cek database connection string benar

### Database Connection Failed
- Pastikan Supabase project masih aktif (free tier)
- Cek connection string format benar
- Test koneksi dari SQL Editor Supabase

### Login Gagal
- Cek database schema sudah di-run
- Cek tabel `users` ada data admin
- Cek JWT_SECRET sudah di-set

### Cold Start Lambat
- **Tidak ada cold start** untuk Vercel Edge!
- Tapi function pertama kali call bisa 1-2 detik
- Setelah warm, response < 100ms

---

## 💡 Tips

### 1. Auto Preview Deployment
Setiap branch atau PR akan dapat preview URL otomatis:
```
https://track-senpi-git-feature-branch.vercel.app
```

### 2. Environment Variables per Environment
- **Production**: URL production
- **Preview**: untuk test branch
- **Development**: untuk local dev

### 3. Vercel Analytics
Upgrade ke Pro ($20/month) untuk:
- Web Analytics
- Real-time monitoring
- Higher limits

Tapi **free tier cukup** untuk project ini!

---

## 📈 Limits Free Tier

### Vercel (Hobby Plan)
- ✅ **Bandwidth**: 100 GB/month
- ✅ **Serverless Functions**: Unlimited
- ✅ **Build Time**: 6000 menit/month
- ✅ **Deployments**: Unlimited
- ✅ **Team Members**: 1

### Supabase (Free Plan)
- ✅ **Database**: 500 MB storage
- ✅ **Bandwidth**: 5 GB/month
- ✅ **API Requests**: Unlimited
- ✅ **Auth**: 50,000 MAU (Monthly Active Users)
- ⚠️ **Paused after 1 week inactivity** (gratis forever tapi harus re-activate tiap minggu)

---

## 🎉 Done!

Project kamu sekarang live di:
- **Frontend + API**: `https://track-senpi.vercel.app`
- **Database**: Supabase PostgreSQL
- **Auto-deploy**: Setiap git push
- **100% GRATIS** tanpa kartu kredit!

Enjoy! 🚀
