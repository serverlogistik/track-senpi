// js/api-client.js
// REST API Client untuk Track Senpi - Railway Backend
// Menggantikan semua fungsi Firebase dengan REST API calls

(function() {
  if (window._apiClientInitialized) return;
  window._apiClientInitialized = true;

  // Configuration - ganti dengan URL Railway kamu setelah deploy
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://your-railway-app.up.railway.app/api'; // GANTI INI setelah deploy!

  let authToken = localStorage.getItem('auth_token') || null;
  let wsConnection = null;

  // Helper function untuk HTTP requests
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', endpoint, error);
      throw error;
    }
  }

  // ===== AUTHENTICATION API =====
  
  async function login(nrp, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nrp, password })
    });

    if (data.token) {
      authToken = data.token;
      localStorage.setItem('auth_token', data.token);
    }

    return data;
  }

  async function logout(nrp) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ nrp })
      });
    } finally {
      authToken = null;
      localStorage.removeItem('auth_token');
    }
  }

  async function verifyToken(token) {
    return await apiRequest('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // ===== USERS API =====

  async function getAllUsers() {
    return await apiRequest('/users');
  }

  async function getUser(nrp) {
    return await apiRequest(`/users/${nrp}`);
  }

  async function createUser(userData) {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async function updateUser(nrp, userData) {
    return await apiRequest(`/users/${nrp}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async function deleteUser(nrp) {
    return await apiRequest(`/users/${nrp}`, {
      method: 'DELETE'
    });
  }

  // Bulk update - untuk compatibility dengan Firebase migration
  async function bulkUpdateUsers(usersData) {
    return await apiRequest('/users/bulk-update', {
      method: 'POST',
      body: JSON.stringify(usersData)
    });
  }

  // ===== SENPI API =====

  async function getAllSenpi() {
    return await apiRequest('/senpi');
  }

  async function getSenpiByNrp(nrp) {
    return await apiRequest(`/senpi/user/${nrp}`);
  }

  async function createSenpi(senpiData) {
    return await apiRequest('/senpi', {
      method: 'POST',
      body: JSON.stringify(senpiData)
    });
  }

  async function updateSenpi(nomorSeri, senpiData) {
    return await apiRequest(`/senpi/${encodeURIComponent(nomorSeri)}`, {
      method: 'PUT',
      body: JSON.stringify(senpiData)
    });
  }

  async function assignSenpi(nomorSeri, newNrp) {
    return await apiRequest(`/senpi/${encodeURIComponent(nomorSeri)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ new_nrp: newNrp })
    });
  }

  async function deleteSenpi(nomorSeri) {
    return await apiRequest(`/senpi/${encodeURIComponent(nomorSeri)}`, {
      method: 'DELETE'
    });
  }

  // ===== LOCATION API =====

  async function saveLocation(locationData) {
    return await apiRequest('/location', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  }

  async function getLatestLocations() {
    return await apiRequest('/location/latest');
  }

  async function getLocationHistory(nrp, limit = 100) {
    return await apiRequest(`/location/history/${nrp}?limit=${limit}`);
  }

  async function getRecentLocations(limit = 500) {
    return await apiRequest(`/location/recent?limit=${limit}`);
  }

  // ===== UPLOAD API =====

  async function uploadFile(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata.nrp) formData.append('nrp', metadata.nrp);
    if (metadata.type) formData.append('type', metadata.type);

    const url = `${API_BASE_URL}/upload/single`;
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    return await response.json();
  }

  async function uploadMultipleFiles(files, metadata = {}) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const url = `${API_BASE_URL}/upload/multiple`;
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    return await response.json();
  }

  // ===== WEBSOCKET REAL-TIME CONNECTION =====

  function connectWebSocket(onMessage) {
    const wsUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
    
    try {
      wsConnection = new WebSocket(wsUrl);

      wsConnection.onopen = () => {
        console.log('🔌 WebSocket connected');
      };

      wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (onMessage) connectWebSocket(onMessage);
        }, 5000);
      };

      return wsConnection;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return null;
    }
  }

  function disconnectWebSocket() {
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
  }

  // ===== COMPATIBILITY LAYER - Firebase function replacements =====

  // Untuk kompatibilitas dengan kode lama yang pakai Firebase
  window.firebaseSaveLastKnownLocation = saveLocation;
  window.firebaseSaveCurrentUser = async (sessionData) => {
    // Session tracking via location API with meta
    return await saveLocation({
      nrp: sessionData.nrp,
      latitude: sessionData.latitude || 0,
      longitude: sessionData.longitude || 0,
      accuracy: 0,
      meta: sessionData
    });
  };
  window.firebaseSetTempUsersData = bulkUpdateUsers;
  window.firebaseGetTempUsersData = getAllUsers;

  // Sync queue compatibility (now direct API calls, no queue needed)
  window.syncQueue = {
    queueSaveLocation: saveLocation,
    queueSaveSession: async (session) => {
      return await saveLocation({
        nrp: session.nrp,
        latitude: 0,
        longitude: 0,
        meta: session
      });
    },
    queueSetTempUsers: bulkUpdateUsers,
    flushQueue: async () => ({ success: true }), // No-op, API calls are direct
    loadQueue: () => []
  };

  // Listener compatibility
  window.firebaseListeners = {
    subscribeTempUsers: (callback) => {
      // Poll every 10 seconds for updates
      const interval = setInterval(async () => {
        try {
          const users = await getAllUsers();
          callback(users);
        } catch (error) {
          console.error('Poll users error:', error);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    },
    subscribeLastByNrp: (callback) => {
      // Use WebSocket for real-time updates
      connectWebSocket((data) => {
        if (data.type === 'location_update') {
          // Fetch latest locations
          getLatestLocations().then(callback).catch(console.error);
        }
      });
      
      // Initial fetch
      getLatestLocations().then(callback).catch(console.error);
      
      return () => disconnectWebSocket();
    },
    subscribeLastLocations: (limit, callback) => {
      connectWebSocket((data) => {
        if (data.type === 'location_update') {
          callback(data.data.nrp, data.data);
        }
      });
      
      return () => disconnectWebSocket();
    },
    unsubscribeAll: disconnectWebSocket
  };

  // Export API client
  window.apiClient = {
    // Config
    setApiUrl: (url) => { API_BASE_URL = url; },
    getApiUrl: () => API_BASE_URL,
    
    // Auth
    login,
    logout,
    verifyToken,
    
    // Users
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    
    // Senpi
    getAllSenpi,
    getSenpiByNrp,
    createSenpi,
    updateSenpi,
    assignSenpi,
    deleteSenpi,
    
    // Location
    saveLocation,
    getLatestLocations,
    getLocationHistory,
    getRecentLocations,
    
    // Upload
    uploadFile,
    uploadMultipleFiles,
    
    // WebSocket
    connectWebSocket,
    disconnectWebSocket,
    
    // Utils
    isAuthenticated: () => !!authToken,
    getToken: () => authToken,
    setToken: (token) => {
      authToken = token;
      localStorage.setItem('auth_token', token);
    }
  };

  console.log('✅ API Client initialized');
  console.log('🔗 API URL:', API_BASE_URL);

})();
