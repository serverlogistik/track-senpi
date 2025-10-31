// js/firebase-listener.js
// Simple listeners for Firebase Realtime Database to keep the app UI in sync in real time.
// Provides subscriptions for:
// - sessions (snapshot of all active sessions)
// - lastKnownLocations (stream child_added for recent location points)
// - lastKnownByNrp (latest location per NRP as a single snapshot node)
// - temp_users_data (entire USERS_DATA as a single snapshot node)
//
// Usage example:
//   const unsubscribe = firebaseListeners.subscribeTempUsers(users => { ...update UI... });
//   firebaseListeners.unsubscribeAll(); // turn off everything when leaving page
//
(function () {
  if (window._firebaseListenerInitialized) return;
  window._firebaseListenerInitialized = true;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('firebase.database() not available. Ensure Firebase SDK + firebase-init are loaded before firebase-listener.js');
    return;
  }

  const db = firebase.database();
  const refs = {};

  // Subscribe to all sessions (value)
  function subscribeSessions(onChange) {
    try {
      const ref = db.ref('sessions');
      refs.sessions = ref;
      ref.on('value', snapshot => {
        const val = snapshot.val() || {};
        try { onChange && onChange(val); } catch (e) { console.warn('subscribeSessions onChange error', e); }
      });
      return () => { try { refs.sessions && refs.sessions.off(); } catch (e) {} };
    } catch (e) {
      console.warn('subscribeSessions error', e);
      return () => {};
    }
  }

  // Subscribe to recent lastKnownLocations (child_added stream)
  // onAdd(key, value)
  function subscribeLastLocations(limit = 100, onAdd) {
    try {
      const ref = db.ref('lastKnownLocations').limitToLast(limit);
      refs.lastKnownLocations = ref;
      ref.on('child_added', snap => {
        try { onAdd && onAdd(snap.key, snap.val()); } catch (e) { console.warn('subscribeLastLocations onAdd error', e); }
      });
      return () => { try { refs.lastKnownLocations && refs.lastKnownLocations.off(); } catch (e) {} };
    } catch (e) {
      console.warn('subscribeLastLocations error', e);
      return () => {};
    }
  }

  // Subscribe to latest location per NRP (single snapshot node)
  // onValue(objByNrp)
  function subscribeLastByNrp(onValue) {
    try {
      const ref = db.ref('lastKnownByNrp');
      refs.lastKnownByNrp = ref;
      ref.on('value', snap => {
        const val = snap.val() || {};
        try { onValue && onValue(val); } catch (e) { console.warn('subscribeLastByNrp onValue error', e); }
      });
      return () => { try { refs.lastKnownByNrp && refs.lastKnownByNrp.off(); } catch (e) {} };
    } catch (e) {
      console.warn('subscribeLastByNrp error', e);
      return () => {};
    }
  }

  // Subscribe to entire USERS_DATA object (single snapshot node)
  // onValue(usersObj)
  function subscribeTempUsers(onValue) {
    try {
      const ref = db.ref('temp_users_data');
      refs.temp_users_data = ref;
      ref.on('value', snap => {
        const val = snap.val() || {};
        try { onValue && onValue(val); } catch (e) { console.warn('subscribeTempUsers onValue error', e); }
      });
      return () => { try { refs.temp_users_data && refs.temp_users_data.off(); } catch (e) {} };
    } catch (e) {
      console.warn('subscribeTempUsers error', e);
      return () => {};
    }
  }

  // Unsubscribe all active listeners
  function unsubscribeAll() {
    Object.keys(refs).forEach(k => {
      try { refs[k] && refs[k].off(); } catch (e) {}
    });
  }

  window.firebaseListeners = {
    subscribeSessions,
    subscribeLastLocations,
    subscribeLastByNrp,
    subscribeTempUsers,
    unsubscribeAll
  };
})();
