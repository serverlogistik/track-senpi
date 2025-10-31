// js/firebase-sync-queue.js
// Lightweight offline-first sync queue.
// Adds tasks to queue (stored in localStorage) and tries to flush them to Firebase when online.
// Supported actions:
//   - saveLocation    -> window.firebaseSaveLastKnownLocation(payload)
//   - saveSession     -> window.firebaseSaveCurrentUser(payload)
//   - setTempUsers    -> window.firebaseSetTempUsersData(payload)
//   - adminLog        -> window.firebaseSaveAdminSession(payload)
//
// Public API (attached to window.syncQueue):
//   - queueSaveLocation(locationObj)
//   - queueSaveSession(sessionObj)
//   - queueSetTempUsers(usersObj)
//   - queueAdminLog(adminLogObj)
//   - flushQueue()                // manual flush
//   - pushTask({action, payload}) // add raw task
//   - loadQueue()                 // returns current queue array
//
(function () {
  if (window._firebaseSyncQueueInitialized) return;
  window._firebaseSyncQueueInitialized = true;

  const KEY = 'track-senpi:sync-queue:v1';
  const POLL_INTERVAL_MS = 3000;
  let _flushTimer = null;
  let _isFlushing = false;

  function isOnline() {
    try { return navigator.onLine; } catch (e) { return true; }
  }

  function loadQueue() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('sync-queue: failed to load queue', e);
      return [];
    }
  }

  function saveQueue(q) {
    try {
      localStorage.setItem(KEY, JSON.stringify(q));
    } catch (e) {
      console.warn('sync-queue: failed to save queue', e);
    }
  }

  function pushTask(task) {
    const q = loadQueue();
    const item = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 10),
      enqueuedAt: new Date().toISOString(),
      ...task
    };
    q.push(item);
    saveQueue(q);
    return item.id;
  }

  async function processTask(task) {
    try {
      if (!task || !task.action) {
        console.warn('sync-queue: invalid task', task);
        return true; // drop invalid tasks
      }
      if (task.action === 'saveLocation') {
        if (!window.firebaseSaveLastKnownLocation) throw new Error('firebaseSaveLastKnownLocation not available');
        await window.firebaseSaveLastKnownLocation(task.payload);
      } else if (task.action === 'saveSession') {
        if (!window.firebaseSaveCurrentUser) throw new Error('firebaseSaveCurrentUser not available');
        await window.firebaseSaveCurrentUser(task.payload);
      } else if (task.action === 'setTempUsers') {
        if (!window.firebaseSetTempUsersData) throw new Error('firebaseSetTempUsersData not available');
        await window.firebaseSetTempUsersData(task.payload);
      } else if (task.action === 'adminLog') {
        if (!window.firebaseSaveAdminSession) throw new Error('firebaseSaveAdminSession not available');
        await window.firebaseSaveAdminSession(task.payload);
      } else {
        console.warn('sync-queue: unknown action', task.action);
        return true; // drop unknown tasks
      }
      return true;
    } catch (err) {
      console.warn('sync-queue: processTask error for action', task && task.action, err);
      return false;
    }
  }

  async function flushQueue() {
    if (_isFlushing) return;
    if (!isOnline()) return;

    const q = loadQueue();
    if (!q || q.length === 0) return;

    _isFlushing = true;
    try {
      let changed = false;
      for (let i = 0; i < q.length; i++) {
        const t = q[i];
        if (!t) continue;
        const ok = await processTask(t);
        if (ok) {
          q[i] = null; // mark for removal
          changed = true;
        } else {
          // stop early to avoid tight loop on persistent failure
          break;
        }
      }
      const remaining = q.filter(Boolean);
      if (changed) saveQueue(remaining);
    } finally {
      _isFlushing = false;
    }
  }

  function startScheduler() {
    if (_flushTimer) return;
    _flushTimer = setInterval(flushQueue, POLL_INTERVAL_MS);

    // Also try flush when network comes back or tab becomes visible
    window.addEventListener('online', () => setTimeout(flushQueue, 250));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(flushQueue, 250);
    });
  }

  // Public helpers: try direct write first; fallback to queue on failure/offline
  function queueSaveLocation(locationObj) {
    if (isOnline() && window.firebaseSaveLastKnownLocation) {
      window.firebaseSaveLastKnownLocation(locationObj).catch(() => {
        pushTask({ action: 'saveLocation', payload: locationObj });
      });
    } else {
      pushTask({ action: 'saveLocation', payload: locationObj });
    }
  }

  function queueSaveSession(sessionObj) {
    if (isOnline() && window.firebaseSaveCurrentUser) {
      window.firebaseSaveCurrentUser(sessionObj).catch(() => {
        pushTask({ action: 'saveSession', payload: sessionObj });
      });
    } else {
      pushTask({ action: 'saveSession', payload: sessionObj });
    }
  }

  function queueSetTempUsers(usersObj) {
    if (isOnline() && window.firebaseSetTempUsersData) {
      window.firebaseSetTempUsersData(usersObj).catch(() => {
        pushTask({ action: 'setTempUsers', payload: usersObj });
      });
    } else {
      pushTask({ action: 'setTempUsers', payload: usersObj });
    }
  }

  function queueAdminLog(adminLogObj) {
    if (isOnline() && window.firebaseSaveAdminSession) {
      window.firebaseSaveAdminSession(adminLogObj).catch(() => {
        pushTask({ action: 'adminLog', payload: adminLogObj });
      });
    } else {
      pushTask({ action: 'adminLog', payload: adminLogObj });
    }
  }

  // Expose API
  window.syncQueue = {
    queueSaveLocation,
    queueSaveSession,
    queueSetTempUsers,
    queueAdminLog,
    flushQueue,
    pushTask,
    loadQueue
  };

  // Kick off
  startScheduler();
  // Attempt an initial flush shortly after load
  setTimeout(flushQueue, 500);
})();
