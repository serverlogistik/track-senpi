// js/firebase-init.js
// Initialize Firebase app using project config. This file expects Firebase SDK scripts to be loaded first (firebase-app-compat, firebase-database-compat).

(function(){
  if (window._firebaseInitDone) return;
  window._firebaseInitDone = true;

  // Firebase config - provided by repository owner
  const firebaseConfig = {
    apiKey: "AIzaSyDsET7HdJZ3oJdZ4pZwFNR__je66YSwQ_E",
    authDomain: "track-senpi.firebaseapp.com",
    databaseURL: "https://track-senpi-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "track-senpi",
    storageBucket: "track-senpi.firebasestorage.app",
    messagingSenderId: "585498224229",
    appId: "1:585498224229:web:aaa6d0b1029a7ddc66888c",
    measurementId: "G-MD2TCD2R7Z"
  };

  if (typeof firebase === 'undefined' || !firebase.initializeApp) {
    console.warn('Firebase SDK not detected. Make sure you include firebase-app-compat.js and firebase-database-compat.js before firebase-init.js');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
  } catch (err) {
    console.warn('Firebase initializeApp error (may already be initialized):', err);
  }
})();