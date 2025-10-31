// js/firebase-storage.js
// Minimal Firebase Realtime Database helpers for Track Senpi.
// This file exposes small, focused async functions on window.*
// so other scripts (login, dashboards, sync-queue) can read/write easily.
//
// Exposed API:
// - firebaseSaveLastKnownLocation(loc)
// - firebaseSaveCurrentUser(sessionObj)
// - firebaseSaveAdminSession(obj)
// - firebaseSetTempUsersData(usersObj)
// - firebaseGetTempUsersData()
// - firebaseGetAdminByNrp(nrp)
// - firebaseGetAdminConfig()
//
// Notes:
// - Requires Firebase SDK compat builds (firebase-app-compat.js, firebase-database-compat.js)
//   and js/firebase-init.js loaded BEFORE this file.

(function(){
  if (window._firebaseStorageInitialized) return;
  window._firebaseStorageInitialized = true;

  // Guard: ensure Firebase RTDB is available
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase SDK not loaded - firebase-storage disabled');
    return;
  }

  const db = firebase.database();

  // Save last known location (append to history + update per‑NRP snapshot)
  async function firebaseSaveLastKnownLocation(loc) {
    const data = {
      nrp: loc && loc.nrp ? String(loc.nrp) : null,
      lat: Number(loc && loc.lat),
      lng: Number(loc && loc.lng),
      accuracy: Number((loc && loc.accuracy) || 0),
      timestamp: (loc && loc.timestamp) || new Date().toISOString(),
      meta: loc && loc.meta ? loc.meta : null
    };

    // Basic validation
    if (Number.isNaN(data.lat) || Number.isNaN(data.lng)) {
      throw new Error('invalid lat/lng for firebaseSaveLastKnownLocation');
    }

    // Push to history
    const ref = db.ref('lastKnownLocations').push();
    await ref.set(data);

    // Convenience: store latest per NRP for realtime dashboard
    if (data.nrp) {
      await db.ref(`lastKnownByNrp/${data.nrp}`).set({ key: ref.key, ...data });
    }

    return ref.key;
  }

  // Save current user session (per NRP node + append to history)
  async function firebaseSaveCurrentUser(sessionObj) {
    const nrp = sessionObj && sessionObj.nrp ? String(sessionObj.nrp) : null;
    if (!nrp) throw new Error('firebaseSaveCurrentUser: session missing nrp');

    const withTs = { ...sessionObj, last_updated: new Date().toISOString() };
    await db.ref(`sessions/${nrp}`).set(withTs);
    await db.ref(`sessions_history/${nrp}`).push(withTs);
    return true;
  }

  // Save an admin activity (login, actions, etc.)
  async function firebaseSaveAdminSession(obj) {
    const payload = { ...(obj || {}), ts: new Date().toISOString() };
    await db.ref('admin_logs').push(payload);
    return true;
  }

  // Replace entire USERS_DATA in cloud (use carefully).
  // For production, consider write-scoping or diff/patch instead of full replace.
  async function firebaseSetTempUsersData(usersObj) {
    if (!usersObj || typeof usersObj !== 'object') {
      throw new Error('firebaseSetTempUsersData: usersObj must be an object');
    }
    await db.ref('temp_users_data').set(usersObj);
    // maintain a meta timestamp separately to avoid breaking readers
    await db.ref('temp_users_meta/updated_at').set(new Date().toISOString());
    return true;
  }

  // Read entire USERS_DATA once (returns object or null)
  async function firebaseGetTempUsersData() {
    const snap = await db.ref('temp_users_data').once('value');
    return snap.exists() ? (snap.val() || {}) : null;
  }

  // Admin helpers (optional): read admin profile by NRP
  async function firebaseGetAdminByNrp(nrp) {
    const key = String(nrp);
    const snap = await db.ref(`admins/${key}`).once('value');
    return snap.exists() ? snap.val() : null;
  }

  // Admin helpers (optional): read single admin_config (fallback)
  async function firebaseGetAdminConfig() {
    const snap = await db.ref('admin_config').once('value');
    return snap.exists() ? snap.val() : null;
  }

  // Expose to window
  window.firebaseSaveLastKnownLocation = firebaseSaveLastKnownLocation;
  window.firebaseSaveCurrentUser = firebaseSaveCurrentUser;
  window.firebaseSaveAdminSession = firebaseSaveAdminSession;
  window.firebaseSetTempUsersData = firebaseSetTempUsersData;
  window.firebaseGetTempUsersData = firebaseGetTempUsersData;
  window.firebaseGetAdminByNrp = firebaseGetAdminByNrp;
  window.firebaseGetAdminConfig = firebaseGetAdminConfig;
})();
