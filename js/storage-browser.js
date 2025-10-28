// js/storage-browser.js
// Browser-friendly storage helper that uses localStorage when possible,
// compresses with LZString, and falls back to IndexedDB via localforage.
// Exposes async functions on window: saveTempUsersData(key, obj), readTempUsersData(key), removeTempUsersData(key)

(function () {
  if (window._storageBrowserInitialized) return;
  window._storageBrowserInitialized = true;

  const COMPRESSED_MARKER_SUFFIX = '__compressed';
  const CHUNK_COUNT_SUFFIX = '__chunks';
  const CHUNK_PREFIX = '__chunk_';
  const CHUNK_SIZE = 8000;

  function chunkString(str, size = CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) chunks.push(str.slice(i, i + size));
    return chunks;
  }

  async function tryLocalStorageSet(key, valueStr) {
    try {
      localStorage.setItem(key, valueStr);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function tryLocalStorageSetChunks(baseKey, valueStr) {
    try {
      const chunks = chunkString(valueStr);
      localStorage.setItem(`${baseKey}${CHUNK_COUNT_SUFFIX}`, String(chunks.length));
      chunks.forEach((c, i) => localStorage.setItem(`${baseKey}${CHUNK_PREFIX}${i}`, c));
      return true;
    } catch (err) {
      return false;
    }
  }

  async function saveTempUsersData(key, obj) {
    const json = JSON.stringify(obj);
    // 1) try plain localStorage
    if (await tryLocalStorageSet(key, json)) {
      localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
      localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
      return { ok: true, method: 'localStorage' };
    }

    // 2) try compress
    try {
      const compressed = window.LZString && LZString.compressToUTF16(json);
      if (compressed && await tryLocalStorageSet(key, compressed)) {
        localStorage.setItem(`${key}${COMPRESSED_MARKER_SUFFIX}`, 'lzutf16');
        localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
        return { ok: true, method: 'localStorage+compressed' };
      }
    } catch (err) {
      // continue
    }

    // 3) try chunking (compressed then plain)
    try {
      const compressed = window.LZString && LZString.compressToUTF16(json);
      if (compressed && await tryLocalStorageSetChunks(key, compressed)) {
        localStorage.setItem(`${key}${COMPRESSED_MARKER_SUFFIX}`, 'lzutf16');
        return { ok: true, method: 'localStorage+chunks+compressed' };
      }
      if (await tryLocalStorageSetChunks(key, json)) {
        localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
        return { ok: true, method: 'localStorage+chunks' };
      }
    } catch (err) {
      // continue
    }

    // 4) fallback to indexeddb via localforage
    try {
      if (window.localforage) {
        await localforage.setItem(key, obj);
        return { ok: true, method: 'indexeddb' };
      } else {
        return { ok: false, error: 'localforage-not-available' };
      }
    } catch (err) {
      return { ok: false, error: err };
    }
  }

  async function readTempUsersData(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const compressedMarker = localStorage.getItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
        const chunkCount = parseInt(localStorage.getItem(`${key}${CHUNK_COUNT_SUFFIX}`), 10);
        if (Number.isFinite(chunkCount) && chunkCount > 0) {
          let combined = '';
          for (let i = 0; i < chunkCount; i++) combined += localStorage.getItem(`${key}${CHUNK_PREFIX}${i}`) || '';
          if (compressedMarker === 'lzutf16' && window.LZString) {
            const dec = LZString.decompressFromUTF16(combined);
            return JSON.parse(dec);
          }
          return JSON.parse(combined);
        } else {
          if (compressedMarker === 'lzutf16' && window.LZString) {
            const dec = LZString.decompressFromUTF16(raw);
            return JSON.parse(dec);
          }
          return JSON.parse(raw);
        }
      }
    } catch (err) {
      // continue to fallback
    }

    try {
      if (window.localforage) {
        const v = await localforage.getItem(key);
        return v;
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  async function removeTempUsersData(key) {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
      const chunkCount = parseInt(localStorage.getItem(`${key}${CHUNK_COUNT_SUFFIX}`), 10);
      if (Number.isFinite(chunkCount)) {
        for (let i = 0; i < chunkCount; i++) localStorage.removeItem(`${key}${CHUNK_PREFIX}${i}`);
        localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
      }
    } catch (err) {
      // ignore
    }
    try {
      if (window.localforage) await localforage.removeItem(key);
    } catch (err) {
      // ignore
    }
  }

  window.saveTempUsersData = saveTempUsersData;
  window.readTempUsersData = readTempUsersData;
  window.removeTempUsersData = removeTempUsersData;

})();