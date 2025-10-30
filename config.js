// config.js - konfigurasi client API
// Ganti API_BASE dengan URL server yang akan di-deploy (mis. https://your-api.app)
const CONFIG = {
  // contoh: 'https://track-senpi-api.example.com' (tanpa trailing slash)
  API_BASE: 'https://YOUR_API_BASE_HERE',
  API_TOKEN: '' // optional: isi jika server memerlukan API token
};

// utility: safe check
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}