# Environment Variables untuk Vercel

Copy dan paste environment variables berikut ke Vercel Settings → Environment Variables:

## Required Environment Variables:

### 1. DATABASE_URL
```
postgresql://postgres:Asuedan00%40@db.ltcapxefabwdenbxoygw.supabase.co:5432/postgres
```
**Note**: `%40` adalah URL encoding untuk karakter `@` dalam password

### 2. JWT_SECRET
```
q7suNVJOQHM6bU0GevSCyLohPIzj2n3c
```

### 3. NODE_ENV
```
production
```

### 4. ADMIN_NRP (Optional)
```
00030948
```

### 5. ADMIN_PASSWORD (Optional)
```
Asuedan00@
```

---

## Cara Set di Vercel:

1. Buka project di Vercel dashboard
2. **Settings** → **Environment Variables**
3. Tambahkan satu per satu:
   - Key: (nama variable)
   - Value: (value dari atas)
   - Environment: **Centang semua** (Production, Preview, Development)
4. Klik **Save**
5. Setelah semua tersimpan, **Redeploy** project

---

## Login Credentials:

- **NRP**: `00030948`
- **Password**: `Asuedan00@`
