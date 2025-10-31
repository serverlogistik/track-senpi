# Sync & API quickstart (Track-Senpi)

Patch ini menambahkan:
- config.js (client config)
- api-client.js (fetch wrapper)
- client-sync.js (non-invasive monkey-patches + sync helpers)
- server/ (contoh Node/Express minimal)

Tujuan:
- Memungkinkan semua device mengirim data ke API pusat (POST /records)
- Audit logs dikirim ke API (POST /logs) jika tersedia, fallback ke localStorage
- Stealth tracking queue & sync (pending locations) ketika online
- Admin dashboard bisa mengambil data dari API (GET /records)

Langkah singkat setelah apply patch:

1) Apply patch:
   git apply sync-api-integration.patch

2) Install & run example server (opsional di lokal):
   cd server
   npm install
   npm start
   // server default http://localhost:3000

3) Update client config:
   - Buka file config.js, set CONFIG.API_BASE = 'https://your-deployed-api' (tanpa trailing slash)

4) Include client scripts in HTML (dashboard pages)
   Tambahkan di head atau sebelum akhir </body> di page yang relevan (index.html, dashboard-anggota.html, dashboard-admin.html)

   <script src="config.js"></script>
   <script src="api-client.js"></script>
   <script src="client-sync.js"></script>

   Pastikan urutannya: config.js -> api-client.js -> client-sync.js -> existing scripts (atau client-sync.js setelah original scripts).

5) Deploy server:
   - Deploy folder server/ ke Railway / Render / Heroku / DigitalOcean App atau server lain.
   - Setelah deploy, update CONFIG.API_BASE di config.js ke URL produksi.

6) Test:
   - Dari device A/B: lakukan input/update di dashboard-anggota.html
   - Dari admin: buka dashboard-admin.html (harus sudah include script) -> client-sync akan mencoba GET /records dan memanggil renderRecordsTable(data)
   - Cek server logs atau curl GET /records

Catatan penting:
- Server contoh menggunakan in-memory array -> data akan hilang saat server restart. Ganti ke DB (Postgres/Mongo) untuk produksi.
- Tambahkan autentikasi (API token / JWT) dan validasi payload di server production.
- Jika web app menggunakan cookies/session, pertimbangkan menyimpan token per user (bukan device-bound) sehingga user bisa login dari multi-device.

Jika mau, saya bisa juga kirim patch yang langsung memodifikasi HTML untuk menambahkan script tags (langsung diffs). Konfirmasi kalau kamu mau saya juga generate patch penggantian HTML.