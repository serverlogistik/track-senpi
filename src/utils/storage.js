// Helper storage with fallback and compression to handle QuotaExceededError on localStorage.
// - Try localStorage first.
// - If it fails, try compressing (LZString) then localStorage.
// - If still fails, fallback to IndexedDB via localForage.
// - Expose async save/read/remove for generic keys.

import localforage from 'localforage';
import LZString from 'lz-string';

const COMPRESSED_MARKER_SUFFIX = '__compressed';
const CHUNK_COUNT_SUFFIX = '__chunks';
const CHUNK_PREFIX = '__chunk_';
const CHUNK_SIZE = 8000; // character size per chunk (tweak if needed)

function sizeOfString(str) {
  return new Blob([str]).size;
}

function chunkString(str, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

async function tryLocalStorageSet(key, valueStr) {
  try {
    localStorage.setItem(key, valueStr);
    return true;
  } catch (err) {
    // QuotaExceededError or browser that disallows storage
    return false;
  }
}

async function tryLocalStorageSetChunks(baseKey, valueStr) {
  try {
    const chunks = chunkString(valueStr);
    localStorage.setItem(`${baseKey}${CHUNK_COUNT_SUFFIX}`, String(chunks.length));
    chunks.forEach((c, i) => {
      localStorage.setItem(`${baseKey}${CHUNK_PREFIX}${i}`, c);
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function saveTempUsersData(key, obj) {
  const json = JSON.stringify(obj);
  // 1) Try normal save
  if (await tryLocalStorageSet(key, json)) {
    // cleanup old markers
    localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
    localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
    return { ok: true, method: 'localStorage' };
  }

  // 2) Try compress (UTF16 safe)
  try {
    const compressed = LZString.compressToUTF16(json);
    if (await tryLocalStorageSet(key, compressed)) {
      localStorage.setItem(`${key}${COMPRESSED_MARKER_SUFFIX}`, 'lzutf16');
      localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
      return { ok: true, method: 'localStorage+compressed' };
    }
  } catch (err) {
    // compression may fail; continue to next fallback
  }

  // 3) Try chunking (if compression fails or still too large)
  try {
    const compressed = LZString.compressToUTF16(json);
    if (await tryLocalStorageSetChunks(key, compressed)) {
      localStorage.setItem(`${key}${COMPRESSED_MARKER_SUFFIX}`, 'lzutf16');
      return { ok: true, method: 'localStorage+chunks+compressed' };
    }
    // or try chunk without compress
    if (await tryLocalStorageSetChunks(key, json)) {
      localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
      return { ok: true, method: 'localStorage+chunks' };
    }
  } catch (err) {
    // ignore, continue to indexeddb
  }

  // 4) Fallback to IndexedDB via localForage
  try {
    await localforage.setItem(key, obj);
    return { ok: true, method: 'indexeddb' };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function readTempUsersData(key) {
  try {
    // try reading localStorage
    const raw = localStorage.getItem(key);
    if (raw != null) {
      const compressedMarker = localStorage.getItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
      const chunkCount = parseInt(localStorage.getItem(`${key}${CHUNK_COUNT_SUFFIX}`), 10);
      if (Number.isFinite(chunkCount) && chunkCount > 0) {
        // read chunks
        let combined = '';
        for (let i = 0; i < chunkCount; i++) {
          combined += localStorage.getItem(`${key}${CHUNK_PREFIX}${i}`) || '';
        }
        if (compressedMarker === 'lzutf16') {
          const decompressed = LZString.decompressFromUTF16(combined);
          return JSON.parse(decompressed);
        }
        return JSON.parse(combined);
      } else {
        if (compressedMarker === 'lzutf16') {
          const decompressed = LZString.decompressFromUTF16(raw);
          return JSON.parse(decompressed);
        }
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // fallback to IndexedDB
  try {
    const v = await localforage.getItem(key);
    return v;
  } catch (err) {
    return null;
  }
}

export async function removeTempUsersData(key) {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}${COMPRESSED_MARKER_SUFFIX}`);
    const chunkCount = parseInt(localStorage.getItem(`${key}${CHUNK_COUNT_SUFFIX}`), 10);
    if (Number.isFinite(chunkCount)) {
      for (let i = 0; i < chunkCount; i++) {
        localStorage.removeItem(`${key}${CHUNK_PREFIX}${i}`);
      }
      localStorage.removeItem(`${key}${CHUNK_COUNT_SUFFIX}`);
    }
  } catch (err) {
    // ignore
  }
  try {
    await localforage.removeItem(key);
  } catch (err) {
    // ignore
  }
}