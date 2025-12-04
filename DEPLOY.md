# 🚀 Deploy Track Senpi ke Vercel + Supabase

## Setup Super Cepat - 100% GRATIS!

### 1️⃣ Deploy ke Vercel (2 menit)

1. Buka https://vercel.com/login
2. **Continue with GitHub**
3. **Add New** → **Project**
4. Import: **serverlogistik/track-senpi**
5. **Deploy** (tunggu 1-2 menit)

### 2️⃣ Setup Supabase Database (3 menit)

1. Buka https://supabase.com/
2. **Sign in with GitHub**
3. **New Project**:
   - Name: `track-senpi`
   - Password: (buat & simpan!)
   - Region: **Singapore**
   - Plan: **Free**
4. Tunggu 2 menit sampai ready

### 3️⃣ Initialize Database

1. Klik **SQL Editor** → **New query**
2. Copy paste isi `api/database/schema.sql`
3. **Run** (Ctrl+Enter)

### 4️⃣ Get Database URL

1. **Settings** → **Database**
2. **Connection String** → **URI**
3. Copy dan ganti `[YOUR-PASSWORD]` dengan password kamu
4. Simpan URL ini!

### 5️⃣ Set Environment Variables

Di Vercel → **Settings** → **Environment Variables**, tambahkan:

```
DATABASE_URL = postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres
JWT_SECRET = [random 32 characters]
NODE_ENV = production
ADMIN_USERNAME = admin
ADMIN_PASSWORD = Admin123!
ADMIN_NRP = 99999999
ADMIN_NAMA = Administrator
```

Generate JWT_SECRET:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 6️⃣ Redeploy

1. **Deployments** → **...** → **Redeploy**
2. Tunggu 1 menit

### 7️⃣ Update Frontend URL

Setelah deploy, dapat URL seperti: `https://track-senpi.vercel.app`

Edit `js/api-client.js` line 11 dengan URL Vercel kamu, lalu:

```bash
git add .
git commit -m "Update Vercel URL"
git push
```

### 8️⃣ Test!

Buka: `https://track-senpi.vercel.app/index.html`

Login:
- Username: `admin`
- Password: `Admin123!`

## ✅ Done! 

Frontend + Backend + Database semuanya **100% GRATIS SELAMANYA**! 🎉
