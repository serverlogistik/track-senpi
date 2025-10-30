// Minimal firebase storage helpers - paste as js/firebase-storage.js
(function(){
  if (window._firebaseStorageInitialized) return;
  window._firebaseStorageInitialized = true;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase SDK not loaded - firebase-storage disabled');
    return;
  }

  const db = firebase.database();

  // Save last known location (push new history & update per‑NRP snapshot)
  async function firebaseSaveLastKnownLocation(loc) {
    const data = {
      nrp: loc.nrp || null,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      accuracy: Number(loc.accuracy || 0),
      timestamp: loc.timestamp || new Date().toISOString(),
      meta: loc.meta || null
    };
    const ref = db.ref('lastKnownLocations').push();
    await ref.set(data);
    if (data.nrp) {
      // convenience node for dashboard to read latest per user
      await db.ref(`lastKnownByNrp/${data.nrp}`).set({ key: ref.key, ...data });
    }
    return ref.key;
  }

  async function firebaseSaveCurrentUser(sessionObj) {
    const nrp = sessionObj.nrp;
    if (!nrp) throw new Error('session missing nrp');
    await db.ref(`sessions/${nrp}`).set(sessionObj);
    await db.ref(`sessions_history/${nrp}`).push(sessionObj);
    return true;
  }

  async function firebaseSaveAdminSession(obj) {
    await db.ref('admin_logs').push({ ...obj, ts: new Date().toISOString() });
    return true;
  }

  async function firebaseSetTempUsersData(obj) {
    await db.ref('temp_users_data').set(obj);
    return true;
  }

  window.firebaseSaveLastKnownLocation = firebaseSaveLastKnownLocation;
  window.firebaseSaveCurrentUser = firebaseSaveCurrentUser;
  window.firebaseSaveAdminSession = firebaseSaveAdminSession;
  window.firebaseSetTempUsersData = firebaseSetTempUsersData;
})();
