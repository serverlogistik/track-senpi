# 🎯 Track Senpi - Railway Edition

Sistem Tracking Senjata Api (Senpi) Polda Metro Jaya - versi Railway Backend

## 🌟 Fitur Utama

✅ **Real-time Location Tracking** - Track lokasi personel secara live  
✅ **Senpi Management** - CRUD data senjapi lengkap  
✅ **User Management** - Kelola data personel  
✅ **Admin Dashboard** - Monitoring dan kontrol penuh  
✅ **Member Dashboard** - Dashboard personel dengan update lokasi otomatis  
✅ **Photo Upload** - Upload foto SIMSA & Senpi  
✅ **REST API** - Backend API yang clean dan mudah dikembangkan  
✅ **WebSocket** - Real-time updates tanpa reload  

## 🚀 Quick Deploy (5 Menit!)

Lihat file [`QUICKSTART.md`](QUICKSTART.md) untuk panduan cepat deploy ke Railway.

## 📚 Documentation

- **[TESTING.md](TESTING.md)** - ⚠️ **BACA INI DULU!** Testing guide sebelum deploy
- **[QUICKSTART.md](QUICKSTART.md)** - Deploy dalam 5 menit
- **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** - Panduan deployment lengkap
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Summary migrasi dari Firebase

## 🏗️ Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Leaflet.js (Maps)
- Font Awesome (Icons)

**Backend:**
- Node.js + Express.js
- PostgreSQL Database
- WebSocket (real-time)
- JWT Authentication
- Multer (file upload)

**Deployment:**
- Railway (Backend + Database)
- GitHub Pages / Netlify / Vercel (Frontend - opsional)

## 📁 Project Structure

```
track-senpi/
├── backend/                    # Railway Backend
│   ├── server.js              # Main server
│   ├── package.json           # Dependencies
│   ├── Procfile              # Railway config
│   ├── railway.json          # Railway settings
│   ├── database/
│   │   └── schema.sql        # PostgreSQL schema
│   └── routes/
│       ├── auth.js           # Authentication
│       ├── users.js          # User CRUD
│       ├── senpi.js          # Senpi CRUD
│       ├── location.js       # Location tracking
│       └── upload.js         # File upload
├── js/
│   └── api-client.js         # Frontend API client
├── index.html                # Login page
├── dashboard-admin.html      # Admin dashboard
├── dashboard-anggota.html    # Member dashboard
├── verify.html              # Verification page
└── [other files]            # Utilities, styles, etc.
```

## 🔐 Default Credentials

**Admin Login:**
- NRP: `00000001`
- Password: `admin123`

⚠️ **Ganti password di production!**

## 🛠️ Local Development

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env dengan database URL
# Bisa pakai Railway DB atau PostgreSQL lokal
# DATABASE_URL=postgresql://user:pass@host:port/db

# Initialize database
# Railway: railway run psql < database/schema.sql
# Local: psql -d track_senpi -f database/schema.sql

# Run development server
npm run dev
```

Server runs on `http://localhost:3000`

### 2. Frontend Setup

1. Update `js/api-client.js` untuk testing:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```

2. Start local server:
   ```bash
   # Option 1: VSCode Live Server
   # Right-click index.html → Open with Live Server
   
   # Option 2: Python
   python -m http.server 8080
   
   # Option 3: Node.js
   npx http-server -p 8080
   ```

3. Open `http://localhost:8080/index.html`

### 3. Quick Test

```bash
# Windows:
test-backend.bat

# Linux/Mac:
bash test-backend.sh
```

**📖 Lihat [`TESTING.md`](TESTING.md) untuk panduan testing lengkap!**

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login       - Login user/admin
POST   /api/auth/logout      - Logout
POST   /api/auth/verify      - Verify JWT token
```

### Users
```
GET    /api/users                   - Get all users
GET    /api/users/:nrp              - Get user by NRP
POST   /api/users                   - Create new user
PUT    /api/users/:nrp              - Update user
DELETE /api/users/:nrp              - Delete user
POST   /api/users/bulk-update       - Bulk update (Firebase migration)
```

### Senpi
```
GET    /api/senpi                          - Get all senpi
GET    /api/senpi/user/:nrp                - Get senpi by user
POST   /api/senpi                          - Create senpi
PUT    /api/senpi/:nomor_seri              - Update senpi
POST   /api/senpi/:nomor_seri/assign       - Transfer senpi
DELETE /api/senpi/:nomor_seri              - Delete senpi
```

### Location Tracking
```
POST   /api/location                 - Save location
GET    /api/location/latest          - Get latest locations (all users)
GET    /api/location/history/:nrp    - Get location history
GET    /api/location/recent          - Get recent locations (limit)
```

### File Upload
```
POST   /api/upload/single     - Upload single file
POST   /api/upload/multiple   - Upload multiple files
DELETE /api/upload/:filename  - Delete file
```

## 🔧 Environment Variables

File `.env` di folder `backend/`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=production

# Admin credentials
ADMIN_NRP=00000001
ADMIN_PASSWORD=admin123

# Optional: Cloudinary for image storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📊 Database Schema

PostgreSQL tables:
- `users` - Data personel
- `senpi` - Data senjata api
- `locations` - Location tracking history
- `sessions` - Active user sessions
- `admin_logs` - Admin activity logs
- `photos` - Uploaded photos metadata

Schema lengkap ada di `backend/database/schema.sql`

## 🔄 Migration dari Firebase

Jika sebelumnya pakai Firebase:

```javascript
// 1. Export data dari Firebase
const snapshot = await firebase.database().ref('temp_users_data').once('value');
const firebaseData = snapshot.val();

// 2. Import ke Railway via API
await apiClient.bulkUpdateUsers(firebaseData);
```

Detail lengkap di [`MIGRATION_SUMMARY.md`](MIGRATION_SUMMARY.md)

## 🐛 Troubleshooting

### Backend tidak start
- Check Railway logs di dashboard
- Verify `DATABASE_URL` environment variable
- Pastikan Node.js version >= 18

### CORS Error
Update `server.js`:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost'],
  credentials: true
}));
```

### Database connection error
- Check `DATABASE_URL` format
- Verify PostgreSQL service running di Railway

### API 404 errors
- Pastikan Railway deployment sukses
- Check API URL di `api-client.js`

## 📈 Scaling

Railway free tier: 500 jam/bulan

Untuk production dengan traffic tinggi:
- Upgrade Railway plan
- Enable auto-scaling
- Consider CDN untuk frontend
- Database connection pooling sudah included

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

MIT License - lihat file LICENSE

## 👨‍💻 Developer

**serverlogistik**

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check dokumentasi di folder root
2. Review Railway logs
3. Check browser console untuk frontend errors
4. Test API dengan curl/Postman

## 🎉 Changelog

### v2.0.0 - Railway Migration
- ✅ Migrated from Firebase to Railway
- ✅ PostgreSQL database
- ✅ REST API backend
- ✅ WebSocket real-time updates
- ✅ JWT authentication
- ✅ File upload support
- ✅ Improved performance & scalability

### v1.0.0 - Firebase Version
- Initial release with Firebase Realtime Database

---

**Made with ❤️ for POLDA METRO JAYA**
