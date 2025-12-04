# Pre-Deployment Testing Checklist

**Date:** _____________  
**Tester:** _____________

## 🔧 Environment Setup

- [ ] Backend dependencies installed (`npm install`)
- [ ] Database setup (Railway atau local PostgreSQL)
- [ ] Database schema initialized (`schema.sql` dijalankan)
- [ ] `.env` file configured
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend server running (Live Server / http-server)

---

## 🧪 Backend API Tests

### Health & Auth
- [ ] ✅ `/api/health` returns status ok
- [ ] ✅ `/api/auth/login` admin berhasil (NRP: 00000001)
- [ ] ✅ Token JWT di-return
- [ ] ✅ `/api/auth/verify` token valid
- [ ] ✅ `/api/auth/logout` works

### Users API
- [ ] ✅ `GET /api/users` returns users list
- [ ] ✅ `POST /api/users` create user baru berhasil
- [ ] ✅ `GET /api/users/:nrp` get specific user
- [ ] ✅ `PUT /api/users/:nrp` update user berhasil
- [ ] ✅ `DELETE /api/users/:nrp` delete user berhasil (test user)
- [ ] ✅ `POST /api/users/bulk-update` bulk update works

### Senpi API
- [ ] ✅ `GET /api/senpi` returns senpi list
- [ ] ✅ `POST /api/senpi` create senpi baru berhasil
- [ ] ✅ `GET /api/senpi/user/:nrp` get senpi by user
- [ ] ✅ `PUT /api/senpi/:nomor_seri` update senpi berhasil
- [ ] ✅ `POST /api/senpi/:nomor_seri/assign` transfer senpi works
- [ ] ✅ `DELETE /api/senpi/:nomor_seri` delete senpi berhasil (test senpi)

### Location API
- [ ] ✅ `POST /api/location` save location berhasil
- [ ] ✅ `GET /api/location/latest` get latest locations
- [ ] ✅ `GET /api/location/history/:nrp` get user history
- [ ] ✅ `GET /api/location/recent` get recent locations

### Upload API (Optional)
- [ ] ✅ `POST /api/upload/single` upload file works
- [ ] ✅ File tersimpan di server
- [ ] ✅ URL accessible

---

## 🎨 Frontend Tests

### Login Pages
- [ ] ✅ `index.html` loads tanpa error
- [ ] ✅ Tab "Login Anggota" works
- [ ] ✅ Tab "Login Admin" works
- [ ] ✅ Admin login (00000001/admin123) berhasil
- [ ] ✅ Redirect ke dashboard admin
- [ ] ✅ Member login berhasil (test user)
- [ ] ✅ Redirect ke dashboard anggota

### Admin Dashboard
- [ ] ✅ Dashboard loads data
- [ ] ✅ Stats cards show correct numbers
- [ ] ✅ Table "Data Semua Personel" populated
- [ ] ✅ Table "Data Semua Senpi" populated
- [ ] ✅ Table "Live Stealth Tracking" works
- [ ] ✅ Map loads dengan Leaflet
- [ ] ✅ Search/filter works

### Admin Actions
- [ ] ✅ "Refresh Data" button works
- [ ] ✅ "Tambah Personel" modal opens
- [ ] ✅ Create personel baru berhasil
- [ ] ✅ User baru muncul di table
- [ ] ✅ "Tambah Senpi" modal opens
- [ ] ✅ Create senpi baru berhasil
- [ ] ✅ Senpi baru muncul di table
- [ ] ✅ "Edit Senpi" works
- [ ] ✅ Changes saved correctly
- [ ] ✅ "Assign/Pindah Senpi" works
- [ ] ✅ Senpi dipindah ke user lain
- [ ] ✅ "Logout" works

### Member Dashboard
- [ ] ✅ Dashboard loads dengan user data
- [ ] ✅ User senpi list displayed
- [ ] ✅ Map dengan user location
- [ ] ✅ Browser request location permission
- [ ] ✅ Location permission granted
- [ ] ✅ Location sent ke server
- [ ] ✅ Stealth tracking works (check console)
- [ ] ✅ Location update setiap 30 detik

### Real-time Features
- [ ] ✅ WebSocket connection established
- [ ] ✅ Location updates appear di admin dashboard
- [ ] ✅ Map markers update real-time
- [ ] ✅ User status (online/idle/offline) correct
- [ ] ✅ "Show History" button works (if implemented)

---

## 🐛 Error Handling

- [ ] ✅ Invalid login shows error message
- [ ] ✅ Network error handled gracefully
- [ ] ✅ 404 errors handled
- [ ] ✅ 401 unauthorized handled (redirect to login)
- [ ] ✅ Validation errors displayed properly

---

## 🌐 Browser Compatibility

- [ ] ✅ Chrome/Edge (latest)
- [ ] ✅ Firefox (latest)
- [ ] ✅ Safari (if available)
- [ ] ✅ Mobile Chrome
- [ ] ✅ Mobile Safari

---

## 📱 Responsive Design

- [ ] ✅ Desktop (1920x1080)
- [ ] ✅ Laptop (1366x768)
- [ ] ✅ Tablet (768px)
- [ ] ✅ Mobile (375px)

---

## 🔍 Browser Console

- [ ] ✅ No JavaScript errors
- [ ] ✅ No CORS errors
- [ ] ✅ API calls return 200 status
- [ ] ✅ WebSocket connected
- [ ] ✅ Location logs appear

---

## ⚡ Performance

- [ ] ✅ Page load < 3 seconds
- [ ] ✅ API response < 1 second
- [ ] ✅ Map renders smoothly
- [ ] ✅ No memory leaks (check DevTools)

---

## 🔐 Security

- [ ] ✅ Password tidak visible saat typing
- [ ] ✅ JWT token stored securely
- [ ] ✅ Admin routes protected
- [ ] ✅ SQL injection prevented (prepared statements)
- [ ] ✅ XSS prevented

---

## 📊 Database Checks

- [ ] ✅ Users table populated
- [ ] ✅ Senpi table populated
- [ ] ✅ Locations table receiving data
- [ ] ✅ Sessions table tracking logins
- [ ] ✅ No duplicate entries
- [ ] ✅ Foreign keys enforced
- [ ] ✅ Triggers working (updated_at)

---

## ✅ Final Verification

- [ ] ✅ All backend tests PASS
- [ ] ✅ All frontend tests PASS
- [ ] ✅ No critical errors in console
- [ ] ✅ Database integrity verified
- [ ] ✅ Ready for deployment

---

## 📝 Notes & Issues

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

---

## ✍️ Sign-off

**Tester Signature:** ____________________  
**Date:** ____________________  
**Status:** [ ] APPROVED FOR DEPLOYMENT  [ ] NEEDS FIXES

---

**After all tests PASS:**
1. Commit: `git add . && git commit -m "Testing complete - Ready for deployment"`
2. Deploy: `cd backend && railway up`
3. Update API URL: `bash update-api-url.sh`
4. Deploy frontend (GitHub Pages / Netlify / Vercel)
5. Final smoke test on production
