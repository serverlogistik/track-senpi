/* client-sync.js
   Purpose: Non-invasive client-side sync helpers that:
   - monkey-patch AuditLogger.logActivity to try sending logs to API
   - provide a StealthDataManager sync helper if present
   - attempt to POST seeding records (e.g. updateSenpi) if overridden
   Usage:
     1) Include config.js and api-client.js before this file in HTML
     2) Include this file near the end of <body> so original classes are loaded
*/
(function () {
  const readyCheckInterval = 300; // ms

  function safeLog(...args) {
    if (console && console.log) console.log('[client-sync]', ...args);
  }

  // Patch AuditLogger.logActivity if exists
  function patchAuditLogger() {
    if (!window.AuditLogger || typeof window.AuditLogger.logActivity !== 'function') {
      return false;
    }

    const original = window.AuditLogger.logActivity.bind(window.AuditLogger);
    window.AuditLogger.logActivity = async function (user, action, details = {}) {
      try {
        const entry = {
          id: window.AuditLogger && window.AuditLogger.generateId ? window.AuditLogger.generateId() : Date.now().toString(36),
          user,
          action,
          timestamp: new Date().toISOString(),
          details,
          userAgent: navigator.userAgent,
          ip: 'local'
        };

        if (typeof apiPost === 'function' && CONFIG && CONFIG.API_BASE) {
          try {
            await apiPost('/logs', entry);
            safeLog('Audit log sent to server', entry.id);
            return;
          } catch (err) {
            safeLog('Audit log send failed, falling back to local', err.message);
          }
        }
      } catch (e) {
        safeLog('AuditLogger patch error:', e.message);
      }

      // fallback to original local behavior
      try {
        return original(user, action, details);
      } catch (err) {
        // If original fails, do minimal local save
        try {
          const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
          logs.push({
            id: Date.now().toString(36),
            user,
            action,
            timestamp: new Date().toISOString(),
            details,
            userAgent: navigator.userAgent,
            ip: 'local'
          });
          localStorage.setItem('audit_logs', JSON.stringify(logs));
        } catch (e) {/* ignore */}
      }
    };
    safeLog('AuditLogger patched');
    return true;
  }

  // Patch StealthDataManager: add pending queue + sync if class exists
  function patchStealthDataManager() {
    if (!window.StealthDataManager) return false;

    const proto = window.StealthDataManager.prototype;
    if (!proto) return false;

    const pendingKey = 'pending_stealth_locations';

    proto.queuePending = function (location) {
      try {
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        pending.push(location);
        localStorage.setItem(pendingKey, JSON.stringify(pending));
      } catch (err) {
        safeLog('queuePending error', err.message);
      }
    };

    proto.saveToServerWithRetry = async function (location) {
      if (typeof apiPost !== 'function' || !(CONFIG && CONFIG.API_BASE)) {
        this.queuePending(location);
        throw new Error('apiPost not available or API not configured');
      }
      try {
        await apiPost('/records', {
          action: 'stealthLocationUpdate',
          nrp: location.nrp,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        });
      } catch (err) {
        this.queuePending(location);
        throw err;
      }
    };

    proto.syncPendingLocations = async function () {
      if (typeof apiPost !== 'function' || !(CONFIG && CONFIG.API_BASE)) return;
      try {
        const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        if (!pending.length) return;
        for (const loc of pending.slice()) {
          try {
            await apiPost('/records', {
              action: 'stealthLocationUpdate',
              nrp: loc.nrp,
              lat: loc.lat,
              lng: loc.lng,
              accuracy: loc.accuracy,
              timestamp: loc.timestamp
            });
            // remove one
            const cur = JSON.parse(localStorage.getItem(pendingKey) || '[]');
            const idx = cur.findIndex(p => p.timestamp === loc.timestamp && p.nrp === loc.nrp);
            if (idx > -1) {
              cur.splice(idx, 1);
              localStorage.setItem(pendingKey, JSON.stringify(cur));
            }
          } catch (err) {
            safeLog('syncPendingLocations stop on error:', err.message);
            break;
          }
        }
      } catch (err) {
        safeLog('syncPendingLocations error', err.message);
      }
    };

    safeLog('StealthDataManager patched (queue & sync)');
    return true;
  }

  // Admin dashboard: try fetching /records and call renderRecordsTable if present
  async function adminRemoteLoad() {
    if (!document.body || !location.pathname || !location.href) return;
    const isAdminPage = location.pathname.includes('dashboard-admin');
    if (!isAdminPage) return;
    if (typeof apiGet !== 'function' || !(CONFIG && CONFIG.API_BASE)) {
      safeLog('Admin remote load skipped: apiGet not available or API not configured');
      return;
    }

    try {
      const data = await apiGet('/records');
      safeLog('Admin remote data loaded', Array.isArray(data) ? data.length : '?');
      if (typeof window.renderRecordsTable === 'function') {
        window.renderRecordsTable(data);
      } else {
        // Fallback: try to inject rows into a table with id 'trackingTable' or 'recordsTable'
        const container = document.querySelector('.table-container') || document.getElementById('recordsTable');
        if (container) {
          const html = data.map(d => `<div class="record-row"><strong>${d.nrp || ''}</strong> ${d.action || ''} ${d.created_at || ''}</div>`).join('');
          container.insertAdjacentHTML('afterbegin', `<div class="remote-data">${html}</div>`);
        }
      }
    } catch (err) {
      safeLog('Admin remote load failed:', err.message);
    }
  }

  // Anggota: attempt to intercept submitEditSimsaForm or add a safe wrapper
  function patchAnggotaSubmit() {
    if (typeof window.submitEditSimsaForm === 'function') {
      const orig = window.submitEditSimsaForm;
      window.submitEditSimsaForm = async function (nrp, index) {
        try {
          // call original first (local save)
          const maybePromise = orig(nrp, index);
          if (maybePromise && typeof maybePromise.then === 'function') {
            await maybePromise;
          }
        } catch (e) {
          safeLog('Original submitEditSimsaForm error:', e.message);
        }

        // Attempt to read the saved payload from localStorage or prepare a minimal payload
        try {
          // try to read a helper function saveRecordLocally if present to prepare payload
          let payload = null;
          if (typeof window.preparePayloadForServer === 'function') {
            payload = window.preparePayloadForServer(nrp, index);
          } else {
            // Best-effort: construct basic payload
            payload = { action: 'updateSenpiAnggota', nrp, index, timestamp: new Date().toISOString() };
          }

          if (typeof apiPost === 'function' && CONFIG && CONFIG.API_BASE) {
            await apiPost('/records', payload);
            safeLog('Submitted anggota payload to server', payload.nrp || payload.id || '?');
            if (window.showSuccess) window.showSuccess('Data berhasil dikirim ke server.');
          }
        } catch (err) {
          safeLog('Failed to submit anggota payload to server:', err.message);
          if (window.showWarning) window.showWarning('Tidak dapat mengirim ke server, data disimpan di perangkat.');
        }
      };
      safeLog('submitEditSimsaForm patched');
      return true;
    }
    return false;
  }

  // Try to patch when ready
  let attempts = 0;
  function tryPatch() {
    attempts++;
    const anyPatched = [];
    anyPatched.push(patchAuditLogger());
    anyPatched.push(patchStealthDataManager());
    anyPatched.push(patchAnggotaSubmit());
    adminRemoteLoad(); // fire once regardless

    // if none patched and attempts < limit, retry
    if ((anyPatched.some(Boolean) === false) && attempts < 30) {
      setTimeout(tryPatch, readyCheckInterval);
    } else {
      safeLog('client-sync initialization done (attempts=' + attempts + ')');
    }
  }

  // Start after small delay to allow original scripts to load
  setTimeout(tryPatch, 500);
})();