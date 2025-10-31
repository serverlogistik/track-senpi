// api-client.js - helper sederhana untuk request ke API pusat
// Pastikan config.js dimuat sebelum file ini di HTML.
(function(global) {
  async function apiFetch(path, options = {}) {
    const base = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE) ? CONFIG.API_BASE : '';
    if (!base) throw new Error('API base belum dikonfigurasi (config.js)');
    const url = base.replace(/\/$/, '') + path;

    const headers = Object.assign({
      'Content-Type': 'application/json',
      ...(CONFIG && CONFIG.API_TOKEN ? { 'Authorization': 'Bearer ' + CONFIG.API_TOKEN } : {})
    }, options.headers || {});

    const init = Object.assign({ headers, credentials: 'omit' }, options);

    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status}: ${text}`);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? await res.json() : await res.text();
  }

  async function apiPost(path, body) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async function apiGet(path) {
    return apiFetch(path, { method: 'GET' });
  }

  // expose
  global.apiFetch = apiFetch;
  global.apiPost = apiPost;
  global.apiGet = apiGet;
})(window);