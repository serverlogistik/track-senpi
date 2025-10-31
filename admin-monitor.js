// admin-monitor.js
// Stealth (live location) monitoring for Admin Dashboard with Firebase realtime support + localStorage fallback.
// Features:
// - Realtime subscribe to Firebase lastKnownByNrp (preferred) or stream lastKnownLocations (fallback) to build latest per NRP
// - Realtime subscribe to temp_users_data to keep user directory (USERS_DATA) fresh
// - Render live table and Leaflet map markers
// - Export latest locations
// - Simple history viewer (from Firebase if available, fallback to localStorage stealth cache)
//
// Requirements:
// - Leaflet loaded on pages that show the map (L global)
// - Firebase SDK compat + js/firebase-init.js + js/firebase-listener.js loaded before this file for realtime
// - A global USERS_DATA object may be set by the page; otherwise we maintain a local copy and also write to window.USERS_DATA
//
// Public API:
//   const mon = new StealthAdminMonitor({ mapId: 'liveMap' });
//   mon.init();  // init map, attach realtime listeners, and first paint
//
//   Global helper functions (for convenience in onClick handlers):
//     viewStealthHistory(nrp)
//     forceStealthUpdate(nrp)
//     refreshStealthData()
//     exportStealthData()
//
(function () {
  'use strict';

  const LS_STEALTH_KEY = 'stealth_location_data'; // legacy localStorage shadow
  const DEFAULT_CENTER = [-6.2, 106.8];
  const DEFAULT_ZOOM = 10;

  class StealthAdminMonitor {
    constructor(options = {}) {
      this.mapId = options.mapId || 'liveMap';
      this.map = null;
      this.markers = {};
      this.latestByNrp = {}; // { [nrp]: { lat, lng, accuracy, timestamp, ... } }
      this.usersData = window.USERS_DATA || {};
      this.unsubscribe = [];
      this.autoRefreshMs = options.autoRefreshMs || 30000; // for periodic repaint fallback
      this._refreshTimer = null;
    }

    init() {
      this.initMap();
      this.attachRealtime();
      this.refreshFromFallback();
      this.scheduleAutoRefresh();
      // expose reference
      window.stealthAdminMonitor = this;
      console.log('🦇 StealthAdminMonitor initialized');
    }

    initMap() {
      try {
        const el = document.getElementById(this.mapId);
        if (!el) return;
        if (typeof L === 'undefined' || !L.map) {
          console.warn('Leaflet not detected; map disabled.');
          return;
        }
        this.map = L.map(this.mapId).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
      } catch (e) {
        console.warn('initMap error', e);
      }
    }

    attachRealtime() {
      try {
        if (!window.firebaseListeners) {
          console.warn('firebaseListeners not available; realtime disabled. Using fallback only.');
          return;
        }

        // Keep USERS_DATA fresh
        if (firebaseListeners.subscribeTempUsers) {
          const offUsers = firebaseListeners.subscribeTempUsers((obj) => {
            this.usersData = obj || {};
            window.USERS_DATA = this.usersData;
            this.paint();
          });
          this.unsubscribe.push(offUsers);
        }

        // Prefer aggregated latest-by-NRP snapshot
        if (firebaseListeners.subscribeLastByNrp) {
          const offByNrp = firebaseListeners.subscribeLastByNrp((obj) => {
            this.latestByNrp = obj || {};
            this.paint();
          });
          this.unsubscribe.push(offByNrp);
        } else if (firebaseListeners.subscribeLastLocations) {
          // Fallback: aggregate from child_added stream
          const offLocs = firebaseListeners.subscribeLastLocations(500, (_key, val) => {
            if (val && val.nrp) {
              this.latestByNrp[val.nrp] = val;
              this.paint();
            }
          });
          this.unsubscribe.push(offLocs);
        } else {
          console.warn('No Firebase location listeners available; realtime disabled.');
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.destroy());
      } catch (e) {
        console.warn('attachRealtime error', e);
      }
    }

    refreshFromFallback() {
      // If we have nothing in latestByNrp yet, derive from localStorage cache
      try {
        if (this.latestByNrp && Object.keys(this.latestByNrp).length) return;
        const raw = localStorage.getItem(LS_STEALTH_KEY);
        if (!raw) return;
        const cache = JSON.parse(raw) || {};
        const result = {};
        Object.keys(cache).forEach(nrp => {
          const arr = cache[nrp] || [];
          if (arr.length) {
            result[nrp] = { ...arr[arr.length - 1], nrp };
          }
        });
        if (Object.keys(result).length) {
          this.latestByNrp = { ...result, ...this.latestByNrp };
          this.paint();
        }
      } catch (e) {
        console.warn('refreshFromFallback error', e);
      }
    }

    scheduleAutoRefresh() {
      try {
        if (this._refreshTimer) clearInterval(this._refreshTimer);
        this._refreshTimer = setInterval(() => {
          this.paint();
        }, this.autoRefreshMs);
      } catch (e) {}
    }

    paint() {
      this.updateTrackingTable();
      this.updateMap();
    }

    updateTrackingTable() {
      try {
        const tbody = document.getElementById('trackingTable');
        if (!tbody) return;

        const filter = (window.currentFilter || '').toLowerCase();
        const users = this.usersData || {};

        const rows = Object.keys(users).map(nrp => {
          const user = users[nrp];
          if (!user) return null;

          // filter by nrp or name
          if (filter) {
            const name = (user.nama || '').toLowerCase();
            if (!String(nrp).includes(filter) && !name.includes(filter)) return null;
          }

          const last = this.getLatestForNrp(nrp);
          let status = 'OFFLINE';
          let statusClass = 'status-expired';
          let lastUpdate = '-';
          let coords = '-';
          let accuracy = '-';
          let badgeNote = '';

          if (last) {
            const ts = new Date(last.timestamp || last.ts || Date.now());
            const minutesAgo = Math.floor((Date.now() - ts.getTime()) / 60000);
            status = minutesAgo <= 10 ? 'ONLINE' : minutesAgo <= 60 ? 'IDLE' : 'OFFLINE';
            statusClass = minutesAgo <= 10 ? 'status-aktif' : minutesAgo <= 60 ? 'status-pending' : 'status-expired';
            lastUpdate = `${minutesAgo} menit lalu`;
            if (!isNaN(Number(last.lat)) && !isNaN(Number(last.lng))) {
              coords = `${Number(last.lat).toFixed(4)}, ${Number(last.lng).toFixed(4)}`;
            }
            if (!isNaN(Number(last.accuracy))) {
              accuracy = `${Math.round(Number(last.accuracy))}m`;
            }
            badgeNote = last._source === 'local' ? 'Stealth (cache)' : 'Realtime';
          }

          return `
            <tr>
              <td><strong>${nrp}</strong></td>
              <td>${user.nama || '-'}</td>
              <td>
                <span class="coordinates">${coords}</span>
                ${last ? `<br><small style="color:#666;">${badgeNote}</small>` : ''}
              </td>
              <td>${accuracy}</td>
              <td>${lastUpdate}</td>
              <td><span class="status-badge ${statusClass}">${status}</span></td>
              <td>
                <button class="btn btn-assign" onclick="viewStealthHistory('${nrp}')"><i class="fas fa-user-secret"></i> History</button>
                <button class="btn btn-edit" onclick="forceStealthUpdate('${nrp}')"><i class="fas fa-sync-alt"></i> Refresh</button>
              </td>
            </tr>
          `;
        }).filter(Boolean);

        tbody.innerHTML = rows.length ? rows.join('') : `
          <tr>
            <td colspan="7" class="empty-state">
              <i class="fas fa-circle-info"></i>
              <div>Tidak ada data yang cocok.</div>
            </td>
          </tr>
        `;
      } catch (e) {
        console.warn('updateTrackingTable error', e);
      }
    }

    updateMap() {
      try {
        if (!this.map) return;
        // clear markers
        Object.keys(this.markers).forEach(nrp => {
          try { this.markers[nrp].remove(); } catch (e) {}
        });
        this.markers = {};

        const users = this.usersData || {};
        Object.keys(this.latestByNrp || {}).forEach(nrp => {
          const last = this.latestByNrp[nrp];
          if (!last) return;
          const lat = Number(last.lat);
          const lng = Number(last.lng);
          if (isNaN(lat) || isNaN(lng)) return;

          const user = users[nrp];
          const stealthIcon = (typeof L !== 'undefined' && L.divIcon) ? L.divIcon({
            className: 'stealth-marker-icon',
            html: '🦇',
            iconSize: [25, 25]
          }) : undefined;

          if (typeof L !== 'undefined' && L.marker) {
            const marker = L.marker([lat, lng], stealthIcon ? { icon: stealthIcon } : {})
              .addTo(this.map)
              .bindPopup(`
                <div class="stealth-popup">
                  <strong>${(user && user.nama) || '-'}</strong><br>
                  <small>NRP: ${nrp}</small><br>
                  <em>🦇 ${last._source === 'local' ? 'Stealth Cache' : 'Realtime'}</em><br>
                  Akurasi: ${!isNaN(Number(last.accuracy)) ? Math.round(Number(last.accuracy)) : '-'}m<br>
                  Update: ${new Date(last.timestamp || last.ts || Date.now()).toLocaleTimeString()}
                </div>
              `);
            this.markers[nrp] = marker;
          }
        });
      } catch (e) {
        console.warn('updateMap error', e);
      }
    }

    getLatestForNrp(nrp) {
      // Prefer realtime
      if (this.latestByNrp && this.latestByNrp[nrp]) {
        const v = this.latestByNrp[nrp];
        return { ...v, _source: v._source || 'cloud' };
      }
      // Fallback from localStorage
      try {
        const raw = localStorage.getItem(LS_STEALTH_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw) || {};
        const arr = cache[nrp] || [];
        if (!arr.length) return null;
        return { ...arr[arr.length - 1], _source: 'local' };
      } catch (e) {
        return null;
      }
    }

    exportLatest(filename) {
      try {
        const data = this.latestByNrp && Object.keys(this.latestByNrp).length
          ? this.latestByNrp
          : JSON.parse(localStorage.getItem(LS_STEALTH_KEY) || '{}');

        const dataStr = JSON.stringify(data || {}, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `stealth-latest-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        alert('Data lokasi berhasil diexport!');
      } catch (e) {
        alert('Gagal export data lokasi');
      }
    }

    destroy() {
      try {
        if (this._refreshTimer) clearInterval(this._refreshTimer);
      } catch (e) {}
      try {
        (this.unsubscribe || []).forEach(off => {
          try { off && off(); } catch (e) {}
        });
      } catch (e) {}
      try {
        if (this.map) { this.map.remove(); this.map = null; }
      } catch (e) {}
    }
  }

  // ===== Global helper functions (for onClick handlers)
  async function viewStealthHistory(nrp) {
    // Try Firebase history, fallback to localStorage cache
    let historyText = `🦇 Stealth History: ${((window.USERS_DATA || {})[nrp] || {}).nama || 'Unknown'} (${nrp})\n\n`;
    let found = false;

    if (window.firebase && firebase.database) {
      try {
        const db = firebase.database();
        const snap = await db.ref('lastKnownLocations').limitToLast(1000).once('value');
        const list = [];
        snap.forEach(ch => {
          const v = ch.val();
          if (v && String(v.nrp) === String(nrp)) list.push(v);
        });
        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const items = list.slice(0, 15);
        items.forEach((loc, i) => {
          const time = new Date(loc.timestamp).toLocaleString();
          historyText += `${i + 1}. ${time}\n   📍 ${Number(loc.lat).toFixed(6)}, ${Number(loc.lng).toFixed(6)}\n   🎯 ${Math.round(Number(loc.accuracy) || 0)}m\n\n`;
        });
        historyText += `\nTotal data points (sampled): ${list.length}`;
        found = items.length > 0;
      } catch (e) {
        console.warn('viewStealthHistory Firebase error', e);
      }
    }

    if (!found) {
      try {
        const cache = JSON.parse(localStorage.getItem(LS_STEALTH_KEY) || '{}');
        const locs = cache[nrp] || [];
        if (locs.length) {
          const items = locs.slice(-15).reverse();
          items.forEach((loc, i) => {
            const time = new Date(loc.timestamp).toLocaleString();
            historyText += `${i + 1}. ${time}\n   📍 ${Number(loc.lat).toFixed(6)}, ${Number(loc.lng).toFixed(6)}\n   🎯 ${Math.round(Number(loc.accuracy) || 0)}m\n\n`;
          });
          historyText += `\nTotal data points: ${locs.length}`;
          found = true;
        }
      } catch (e) {}
    }

    if (!found) historyText += 'Tidak ada data history.';
    alert(historyText);
  }

  function forceStealthUpdate(nrp) {
    // Placeholder: Implement push notification or data ping here if needed
    alert(`Meminta update lokasi stealth untuk ${nrp}`);
  }

  function refreshStealthData() {
    if (window.stealthAdminMonitor) {
      window.stealthAdminMonitor.paint();
    }
  }

  function exportStealthData() {
    if (window.stealthAdminMonitor) {
      window.stealthAdminMonitor.exportLatest();
    } else {
      // fallback export from localStorage
      try {
        const data = JSON.parse(localStorage.getItem(LS_STEALTH_KEY) || '{}');
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stealth-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        alert('Stealth data berhasil diexport!');
      } catch (e) {
        alert('Gagal export data.');
      }
    }
  }

  // Expose
  window.StealthAdminMonitor = StealthAdminMonitor;
  window.viewStealthHistory = viewStealthHistory;
  window.forceStealthUpdate = forceStealthUpdate;
  window.refreshStealthData = refreshStealthData;
  window.exportStealthData = exportStealthData;
})();
