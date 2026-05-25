// =====================================================================
// HTTP/HTTPS request helper that tolerates self-signed certificates
// (Hue Bridge Gen 2, Salt Fiber Box, ...). Used by check modules that
// need to bypass node:fetch's strict cert validation.
// =====================================================================

import https from 'node:https';
import http  from 'node:http';

/**
 * Make a raw HTTP/HTTPS request.
 *
 * @param {string}  urlStr - full URL
 * @param {Object}  opts
 *   - signal:     AbortSignal
 *   - tls:        whether to use HTTPS
 *   - method:     'GET' | 'POST' | ...
 *   - headers:    request headers (object)
 *   - body:       request body (string)
 * @returns {Promise<{status:number, body:string, headers:Object}>}
 */
export function rawRequest(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const isTls = opts.tls ?? (u.protocol === 'https:');
    const reqOpts = {
      method:   opts.method || 'GET',
      hostname: u.hostname,
      port:     u.port || (isTls ? 443 : 80),
      path:     u.pathname + u.search,
      headers:  { 'Accept': 'application/json', ...(opts.headers || {}) },
      // Self-signed cert (Hue, Salt, ...): skip validation. Safe in LAN scope.
      ...(isTls ? { rejectUnauthorized: false } : {}),
    };
    const lib = isTls ? https : http;
    const req = lib.request(reqOpts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({
        status: res.statusCode,
        body,
        headers: res.headers,
      }));
    });
    req.on('error', reject);
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => {
        req.destroy(new Error('aborted'));
      });
    }
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/**
 * Convenience wrapper around rawRequest with timeout + JSON parsing.
 */
export async function fetchJson(url, { timeoutMs = 5000, tls, headers } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const { status, body } = await rawRequest(url, { signal: ctrl.signal, tls, headers });
    if (status !== 200) throw new Error(`HTTP ${status}`);
    try { return JSON.parse(body); }
    catch { throw new Error('Antwort ist kein gültiges JSON'); }
  } finally {
    clearTimeout(timer);
  }
}
