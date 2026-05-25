// =====================================================================
// TR-064 SOAP client for AVM FRITZ!Box devices
// - Uses HTTP Digest authentication (MD5 / MD5-sess)
// - SOAP envelope built by hand (only a handful of action types in use)
// - No external dependencies needed
// =====================================================================

import crypto from 'node:crypto';
import { URL } from 'node:url';

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

function buildEnvelope(serviceType, action, args = {}) {
  const argsXml = Object.entries(args)
    .map(([k, v]) => `<${k}>${escapeXml(String(v))}</${k}>`)
    .join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body><u:${action} xmlns:u="${serviceType}">${argsXml}</u:${action}></s:Body>
</s:Envelope>`;
}

function escapeXml(str) {
  return str.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  }[c]));
}

// Lightweight extractor for elements inside a SOAP response.
// Avoids pulling in an XML parser for the small set of fields we need.
function extractTags(xml) {
  const out = {};
  // Match <NewSomething>value</NewSomething> elements
  const re = /<(New[A-Za-z0-9_]+)[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

// Parse a WWW-Authenticate Digest challenge header into a map.
function parseDigestChallenge(header) {
  if (!header) return null;
  const idx = header.toLowerCase().indexOf('digest');
  if (idx < 0) return null;
  const params = header.slice(idx + 6).trim();
  const out = {};
  const re = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|([^,]+))/g;
  let m;
  while ((m = re.exec(params)) !== null) {
    out[m[1].toLowerCase()] = (m[2] !== undefined ? m[2] : m[3]).trim();
  }
  return out;
}

let nonceCounter = 0;
function nextNonceCount() {
  return (++nonceCounter).toString(16).padStart(8, '0');
}

function buildDigestAuthHeader(method, uri, username, password, challenge) {
  const realm  = challenge.realm || '';
  const nonce  = challenge.nonce || '';
  const qop    = (challenge.qop || '').split(',')[0].trim();
  const algo   = (challenge.algorithm || 'MD5').toUpperCase();
  const cnonce = crypto.randomBytes(8).toString('hex');
  const nc     = nextNonceCount();

  let ha1 = md5(`${username}:${realm}:${password}`);
  if (algo === 'MD5-SESS') {
    ha1 = md5(`${ha1}:${nonce}:${cnonce}`);
  }
  const ha2 = md5(`${method}:${uri}`);

  let response;
  if (qop === 'auth' || qop === 'auth-int') {
    response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  } else {
    response = md5(`${ha1}:${nonce}:${ha2}`);
  }

  const parts = [
    `username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `algorithm=${algo}`,
    `response="${response}"`,
  ];
  if (qop) {
    parts.push(`qop=${qop}`);
    parts.push(`nc=${nc}`);
    parts.push(`cnonce="${cnonce}"`);
  }
  if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`);
  return 'Digest ' + parts.join(', ');
}

/**
 * Perform a TR-064 SOAP call. Handles the two-step Digest auth handshake
 * (first request returns 401 with challenge, second request authenticates).
 *
 * @param {Object} opts
 *   - host:        FRITZ!Box IP / hostname
 *   - port:        49000 (insecure) or 49443 (TLS). Default 49000.
 *   - tls:         use HTTPS (default false → http on 49000)
 *   - username:    FRITZ!Box user
 *   - password:    FRITZ!Box password
 *   - controlUrl:  e.g. /upnp/control/wancommonifconfig1
 *   - serviceType: e.g. urn:dslforum-org:service:WANCommonInterfaceConfig:1
 *   - action:      e.g. GetTotalBytesReceived
 *   - args:        SOAP arguments (object)
 *   - timeoutMs:   request timeout
 */
export async function tr064Call(opts) {
  const tls = !!opts.tls;
  const port = opts.port || (tls ? 49443 : 49000);
  const url = `${tls ? 'https' : 'http'}://${opts.host}:${port}${opts.controlUrl}`;
  const body = buildEnvelope(opts.serviceType, opts.action, opts.args || {});
  const soapAction = `${opts.serviceType}#${opts.action}`;
  const timeoutMs  = opts.timeoutMs || 5000;

  const baseHeaders = {
    'Content-Type': 'text/xml; charset="utf-8"',
    'SOAPAction':   `"${soapAction}"`,
  };

  // First request — without auth header. We expect 401 + challenge.
  const ctrl1 = new AbortController();
  const t1 = setTimeout(() => ctrl1.abort(), timeoutMs);
  let firstRes;
  try {
    firstRes = await fetch(url, {
      method: 'POST',
      headers: baseHeaders,
      body,
      signal: ctrl1.signal,
    });
  } finally { clearTimeout(t1); }

  // Some calls don't require auth (e.g. via igdupnp on port 49000) and
  // succeed straight away.
  if (firstRes.status !== 401) {
    const text = await firstRes.text();
    if (!firstRes.ok) {
      throw new Error(`TR-064 ${firstRes.status}: ${shortErr(text)}`);
    }
    return extractTags(text);
  }

  if (!opts.username || !opts.password) {
    await firstRes.text(); // drain
    throw new Error('Authentifizierung erforderlich (Benutzer/Passwort fehlen)');
  }

  const challenge = parseDigestChallenge(firstRes.headers.get('www-authenticate'));
  await firstRes.text(); // drain
  if (!challenge) throw new Error('Kein Digest-Challenge vom Router erhalten');

  // Second request — with Authorization header.
  const authHeader = buildDigestAuthHeader('POST', opts.controlUrl, opts.username, opts.password, challenge);
  const ctrl2 = new AbortController();
  const t2 = setTimeout(() => ctrl2.abort(), timeoutMs);
  let secondRes;
  try {
    secondRes = await fetch(url, {
      method: 'POST',
      headers: { ...baseHeaders, 'Authorization': authHeader },
      body,
      signal: ctrl2.signal,
    });
  } finally { clearTimeout(t2); }

  const text = await secondRes.text();
  if (secondRes.status === 401) {
    throw new Error('Login fehlgeschlagen — Benutzer/Passwort prüfen');
  }
  if (!secondRes.ok) {
    throw new Error(`TR-064 ${secondRes.status}: ${shortErr(text)}`);
  }
  return extractTags(text);
}

function shortErr(text) {
  const m = text.match(/<errorCode>(\d+)<\/errorCode>[\s\S]*?<errorDescription>([^<]+)/);
  if (m) return `[${m[1]}] ${m[2]}`;
  return text.slice(0, 200).replace(/\s+/g, ' ');
}
