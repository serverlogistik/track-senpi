// js/admin-track-all.js
// Menyisipkan tombol "Track Semua" di Dashboard Admin, tepat sebelum tombol "Logout".
// Saat diklik, peta akan di-zoom sehingga semua titik (marker) pengguna terlihat (fit bounds).
// Tidak mengubah CSS/tampilan yang ada; tombol meniru class dari tombol Logout agar konsisten.

(function () {
  if (window._trackAllBtnInjected) return;
  window._trackAllBtnInjected = true;

  function findLogoutButton() {
    // Cari tombol/link yang teksnya mengandung "logout" (case-insensitive)
    const candidates = Array.from(document.querySelectorAll('button, a'));
    const btn = candidates.find(el => (el.textContent || '').trim().toLowerCase() === 'logout'
      || (el.getAttribute('title') || '').trim().toLowerCase() === 'logout'
      || (el.id || '').toLowerCase().includes('logout')
      || (el.className || '').toLowerCase().includes('logout'));
    return btn || null;
  }

  function findContainer() {
    const logoutBtn = findLogoutButton();
    if (logoutBtn && logoutBtn.parentElement) return logoutBtn.parentElement;

    // Fallback: coba beberapa selector umum untuk area header/actions
    const sel = [
      '#adminHeaderActions',
      '.header-actions',
      '.admin-actions',
      '.topbar .actions',
      '.navbar .actions',
      'header .actions',
      '.topbar',
      '.navbar',
      'header'
    ];
    for (const s of sel) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    // Terakhir: body (jika tidak ketemu yang lain)
    return document.body;
  }

  function createTrackButton() {
    const logoutBtn = findLogoutButton();
    const btn = document.createElement(logoutBtn ? logoutBtn.tagName.toLowerCase() : 'button');

    btn.type = 'button';
    btn.id = 'btnTrackAll';
    btn.textContent = 'Track Semua';

    // Samakan gaya dengan Logout bila ada
    if (logoutBtn && logoutBtn.className) {
      btn.className = logoutBtn.className;
    } else {
      // Minimal default tanpa ubah tampilan global
      btn.style.margin = '0 8px';
      btn.style.cursor = 'pointer';
    }

    btn.addEventListener('click', () => {
      try {
        const mon = window.stealthAdminMonitor;
        if (!mon || !mon.map) {
          alert('Peta belum siap. Buka Dashboard Admin sepenuhnya terlebih dahulu.');
          return;
        }
        const points = [];
        const data = mon.latestByNrp || {};
        Object.keys(data).forEach(nrp => {
          const v = data[nrp];
          const lat = Number(v && v.lat);
          const lng = Number(v && v.lng);
          if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
        });

        if (!points.length) {
          alert('Belum ada titik lokasi yang dapat ditampilkan.');
          return;
        }

        if (typeof L !== 'undefined' && L.latLngBounds) {
          if (points.length === 1) {
            mon.map.setView(points[0], 16);
          } else {
            const bounds = L.latLngBounds(points);
            mon.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
          }
        } else {
          // Fallback sederhana: gunakan titik pertama
          mon.map.setView(points[0], 16);
        }
      } catch (e) {
        console.warn('Track Semua error', e);
        alert('Gagal menampilkan semua titik.');
      }
    });

    return { btn, logoutBtn };
  }

  function injectButton() {
    const container = findContainer();
    if (!container) return;

    const { btn, logoutBtn } = createTrackButton();

    if (logoutBtn && logoutBtn.parentElement === container) {
      // Sisipkan tepat sebelum Logout agar posisinya “di tengah”
      logoutBtn.parentElement.insertBefore(btn, logoutBtn);
    } else {
      // Jika tidak ketemu Logout, letakkan di ujung container (tidak mengubah styling global)
      container.appendChild(btn);
    }
  }

  // Tunda sedikit agar DOM header/tombol Logout sudah tersedia
  function ready(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(() => {
    // Coba beberapa kali (mis. bila tombol Logout dibuat dinamis)
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (document.body) {
        try {
          injectButton();
        } catch (e) {}
      }
      // Berhenti setelah 3x percobaan atau jika tombol sudah ada
      if (document.getElementById('btnTrackAll') || tries >= 3) {
        clearInterval(t);
      }
    }, 500);
  });
})();
