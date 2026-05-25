import { createRequire } from 'node:module';
import { log, debugLogger } from './logger.js';
const require = createRequire(import.meta.url);
// Populated by index.js after import — avoids circular deps
let _onAuthSuccess   = null;
let _onCookieRefresh = null;
export function setEchoAuthSuccessHook(fn)   { _onAuthSuccess   = fn; }
export function setEchoCookieRefreshHook(fn) { _onCookieRefresh = fn; }
const AlexaRemote = require('alexa-remote2');

const REGIONS = {
  'de':     { alexaHost: 'alexa.amazon.de',     amazonPage: 'amazon.de',     lang: 'de_DE' },
  'com':    { alexaHost: 'alexa.amazon.com',    amazonPage: 'amazon.com',    lang: 'en_US' },
  'co.uk':  { alexaHost: 'alexa.amazon.co.uk',  amazonPage: 'amazon.co.uk',  lang: 'en_GB' },
  'fr':     { alexaHost: 'alexa.amazon.fr',     amazonPage: 'amazon.fr',     lang: 'fr_FR' },
  'it':     { alexaHost: 'alexa.amazon.it',     amazonPage: 'amazon.it',     lang: 'it_IT' },
  'es':     { alexaHost: 'alexa.amazon.es',     amazonPage: 'amazon.es',     lang: 'es_ES' },
  'ca':     { alexaHost: 'alexa.amazon.ca',     amazonPage: 'amazon.ca',     lang: 'en_CA' },
  'com.au': { alexaHost: 'alexa.amazon.com.au', amazonPage: 'amazon.com.au', lang: 'en_AU' },
  'co.jp':  { alexaHost: 'alexa.amazon.co.jp',  amazonPage: 'amazon.co.jp',  lang: 'ja_JP' },
};

// Cached Alexa instances per device – avoids re-init on every check.
// Key: echo.cookie (first 32 chars) + region
const instanceCache = new Map();

// Pending proxy-auth sessions. Key: sessionId, value: { resolve, reject, alexa }
const authSessions = new Map();

function regionCfg(region) {
  return REGIONS[region] || REGIONS['de'];
}

// Extract the plain localCookie string (used as a stable cache key even when
// `cookie` is a full JSON object with OAuth tokens).
function extractLocalCookie(cookie) {
  if (typeof cookie === 'string' && cookie.trimStart().startsWith('{')) {
    try { return JSON.parse(cookie).localCookie || cookie; } catch {}
  }
  return cookie;
}

function cacheKey(cookie, region) {
  const local = extractLocalCookie(cookie);
  return `${local.slice(0, 32)}|${region}`;
}

function promisify(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

// Rejects after `ms` milliseconds — prevents hanging API calls from blocking
// the server scheduler indefinitely.
function withTimeout(promise, ms, label = 'call') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ]);
}

async function getAlexa(cookie, region) {
  const key = cacheKey(cookie, region);
  if (instanceCache.has(key)) return instanceCache.get(key);

  const r = regionCfg(region);
  const alexa = new AlexaRemote();

  // alexa-remote2 accepts either a plain cookie string or the full cookieData
  // object (including macDms / adp_token OAuth tokens).  When we stored the
  // full object as JSON, parse it back so the library can use all tokens.
  let cookieArg = cookie;
  if (typeof cookie === 'string' && cookie.trimStart().startsWith('{')) {
    try { cookieArg = JSON.parse(cookie); } catch {}
  }

  await new Promise((resolve, reject) => {
    alexa.init({
      cookie: cookieArg,
      proxyOnly: false,
      alexaServiceHost: r.alexaHost,
      amazonPage: r.amazonPage,
      logger: null,
      usePushConnection: false,
      cookieRefreshInterval: 7 * 24 * 60 * 60 * 1000,
      // Called by alexa-remote2 whenever it auto-refreshes the session tokens.
      // We forward the new cookie to index.js so it can persist it to db.json.
      onCookieChange: (refreshed) => {
        log.info('[echo] Cookie auto-refresh erkannt');
        if (_onCookieRefresh) {
          const newCookieStr = refreshed && typeof refreshed === 'object'
            ? JSON.stringify(refreshed)
            : String(refreshed);
          _onCookieRefresh({ oldCookie: cookie, newCookie: newCookieStr, region });
        }
      },
    }, (err) => (err ? reject(err) : resolve()));
  });
  instanceCache.set(key, alexa);
  return alexa;
}

// Echo device families recognised as proper Echo speakers
const ECHO_FAMILIES = new Set(['ECHO', 'KNIGHT', 'ROOK']);

export async function echoCheck(device, timeout) {
  const cfg = device.echo || {};
  const cookie = cfg.cookie || '';
  const region = cfg.region || 'de';
  const serial = cfg.serial || '';
  const selectedKeys = Array.isArray(cfg.metrics) ? cfg.metrics : [];
  // Convert seconds → ms; minimum 5 s, fallback 10 s if not provided
  const timeoutMs = Math.max(5000, (timeout || 10) * 1000);

  if (!cookie) {
    return { status: 'unknown', latency: null, at: Date.now(), error: 'Nicht angemeldet — Amazon Login erforderlich' };
  }

  const start = Date.now();
  let alexa;
  try {
    alexa = await withTimeout(getAlexa(cookie, region), timeoutMs, 'getAlexa');
  } catch (err) {
    instanceCache.delete(cacheKey(cookie, region));
    return { status: 'offline', latency: null, at: Date.now(), error: `Alexa-Login fehlgeschlagen: ${err.message}` };
  }

  let devices;
  try {
    const data = await withTimeout(promisify(alexa.getDevices.bind(alexa)), timeoutMs, 'getDevices');
    devices = data?.devices || [];
  } catch (err) {
    instanceCache.delete(cacheKey(cookie, region));
    return { status: 'offline', latency: null, at: Date.now(), error: `Geräteliste: ${err.message}` };
  }

  let echoDevice;
  if (serial) {
    echoDevice = devices.find(d => d.serialNumber === serial);
    if (!echoDevice) {
      return { status: 'offline', latency: null, at: Date.now(), error: `Gerät ${serial} nicht im Amazon-Account gefunden` };
    }
  } else {
    echoDevice = devices.find(d => d.deviceFamily && (ECHO_FAMILIES.has(d.deviceFamily) || d.deviceFamily.startsWith('ECHO')));
    if (!echoDevice) {
      return { status: 'offline', latency: null, at: Date.now(), error: 'Kein Echo-Gerät gefunden — Seriennummer eintragen' };
    }
  }

  const latency = Date.now() - start;
  if (!echoDevice.online) return { status: 'offline', latency, at: Date.now() };

  const result = { status: 'online', latency, at: Date.now(), metrics: [] };

  if (selectedKeys.length > 0) {
    const needsDnd = selectedKeys.includes('dnd');
    const needsPlayer = selectedKeys.some(k => k !== 'dnd');

    let dndValue = false;
    if (needsDnd) {
      try {
        const dndData = await withTimeout(
          promisify(alexa.getDoNotDisturb.bind(alexa)),
          timeoutMs,
          'getDoNotDisturb'
        );
        const entry = Array.isArray(dndData)
          ? dndData.find(d => d.deviceSerialNumber === echoDevice.serialNumber)
          : dndData;
        dndValue = entry?.enabled ?? false;
      } catch { /* dnd is optional */ }
    }

    if (needsPlayer) {
      try {
        const info = await withTimeout(
          promisify(alexa.getPlayerInfo.bind(alexa), echoDevice.serialNumber),
          timeoutMs,
          'getPlayerInfo'
        );
        if (info?.playerInfo) {
          const p = info.playerInfo;
          const vol = p.volume || {};
          const txt = p.infoText || {};
          const trp = p.transport || {};
          const prov = p.provider || {};
          const DEFS = {
            state:    { label: 'Status',          value: p.state || 'IDLE',           format: 'text' },
            volume:   { label: 'Lautstärke',       value: vol.volume ?? null,           format: 'int' },
            muted:    { label: 'Stummgeschaltet',  value: vol.muted ?? false,           format: 'bool' },
            title:    { label: 'Titel',            value: txt.title || '',              format: 'text' },
            artist:   { label: 'Interpret',        value: txt.subText1 || '',           format: 'text' },
            album:    { label: 'Album',            value: txt.subText2 || '',           format: 'text' },
            provider: { label: 'Dienst',           value: prov.providerName || '',      format: 'text' },
            shuffle:  { label: 'Zufallswiedergabe', value: trp.shuffle ?? false,        format: 'bool' },
            repeat:   { label: 'Wiederholen',      value: trp.repeat ?? false,          format: 'bool' },
            dnd:      { label: 'Nicht stören',     value: dndValue,                     format: 'bool' },
          };
          for (const key of selectedKeys) {
            const def = DEFS[key];
            if (def) result.metrics.push({ key, label: def.label, value: def.value, format: def.format });
          }
        }
      } catch { /* player info is optional, device still online */ }
    } else if (needsDnd) {
      // only dnd was requested, no player info needed
      result.metrics.push({ key: 'dnd', label: 'Nicht stören', value: dndValue, format: 'bool' });
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// Proxy-based auth flow
// ──────────────────────────────────────────────────────────────────────────────

let activeProxy = null; // only one proxy at a time

export async function startEchoAuth({ region = 'de', proxyPort = 3001, proxyOwnIp = '127.0.0.1', sessionId }) {
  if (activeProxy) {
    try { activeProxy.alexa?.stop?.(); } catch {}
    if (activeProxy.reject) activeProxy.reject(new Error('Neue Auth-Session gestartet'));
    activeProxy = null;
  }

  const r = regionCfg(region);
  log.info(`[echo-auth] Starte Proxy — region=${region} proxyOwnIp=${proxyOwnIp} port=${proxyPort}`);

  return new Promise((resolve, reject) => {
    const alexa = new AlexaRemote();
    activeProxy = { alexa, resolve, reject };

    alexa.init({
      cookie: '',
      proxyOnly: true,
      proxyOwnIp,
      proxyPort,
      proxyListenBind: '0.0.0.0',
      alexaServiceHost: r.alexaHost,
      amazonPage: r.amazonPage,
      amazonPageProxyLanguage: r.lang,
      logger: debugLogger(),  // only active in debug mode
      usePushConnection: false,
      closeWindowSeconds: 120,
      cookieRefreshInterval: 7 * 24 * 60 * 60 * 1000,
    }, async (err) => {
      activeProxy = null;
      log.debug('[echo-auth] Callback ausgelöst, err=', err);

      if (err) {
        log.error('[echo-auth] Fehler:', err);
        return reject(err instanceof Error ? err : new Error(String(err)));
      }

      // alexa-remote2 stores the cookie in different properties depending on version
      log.debug('[echo-auth] cookieData type:', typeof alexa.cookieData, 'keys:', alexa.cookieData ? Object.keys(alexa.cookieData) : 'none');
      log.debug('[echo-auth] cookie prop:', typeof alexa.cookie);

      // Prefer to store the FULL cookieData object (as JSON) so that OAuth
      // tokens (macDms, adp_token) are preserved for automatic session refresh.
      // Fall back to the plain string cookie only when no object is available.
      let rawCookie = '';
      if (alexa.cookieData && typeof alexa.cookieData === 'object') {
        rawCookie = JSON.stringify(alexa.cookieData);
      } else if (typeof alexa.cookieData === 'string' && alexa.cookieData) {
        rawCookie = alexa.cookieData;
      }
      if (!rawCookie && typeof alexa.cookie === 'string') rawCookie = alexa.cookie;

      log.debug('[echo-auth] rawCookie type:', rawCookie.startsWith('{') ? 'JSON-object' : 'string',
                'length:', rawCookie.length);

      if (!rawCookie) return reject(new Error('Cookie konnte nicht abgerufen werden — bitte docker logs prüfen'));

      // Discover devices
      let devices = [];
      try {
        const data = await promisify(alexa.getDevices.bind(alexa));
        devices = (data?.devices || [])
          .filter(d => d.deviceFamily && (ECHO_FAMILIES.has(d.deviceFamily) || d.deviceFamily.startsWith('ECHO')))
          .map(d => ({ serial: d.serialNumber, name: d.accountName, type: d.deviceTypeFriendlyName || d.deviceFamily, online: d.online }));
        log.info('[echo-auth] Gefundene Geräte:', devices.length);
      } catch (e) {
        log.warn('[echo-auth] Geräte-Abruf fehlgeschlagen:', e.message);
      }

      instanceCache.set(cacheKey(rawCookie, region), alexa);

      // Persist BEFORE resolving so the data is always saved regardless of .then() behaviour
      if (_onAuthSuccess) {
        try {
          await _onAuthSuccess({ cookie: rawCookie, devices, region });
          log.debug('[echo-auth] _onAuthSuccess abgeschlossen');
        } catch (e) {
          log.warn('[echo-auth] _onAuthSuccess fehlgeschlagen:', e.message);
        }
      }

      log.debug('[echo-auth] resolve() wird aufgerufen');
      resolve({ cookie: rawCookie, devices });
    });
  });
}

export function getEchoPresets() {
  return [
    { id: 'basic', label: 'Basis (Status + Lautstärke)', keys: ['state', 'volume'] },
    { id: 'media', label: 'Medien (Titel + Interpret)',  keys: ['state', 'title', 'artist', 'album', 'provider'] },
    { id: 'full',  label: 'Vollständig',                 keys: ['state', 'volume', 'muted', 'title', 'artist', 'album', 'provider', 'shuffle', 'repeat', 'dnd'] },
  ];
}

export function getEchoMetricCatalog() {
  return [
    { key: 'state',    label: 'Wiedergabestatus',     format: 'text' },
    { key: 'volume',   label: 'Lautstärke (0–100)',   format: 'int' },
    { key: 'title',    label: 'Aktueller Titel',      format: 'text' },
    { key: 'artist',   label: 'Interpret / Station',  format: 'text' },
    { key: 'album',    label: 'Album',                format: 'text' },
    { key: 'provider', label: 'Dienst (Spotify etc.)', format: 'text' },
    { key: 'muted',    label: 'Stummgeschaltet',      format: 'bool' },
    { key: 'shuffle',  label: 'Zufallswiedergabe',    format: 'bool' },
    { key: 'repeat',   label: 'Wiederholen',          format: 'bool' },
    { key: 'dnd',      label: 'Nicht stören',         format: 'bool' },
  ];
}
