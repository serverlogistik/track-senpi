// js/firebase-sync-queue.js
// Lightweight offline queue: add tasks to queue (localStorage), attempt to flush to Firebase when online.
// Tasks are generic: { action: 'saveLocation'|'saveSession'|'setTempUsers', payload: {...} }

(function () {
  if (window._firebaseSyncQueueInitialized) return;
  window._firebaseSyncQueueInitialized = true;

  const KEY = 'track-senpi:sync-queue:v1';
  const POLL_INTERVAL_MS = 3000;

  function loadQueue() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed load sync queue', e);
      return [];
    }
  }

  function saveQueue(q) {
    try {
      localStorage.setItem(KEY, JSON.stringify(q));
    } catch (e) {
      console.warn('Failed save sync queue', e);
    }
  }

  function pushTask(task) {
    const q = loadQueue();
    q.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2,9), ...task });
    saveQueue(q);
  }

  async function processTask(task) {
    // Task handlers call firebase-storage.js functions
    try {
      if (task.action === 'saveLocation') {
        await window.firebaseSaveLastKnownLocation(task.payload);
      } else if (task.action === 'saveSession') {
        await window.firebaseSaveCurrentUser(task.payload);
      } else if (task.action === 'setTempUsers') {
        await window.firebaseSetTempUsersData(task.payload);
      } else if (task.action === 'adminLog') {
        await window.firebaseSaveAdminSession(task.payload);
      } else {
        console.warn('Unknown sync task', task);
      }
      return true;
    } catch (err) {
      console.warn('processTask error', err);
      return false;
    }
  }

  async function flushQueue() {
    if (!navigator.onLine) return;
    const q = loadQueue();
    if (!q || q.length === 0) return;
    // try flush sequentially
    let changed = false;
    for (let i = 0; i < q.length; i++) {
      const t = q[i];
      const ok = await processTask(t);
      if (ok) {
        q[i] = null; // mark removed
        changed = true;
      } else {
        // stop processing to avoid tight loop if persistent failure
        break;
      }
    }
    const remaining = q.filter(Boolean);
    if (changed) saveQueue(remaining);
  }

  // Public helpers to add to queue
  function queueSaveLocation(locationObj) {
    // try direct write first
    if (navigator.onLine && window.firebaseSaveLastKnownLocation) {
      window.firebaseSaveLastKnownLocation(locationObj).catch(() => {
        pushTask({ action: 'saveLocation', payload: locationObj });
      });
    } else {
      pushTask({ action: 'saveLocation', payload: locationObj });
    }
  }

  function queueSaveSession(sessionObj) {
    if (navigator.onLine && window.firebaseSaveCurrentUser) {
      window.firebaseSaveCurrentUser(sessionObj).catch(() => {
        pushTask({ action: 'saveSession', payload: sessionObj });
      });
    } else {
      pushTask({ action: 'saveSession', payload: sessionObj });
    }
  }

  function queueSetTempUsers(obj) {
    if (navigator.onLine && window.firebaseSetTempUsersData) {
      window.firebaseSetTempUsersData(obj).catch(() => {
        pushTask({ action: 'setTempUsers', payload: obj });
      });
    } else {
      pushTask({ action: 'setTempUsers', payload: obj });
    }
  }

  function queueAdminLog(obj) {
    if (navigator.onLine && window.firebaseSaveAdminSession) {
      window.firebaseSaveAdminSession(obj).catch(() => {
        pushTask({ action: 'adminLog', payload: obj });
      });
    } else {
      pushTask({ action: 'adminLog', payload: obj });
    }
  }

  // Periodic flush
  setInterval(flushQueue, POLL_INTERVAL_MS);
  window.addEventListener('online', flushQueue);

  // Expose
  window.syncQueue = {
    queueSaveLocation,
    queueSaveSession,
    queueSetTempUsers,
    queueAdminLog,
    inspectQueue: loadQueue,
    flushQueue
  };
})();