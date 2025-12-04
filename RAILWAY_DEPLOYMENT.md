# Track Senpi - Railway Deployment Guide

## 🚀 Quick Deploy ke Railway

### 1. Setup Railway Account
1. Daftar di [Railway.app](https://railway.app)
2. Login dengan GitHub
3. Klik "New Project"

### 2. Deploy Backend

#### Via Railway CLI (Recommended):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy dari folder backend
cd backend
railway init
railway up
```

#### Via GitHub (Alternative):
1. Push project ke GitHub
2. Di Railway: "New Project" → "Deploy from GitHub"
3. Pilih repo `track-senpi`
4. Railway akan auto-detect dan deploy

### 3. Setup Database PostgreSQL

1. Di Railway Project dashboard, klik "New"
2. Pilih "Database" → "Add PostgreSQL"
3. Railway akan auto-create database dan set `DATABASE_URL`
4. Klik database → "Query" → paste isi `database/schema.sql`
5. Execute untuk create tables

### 4. Set Environment Variables

Di Railway project settings → Variables, tambahkan:

```env
JWT_SECRET=buat-secret-key-random-yang-aman
NODE_ENV=production
ADMIN_NRP=00000001
ADMIN_PASSWORD=admin123

# Optional (untuk upload gambar ke Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Get Railway URL

Setelah deploy sukses:
1. Railway akan kasih public URL: `https://your-app.up.railway.app`
2. Copy URL ini
3. Buka file `js/api-client.js`
4. Ganti baris 11:
   ```javascript
   : 'https://your-railway-app.up.railway.app/api'
   ```
   Dengan URL Railway kamu

### 6. Update Frontend

Ganti semua script Firebase di HTML files dengan api-client:

**Di `dashboard-admin.html`, `dashboard-anggota.html`, `index.html`:**

Hapus:
```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
<script src="js/firebase-init.js"></script>
<script src="js/firebase-storage.js"></script>
<script src="js/firebase-sync-queue.js"></script>
<script src="js/firebase-listener.js"></script>
```

Ganti dengan:
```html
<script src="js/api-client.js"></script>
```

### 7. Test Connection

Buka browser console dan test:
```javascript
// Test API connection
apiClient.getAllUsers().then(users => console.log(users));

// Test login
apiClient.login('00000001', 'admin123').then(res => console.log(res));
```

## 📝 API Endpoints

```
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout user
POST   /api/auth/verify             - Verify token

GET    /api/users                   - Get all users
GET    /api/users/:nrp              - Get user by NRP
POST   /api/users                   - Create new user
PUT    /api/users/:nrp              - Update user
DELETE /api/users/:nrp              - Delete user
POST   /api/users/bulk-update       - Bulk update users

GET    /api/senpi                   - Get all senpi
GET    /api/senpi/user/:nrp         - Get senpi by NRP
POST   /api/senpi                   - Create senpi
PUT    /api/senpi/:nomor_seri       - Update senpi
POST   /api/senpi/:nomor_seri/assign - Transfer senpi
DELETE /api/senpi/:nomor_seri       - Delete senpi

POST   /api/location                - Save location
GET    /api/location/latest         - Get latest locations
GET    /api/location/history/:nrp   - Get location history
GET    /api/location/recent         - Get recent locations

POST   /api/upload/single           - Upload single file
POST   /api/upload/multiple         - Upload multiple files
DELETE /api/upload/:filename        - Delete file
```

## 🔧 Local Development

```bash
# Install dependencies
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env dengan database lokal atau Railway DB URL

# Run locally
npm run dev

# Frontend
# Buka index.html di browser (gunakan Live Server)
```

## 📊 Migrate Data dari Firebase

Jika punya data di Firebase, export dulu:

```javascript
// Di Firebase console atau browser
const data = await firebase.database().ref('temp_users_data').once('value');
const users = data.val();

// Save to JSON
console.log(JSON.stringify(users, null, 2));

// Import ke Railway via API
await apiClient.bulkUpdateUsers(users);
```

## 🐛 Troubleshooting

### CORS Error
Tambahkan domain kamu di `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.com', 'http://localhost'],
  credentials: true
}));
```

### Database Connection Error
Check environment variable `DATABASE_URL` di Railway

### WebSocket Not Working
Railway auto-support WebSocket, pastikan URL benar di `api-client.js`

## 📦 File Structure

```
track-senpi/
├── backend/
│   ├── server.js           # Main server
│   ├── package.json        # Dependencies
│   ├── Procfile           # Railway deploy config
│   ├── railway.json       # Railway settings
│   ├── .env.example       # Environment template
│   ├── database/
│   │   └── schema.sql     # Database schema
│   └── routes/
│       ├── auth.js        # Authentication
│       ├── users.js       # User management
│       ├── senpi.js       # Senpi management
│       ├── location.js    # Location tracking
│       └── upload.js      # File upload
├── js/
│   └── api-client.js      # Frontend API client
└── [HTML files]           # Frontend pages
```

## 💡 Tips

- Railway free tier: 500 jam/bulan (cukup untuk project kecil)
- Database auto-backup di Railway
- Gunakan Railway's environment variables untuk secrets
- Monitor logs via Railway dashboard
- Scale dengan upgrade plan jika perlu

## 🆘 Support

Jika ada error:
1. Check Railway logs: Railway dashboard → Deployments → View Logs
2. Check browser console untuk frontend errors
3. Test API langsung: `curl https://your-app.up.railway.app/api/health`
