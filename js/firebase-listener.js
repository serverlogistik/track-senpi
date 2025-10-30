// js/firebase-listener.js
// Simple listeners for sessions and lastKnownLocations. Provide callbacks to update UI.

(function () {
  if (window._firebaseListenerInitialized) return;
  window._firebaseListenerInitialized = true;

  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('firebase.database() not available. Ensure firebase SDK + firebase-init are loaded.');
    return;
  }

  const db = firebase.database();
  const refs = {};

  function subscribeSessions(onChange) {
    const ref = db.ref('sessions');
    refs.sessions = ref;
    ref.on('value', snapshot => {
      const val = snapshot.val() || {};
      onChange(val);
    });
    return () => { if (refs.sessions) refs.sessions.off(); };
  }

  function subscribeLastLocations(limit = 100, onAdd) {
    // listen child_added for near real-time incoming points
    const ref = db.ref('lastKnownLocations').limitToLast(limit);
    refs.locations = ref;
    ref.on('child_added', snap => {
      onAdd(snap.key, snap.val());
    });
    return () => { if (refs.locations) refs.locations.off(); };
  }

  function unsubscribeAll() {
    Object.keys(refs).forEach(k => {
      try { refs[k].off(); } catch (e) {}
    });
  }

  window.firebaseListeners = {
    subscribeSessions,
    subscribeLastLocations,
    unsubscribeAll
  };
})();
