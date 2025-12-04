# 🧪 Testing Guide - Local Development

## 📋 Pre-Deployment Testing Checklist

**PENTING:** Test dulu sebelum deploy ke Railway!

---

## 🔧 Setup Local Testing

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Local Database (2 Options)

#### **Option A: Gunakan Railway DB (Recommended)**
```bash
# 1. Buat project Railway dulu (gratis)
railway login
railway init

# 2. Add PostgreSQL
railway add
# Pilih PostgreSQL

# 3. Link database ke local
railway link

# 4. Get database URL
railway variables
# Copy DATABASE_URL

# 5. Buat .env file
cp .env.example .env

# 6. Edit .env, paste DATABASE_URL dari Railway
# DATABASE_URL=postgresql://...
```

#### **Option B: PostgreSQL Lokal**
```bash
# Install PostgreSQL di komputer
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Start PostgreSQL service
# Windows: otomatis start setelah install
# Mac: brew services start postgresql

# Buat database
createdb track_senpi

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/track_senpi
```

### Step 3: Initialize Database

```bash
# Connect ke database dan run schema
# Kalau pakai Railway DB:
railway run psql < database/schema.sql

# Kalau pakai PostgreSQL lokal:
psql -d track_senpi -f database/schema.sql
```

### Step 4: Setup Environment Variables

Edit file `backend/.env`:

```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=test-secret-key-12345
PORT=3000
NODE_ENV=development
ADMIN_NRP=00000001
ADMIN_PASSWORD=admin123
```

### Step 5: Start Backend Server

```bash
cd backend
npm run dev
```

✅ Server should run on: `http://localhost:3000`

---

## 🧪 Test Backend API

### Test 1: Health Check

```bash
# Windows PowerShell:
Invoke-WebRequest http://localhost:3000/api/health | Select-Object -Expand Content

# Git Bash / Linux / Mac:
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T...",
  "uptime": 123.456
}
```

### Test 2: Login Admin

```bash
# PowerShell:
$body = @{
    nrp = "00000001"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json" | Select-Object -Expand Content

# Git Bash / curl:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nrp":"00000001","password":"admin123"}'
```

**Expected output:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "nrp": "00000001",
    "nama": "Super Admin",
    "isAdmin": true
  }
}
```

### Test 3: Get All Users

```bash
# PowerShell:
Invoke-WebRequest http://localhost:3000/api/users | Select-Object -Expand Content

# curl:
curl http://localhost:3000/api/users
```

---

## 🎨 Test Frontend

### Step 1: Update API URL untuk Testing

Edit `js/api-client.js` line 8-11, temporary gunakan localhost:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'http://localhost:3000/api'; // Force localhost untuk testing
```

### Step 2: Start Frontend

```bash
# Option A: Pakai Live Server VSCode
# 1. Install extension "Live Server"
# 2. Right-click index.html → "Open with Live Server"

# Option B: Pakai Python
python -m http.server 8080
# Buka: http://localhost:8080

# Option C: Pakai Node.js http-server
npx http-server -p 8080
# Buka: http://localhost:8080
```

### Step 3: Test Flow Lengkap

#### ✅ **Test 1: Admin Login**
1. Buka `http://localhost:8080/index.html`
2. Klik tab "Login Admin"
3. Input:
   - NRP: `00000001`
   - Password: `admin123`
4. Klik "Login"
5. **Expected:** Redirect ke `dashboard-admin.html`

#### ✅ **Test 2: Admin Dashboard**
1. Di dashboard admin, check:
   - [ ] Stats card muncul (Total Personel, Total Senpi, dll)
   - [ ] Table "Data Semua Personel" muncul
   - [ ] Table "Data Semua Senpi" muncul
   - [ ] Map tracking muncul
   - [ ] Refresh button works

#### ✅ **Test 3: Create User Baru**
1. Klik "Tambah Personel"
2. Input:
   - NRP: `12345678`
   - Nama: `Test User`
   - Pangkat: `BRIPKA`
   - Kesatuan: `POLRES JAKARTA SELATAN`
3. Klik "Simpan Personel"
4. **Expected:** User baru muncul di table

#### ✅ **Test 4: Create Senpi**
1. Klik "Tambah Senpi"
2. Input:
   - NRP Pemilik: `12345678`
   - Nomor Seri: `TEST001`
   - Jenis: `Senpi Pendek`
   - Keterangan: `Testing`
3. Klik "Tambah Senpi"
4. **Expected:** Senpi baru muncul di table

#### ✅ **Test 5: Member Login**
1. Logout dari admin
2. Klik tab "Login Anggota"
3. Input NRP: `12345678`
4. **Allow location access** saat browser minta
5. **Expected:** Redirect ke dashboard anggota

#### ✅ **Test 6: Location Tracking**
1. Di dashboard anggota, check console browser (F12)
2. **Expected:** Log location updates setiap 30 detik
3. Balik ke admin dashboard
4. **Expected:** User muncul di "Live Stealth Tracking" dengan lokasi

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Error: connect ECONNREFUSED`
```bash
# Check DATABASE_URL di .env
# Pastikan PostgreSQL running
# Windows: Check "Services" → PostgreSQL
# Mac: brew services list
```

**Error:** `Port 3000 already in use`
```bash
# Change PORT di .env
PORT=3001

# Atau kill process yang pakai port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Frontend CORS Error

**Error:** `Access to fetch blocked by CORS`

Fix di `backend/server.js` line 35:
```javascript
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5500', 'http://127.0.0.1:8080'],
  credentials: true
}));
```

### Database Connection Error

```bash
# Test koneksi manual
# Railway DB:
railway run psql

# Local DB:
psql -d track_senpi -U postgres

# Kalau gagal, check:
# 1. DATABASE_URL format benar
# 2. PostgreSQL service running
# 3. Database exist
# 4. Credentials benar
```

### API Returns 401 Unauthorized

```bash
# Check JWT_SECRET di .env
# Kalau ganti secret, hapus token lama:
localStorage.clear()  # Di browser console
```

---

## ✅ Testing Checklist

Sebelum deploy, pastikan semua ini PASS:

### Backend API Tests
- [ ] Health check works (`/api/health`)
- [ ] Admin login works (`/api/auth/login`)
- [ ] Get users works (`/api/users`)
- [ ] Create user works (`POST /api/users`)
- [ ] Create senpi works (`POST /api/senpi`)
- [ ] Save location works (`POST /api/location`)
- [ ] Get latest locations works (`/api/location/latest`)

### Frontend Tests
- [ ] Admin login works
- [ ] Admin dashboard loads data
- [ ] Create new user works
- [ ] Create new senpi works
- [ ] Edit senpi works
- [ ] Assign senpi works
- [ ] Member login works
- [ ] Member dashboard works
- [ ] Location tracking works
- [ ] Live map updates work
- [ ] Logout works

### Browser Console
- [ ] No JavaScript errors
- [ ] API calls return 200 status
- [ ] WebSocket connects (check Network tab)
- [ ] Location updates logged every 30s

---

## 🚀 After All Tests Pass

1. **Commit changes:**
```bash
git add .
git commit -m "Migration to Railway - Tested & Ready"
git push origin main
```

2. **Deploy to Railway:**
```bash
cd backend
railway up
```

3. **Update production API URL:**
```bash
# Ganti di js/api-client.js dengan Railway URL
bash update-api-url.sh
# Atau: update-api-url.bat (Windows)
```

4. **Deploy frontend** (optional):
   - Push ke GitHub Pages
   - Atau deploy ke Netlify/Vercel

---

## 💡 Pro Tips

1. **Use Postman/Insomnia** untuk test API endpoints lebih mudah
2. **Check Railway logs** real-time: `railway logs`
3. **Monitor database**: Railway dashboard → PostgreSQL → Metrics
4. **Browser DevTools** (F12) adalah teman terbaik kamu
5. **Test di multiple browsers**: Chrome, Firefox, Edge

---

## 🆘 Need Help?

**Common Issues:**
- Database connection → Check `DATABASE_URL`
- CORS errors → Update `server.js` origins
- 404 errors → Check API endpoint paths
- Token expired → Clear localStorage & login again

**Resources:**
- Railway Docs: https://docs.railway.app
- Express.js Docs: https://expressjs.com
- PostgreSQL Docs: https://www.postgresql.org/docs

---

**Ready to deploy after all tests PASS! ✅**
