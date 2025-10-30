// js/firebase-storage.js
// Simple abstraction for Firebase Realtime Database reads/writes.
// Depends on firebase SDK and firebase-init.js already loaded.

(function () {
  if (window._firebaseStorageInitialized) return;
  window._firebaseStorageInitialized = true;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('firebase.database() not available. Ensure firebase SDK + firebase-init are loaded.');
    return;
  }

  const db = firebase.database();

  // Paths used by app
  const PATH_TEMP_USERS = 'temp_users_data';    // object: { nrp: {...} }
  const PATH_LAST_LOCATIONS = 'lastKnownLocations'; // list (push)
  const PATH_SESSIONS = 'sessions';             // sessions/{nrp}
  const PATH_ADMIN_LOGS = 'adminLogins';        // list (push)

  // Get temp_users_data snapshot once (returns object or null)
  async function firebaseGetTempUsersData() {
    const snap = await db.ref(PATH_TEMP_USERS).once('value');
    return snap.val() || null;
  }

  // Save/overwrite temp_users_data (dangerous - use with care)
  async function firebaseSetTempUsersData(obj) {
    await db.ref(PATH_TEMP_USERS).set(obj);
    return true;
  }

  // Push last known location and return push key
  async function firebaseSaveLastKnownLocation(locationObj) {
    const ref = db.ref(PATH_LAST_LOCATIONS).push();
    await ref.set({
      ...locationObj,
      created_at: new Date().toISOString()
    });
    return ref.key;
  }

  // Set current session for a user (by nrp)
  async function firebaseSaveCurrentUser(userObj) {
    if (!userObj || !userObj.nrp) throw new Error('userObj.nrp required');
    const ref = db.ref(`${PATH_SESSIONS}/${userObj.nrp}`);
    await ref.set({
      ...userObj,
      last_updated: new Date().toISOString()
    });
    return true;
  }

  // Remove session (logout)
  async function firebaseRemoveSession(nrp) {
    await db.ref(`${PATH_SESSIONS}/${nrp}`).remove();
    return true;
  }

  // Log admin login
  async function firebaseSaveAdminSession(adminObj) {
    const ref = db.ref(PATH_ADMIN_LOGS).push();
    await ref.set({
      ...(adminObj || {}),
      created_at: new Date().toISOString()
    });
    return ref.key;
  }

  // Expose functions
  window.firebaseGetTempUsersData = firebaseGetTempUsersData;
  window.firebaseSetTempUsersData = firebaseSetTempUsersData;
  window.firebaseSaveLastKnownLocation = firebaseSaveLastKnownLocation;
  window.firebaseSaveCurrentUser = firebaseSaveCurrentUser;
  window.firebaseRemoveSession = firebaseRemoveSession;
  window.firebaseSaveAdminSession = firebaseSaveAdminSession;
})();