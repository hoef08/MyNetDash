import express from 'express';
import net from 'node:net';
import { log, setLogLevel } from './logger.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  loadDb, getSettings, updateSettings,
  getDevices, addDevice, updateDevice, deleteDevice, replaceAll, reorderDevices
} from './storage.js';
import { snmpCheck, snmpGet, snmpWalk, getPresets } from './snmp-check.js';
import { fritzboxCheck, getFritzPresets, getFritzMetricCatalog } from './fritzbox-check.js';
import { avrCheck, getAvrPresets, getAvrMetricCatalog } from './avr-check.js';
import { hueCheck, hueDiscover, getHuePresets, getHueSummaryCatalog } from './hue-check.js';
import { saltCheck, getSaltPresets, getSaltMetricCatalog } from './salt-check.js';
import { echoCheck, startEchoAuth, getEchoPresets, getEchoMetricCatalog, setEchoAuthSuccessHook, setEchoCookieRefreshHook } from './alexa-check.js';
import { shieldCheck, getShieldPresets, getShieldMetricCatalog } from './shield-check.js';
import { applyMetricMappings, getStandardMappings } from './value-mapper.js';
import { parseMibFile, saveMibFile, listUploadedMibs, deleteMibFile } from './mib-parser.js';
import { httpCheck, tcpCheck } from './http-check.js';
import {
  initHistory, record, getHistory, getStats, deleteHistory, shutdown as shutdownHistory
} from './history.js';
import { dispatch, sendTest, evaluateRule, clearRuleState } from './notifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

await loadDb();
await initHistory();

// Apply persisted log level immediately on startup
{ const s = await getSettings(); if (s.logLevel) setLogLevel(s.logLevel); }

// Track full previous result per device so transitions and threshold rules
// can compare. Keyed by device id.
const prevResults = new Map();

// Cache of latest check results, served by GET /api/check-all so the UI
// doesn't re-trigger checks on every refresh.
const lastResults = new Map();

// Background scheduler — runs checks for ALL enabled devices on a regular
// interval, independently of any browser being open. This is what makes
// notifications fire even when nobody is looking at the dashboard.
let schedulerTimer = null;
let schedulerRunning = false;

async function runScheduledChecks() {
  if (schedulerRunning) return;            // overlap guard
  schedulerRunning = true;
  try {
    const devs = (await getDevices()).filter((d) => d.enabled);
    const timeout = (await getSettings()).timeout;
    await Promise.all(devs.map(async (d) => {
      try {
        const r = await runCheck(d, timeout);
        lastResults.set(d.id, r);
        await afterCheck(d, r);
      } catch (err) {
        log.error(`[scheduler] ${d.name}:`, err.message);
      }
    }));
  } catch (err) {
    log.error('[scheduler] cycle failed:', err.message);
  } finally {
    schedulerRunning = false;
  }
}

async function startScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  const interval = Math.max(5, (await getSettings()).interval || 30) * 1000;
  schedulerTimer = setInterval(runScheduledChecks, interval);
  log.info(`[scheduler] running every ${interval / 1000}s`);
  // first cycle immediately on boot
  runScheduledChecks();
}

// ── Echo cookie auto-refresh persistence ──────────────────────────────────────
// When alexa-remote2 automatically refreshes OAuth tokens (every 7 days by
// default) it fires the `onCookieChange` callback we registered in getAlexa().
// That callback calls _onCookieRefresh which is wired here: we find every
// device that still holds the old cookie string and replace it with the new
// one so the session stays valid across container restarts.
setEchoCookieRefreshHook(async ({ oldCookie, newCookie, region }) => {
  log.info('[echo] Cookie-Refresh-Hook – suche betroffene Geräte');
  try {
    const devList = await getDevices();
    const affected = devList.filter(d => d.method === 'echo' && d.echo?.cookie === oldCookie);
    if (!affected.length) {
      log.warn('[echo] Cookie-Refresh-Hook: kein passendes Gerät gefunden');
      return;
    }
    for (const dev of affected) {
      await updateDevice(dev.id, { ...dev, echo: { ...dev.echo, cookie: newCookie } });
      log.info(`[echo] Cookie in Gerät ${dev.id} (${dev.name}) automatisch aktualisiert`);
    }
  } catch (e) {
    log.warn('[echo] Cookie-Refresh-Hook fehlgeschlagen:', e.message);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.text({ type: ['text/plain', 'application/x-mib'], limit: '4mb' }));

const api = express.Router();

// -------------------- Health & Settings --------------------
api.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

api.get('/settings',  async (req, res) => res.json(await getSettings()));
api.put('/settings',  async (req, res) => {
  const updated = await updateSettings(req.body || {});
  if (updated.logLevel) setLogLevel(updated.logLevel);
  await startScheduler();   // restart with potentially new interval
  res.json(updated);
});

// -------------------- Devices --------------------
api.get('/devices', async (req, res) => res.json(await getDevices()));

api.post('/devices', async (req, res) => {
  const device = await addDevice(req.body || {});
  res.status(201).json(device);
  // Run an immediate check so the new device shows up with status, not "checking"
  if (device.enabled) {
    runCheck(device, (await getSettings()).timeout)
      .then(r => { lastResults.set(device.id, r); return afterCheck(device, r); })
      .catch(() => {});
  }
});

// Specific routes BEFORE the generic /:id route, otherwise Express
// matches "reorder" as an :id parameter.
api.put('/devices/reorder', async (req, res) => {
  const ok = await reorderDevices(req.body?.ids || []);
  if (!ok) return res.status(400).json({ error: 'invalid payload' });
  res.json({ ok: true });
});

api.put('/devices/:id', async (req, res) => {
  const updated = await updateDevice(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

api.delete('/devices/:id', async (req, res) => {
  const ok = await deleteDevice(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  deleteHistory(req.params.id);
  prevResults.delete(req.params.id);
  lastResults.delete(req.params.id);
  clearRuleState(req.params.id);
  res.status(204).end();
});

api.post('/import', async (req, res) => {
  const db = await replaceAll(req.body || {});
  res.json({ ok: true, devices: db.devices.length });
});

// -------------------- Checks --------------------
api.get('/check/:id', async (req, res) => {
  const devs = await getDevices();
  const d = devs.find((x) => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  const timeout = (await getSettings()).timeout;
  const result = await runCheck(d, timeout);
  await afterCheck(d, result);
  res.json(result);
});

api.get('/check-all', async (req, res) => {
  // Server runs its own scheduler; just return the most recent cached results.
  // If the cache is empty (just started), trigger one round immediately.
  if (lastResults.size === 0) await runScheduledChecks();
  const devs = await getDevices();
  const out = devs
    .filter((d) => d.enabled)
    .map((d) => ({ id: d.id, ...(lastResults.get(d.id) || { status: 'checking', latency: null, at: Date.now() }) }));
  res.json(out);
});

// -------------------- History --------------------
api.get('/history/:id', (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 500));
  res.json({ points: getHistory(req.params.id, limit), stats: getStats(req.params.id) });
});

api.get('/history', async (req, res) => {
  const devs = await getDevices();
  const limit = Math.max(1, Math.min(120, Number(req.query.limit) || 60));
  const out = {};
  devs.forEach(d => { out[d.id] = getHistory(d.id, limit); });
  res.json(out);
});

// -------------------- SNMP helpers (editor) --------------------
api.get('/snmp/presets', (req, res) => res.json(getPresets()));

api.post('/snmp/get', async (req, res) => {
  const { device, oids } = req.body || {};
  if (!device?.host)  return res.status(400).json({ error: 'device.host required' });
  if (!Array.isArray(oids) || !oids.length) return res.status(400).json({ error: 'oids[] required' });
  const timeout = (await getSettings()).timeout;
  res.json(await snmpGet(device, oids, timeout));
});

api.post('/snmp/walk', async (req, res) => {
  const { device, rootOid } = req.body || {};
  if (!device?.host) return res.status(400).json({ error: 'device.host required' });
  if (!rootOid)      return res.status(400).json({ error: 'rootOid required' });
  const timeout = Math.max(5, (await getSettings()).timeout);
  res.json(await snmpWalk(device, rootOid, timeout, 100));
});

// -------------------- FritzBox helpers --------------------
api.get('/fritz/presets',  (req, res) => res.json(getFritzPresets()));
api.get('/fritz/catalog',  (req, res) => res.json(getFritzMetricCatalog()));

api.post('/fritz/test', async (req, res) => {
  const device = req.body || {};
  if (!device.host) return res.status(400).json({ error: 'host required' });
  const timeout = (await getSettings()).timeout;
  res.json(await fritzboxCheck({ ...device, method: 'fritzbox', enabled: true }, timeout));
});

// -------------------- AVR (Denon/Marantz) helpers --------------------
api.get('/avr/presets',  (req, res) => res.json(getAvrPresets()));
api.get('/avr/catalog',  (req, res) => res.json(getAvrMetricCatalog()));

api.post('/avr/test', async (req, res) => {
  const device = req.body || {};
  if (!device.host) return res.status(400).json({ error: 'host required' });
  const timeout = (await getSettings()).timeout;
  res.json(await avrCheck({ ...device, method: 'avr', enabled: true }, timeout));
});

// -------------------- Hue Bridge helpers --------------------
api.get('/hue/presets', (req, res) => res.json(getHuePresets()));
api.get('/hue/summary-catalog', (req, res) => res.json(getHueSummaryCatalog()));

api.post('/hue/discover', async (req, res) => {
  const { host, token, port, tls } = req.body || {};
  if (!host || !token) return res.status(400).json({ error: 'host und token erforderlich' });
  const useTls = tls !== false;
  const usePort = port || (useTls ? 443 : 80);
  const timeout = (await getSettings()).timeout;
  try {
    const result = await hueDiscover(host, token, usePort, timeout, useTls);
    res.json(result);
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

api.post('/hue/test', async (req, res) => {
  const device = req.body || {};
  if (!device.host) return res.status(400).json({ error: 'host required' });
  const timeout = (await getSettings()).timeout;
  res.json(await hueCheck({ ...device, method: 'hue', enabled: true }, timeout));
});

// -------------------- Salt Fiber Box helpers --------------------
api.get('/salt/presets',  (req, res) => res.json(getSaltPresets()));
api.get('/salt/catalog',  (req, res) => res.json(getSaltMetricCatalog()));

api.post('/salt/test', async (req, res) => {
  const device = req.body || {};
  if (!device.host) return res.status(400).json({ error: 'host required' });
  const timeout = (await getSettings()).timeout;
  res.json(await saltCheck({ ...device, method: 'salt', enabled: true }, timeout));
});

// -------------------- Amazon Echo / Alexa --------------------
api.get('/echo/presets', (req, res) => res.json(getEchoPresets()));
api.get('/echo/catalog',  (req, res) => res.json(getEchoMetricCatalog()));

// Pending auth results – keyed by sessionId (kept until consumed)
const echoAuthResults = new Map();

// Probe TCP port until it accepts connections (max ~8 s)
function waitForPort(port, maxMs = 8000) {
  return new Promise(resolve => {
    const deadline = Date.now() + maxMs;
    function attempt() {
      const sock = net.createConnection({ port, host: '127.0.0.1' });
      sock.setTimeout(300);
      sock.once('connect', () => { sock.destroy(); resolve(true); });
      sock.once('error', () => { sock.destroy(); retry(); });
      sock.once('timeout', () => { sock.destroy(); retry(); });
    }
    function retry() {
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(attempt, 300);
    }
    attempt();
  });
}

api.post('/echo/auth-start', async (req, res) => {
  const { region = 'de', proxyPort = 3001, sessionId, serverHost, deviceId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId erforderlich' });

  const proxyOwnIp = serverHost || req.hostname || '127.0.0.1';
  echoAuthResults.delete(sessionId);
  log.info(`[echo-auth] Auth-Start: sessionId=${sessionId} deviceId=${deviceId || 'neu'} region=${region}`);

  // Register hook so persistence runs INSIDE the alexa-remote2 callback, before resolve().
  // This bypasses the anomaly where .then() never fires after startEchoAuth resolves.
  setEchoAuthSuccessHook(async ({ cookie, devices, region: r }) => {
    log.debug(`[echo-auth] Hook läuft – cookie.length=${cookie?.length}, devices=${devices?.length}`);
    try {
      await updateSettings({ _echoPendingAuth: { cookie, devices, region: r, at: Date.now() } });
      log.debug('[echo-auth] Hook: Cookie in db.json gespeichert');
    } catch (e) {
      log.warn('[echo-auth] Hook: Fehler beim Speichern in db.json:', e.message);
    }
    if (deviceId) {
      try {
        const devList = await getDevices();
        const dev = devList.find(d => d.id === deviceId);
        if (dev) {
          await updateDevice(deviceId, { ...dev, echo: { ...(dev.echo || {}), cookie, region: r } });
          log.info(`[echo-auth] Cookie direkt in Gerät ${deviceId} gespeichert`);
        } else {
          log.warn(`[echo-auth] Hook: Gerät ${deviceId} nicht gefunden`);
        }
      } catch (e) {
        log.warn('[echo-auth] Hook: Direkt-Speicherung fehlgeschlagen:', e.message);
      }
    }
    echoAuthResults.set(sessionId, { done: true, cookie, devices });
    log.debug('[echo-auth] Hook: Auth-Ergebnis in echoAuthResults gesetzt');
  });

  startEchoAuth({ region, proxyPort, proxyOwnIp, sessionId })
    .then(async result => {
      log.debug(`[echo-auth] .then() läuft – cookie.length=${result.cookie?.length}, devices=${result.devices?.length}`);

      // Persist cookie in db.json settings so it survives container restarts
      try {
        await updateSettings({ _echoPendingAuth: { cookie: result.cookie, devices: result.devices, region, at: Date.now() } });
        log.debug('[echo-auth] Cookie in db.json (_echoPendingAuth) gespeichert');
      } catch (e) {
        log.warn('[echo-auth] Fehler beim Speichern in db.json:', e.message);
      }

      // If caller told us which device to update, save the cookie directly to the device record
      if (deviceId) {
        try {
          const devList = await getDevices();
          const dev = devList.find(d => d.id === deviceId);
          if (dev) {
            await updateDevice(deviceId, { ...dev, echo: { ...(dev.echo || {}), cookie: result.cookie, region } });
            log.info(`[echo-auth] Cookie direkt in Gerät ${deviceId} gespeichert`);
          } else {
            log.warn(`[echo-auth] Gerät ${deviceId} nicht gefunden`);
          }
        } catch (e) {
          log.warn('[echo-auth] Direkt-Speicherung fehlgeschlagen:', e.message);
        }
      }

      echoAuthResults.set(sessionId, { done: true, ...result });
      log.debug('[echo-auth] Auth-Ergebnis in echoAuthResults gesetzt');
    })
    .catch(err => {
      log.warn('[echo-auth] Auth-Promise rejected:', err.message);
      echoAuthResults.set(sessionId, { done: true, error: err.message });
    });

  const ready = await waitForPort(proxyPort);
  if (!ready) return res.json({ ok: false, error: `Proxy auf Port ${proxyPort} konnte nicht gestartet werden` });

  res.json({ ok: true, proxyUrl: `http://${proxyOwnIp}:${proxyPort}` });
});

api.get('/echo/auth-poll/:sessionId', (req, res) => {
  const data = echoAuthResults.get(req.params.sessionId);
  if (!data) return res.json({ done: false });
  // Keep result available for 2 more minutes in case the frontend polls again
  setTimeout(() => echoAuthResults.delete(req.params.sessionId), 120_000);
  res.json(data);
});

// Returns the last successful auth (stored in db.json, survives restarts)
api.get('/echo/last-auth', async (req, res) => {
  try {
    const settings = await getSettings();
    const pending = settings._echoPendingAuth;
    if (!pending || Date.now() - pending.at > 30 * 60 * 1000) {
      return res.json({ available: false });
    }
    res.json({ available: true, cookie: pending.cookie, devices: pending.devices, region: pending.region });
  } catch (e) {
    res.json({ available: false });
  }
});

api.post('/echo/test', async (req, res) => {
  const device = req.body || {};
  const timeout = (await getSettings()).timeout;
  res.json(await echoCheck({ ...device, method: 'echo', enabled: true }, timeout));
});

// -------------------- NVIDIA Shield (ADB) --------------------
api.get('/shield/presets', (req, res) => res.json(getShieldPresets()));
api.get('/shield/catalog', (req, res) => res.json(getShieldMetricCatalog()));

api.post('/shield/test', async (req, res) => {
  const device = req.body || {};
  const timeout = (await getSettings()).timeout;
  res.json(await shieldCheck({ ...device, method: 'adb', enabled: true }, timeout));
});

// -------------------- Value Mappings --------------------
api.get('/mappings/standards', (req, res) => res.json(getStandardMappings()));

// -------------------- MIB files --------------------
api.get('/mibs', async (req, res) => {
  try {
    res.json(await listUploadedMibs());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.post('/mibs', async (req, res) => {
  try {
    const { filename, content } = req.body || {};
    if (!filename || typeof content !== 'string') {
      return res.status(400).json({ error: 'filename and content required' });
    }
    const savedPath = await saveMibFile(filename, content);
    const savedName = path.basename(savedPath);
    try {
      const parsed = await parseMibFile(savedPath);
      res.status(201).json({ filename: savedName, ...parsed });
    } catch (err) {
      await deleteMibFile(savedName);
      res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

api.delete('/mibs/:filename', async (req, res) => {
  try {
    const ok = await deleteMibFile(req.params.filename);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Notifications --------------------
api.post('/notifications/test', async (req, res) => {
  const result = await sendTest(req.body || {});
  res.json(result);
});

// -------------------- Core check + side-effects --------------------
async function runCheck(device, timeout) {
  let result;
  try {
    if (!device.enabled) return { status: 'unknown', latency: null, at: Date.now() };
    const method = device.method || 'http';
    if (method === 'snmp')          result = await snmpCheck(device, timeout);
    else if (method === 'tcp')      result = await tcpCheck(device, timeout);
    else if (method === 'fritzbox') result = await fritzboxCheck(device, timeout);
    else if (method === 'avr')      result = await avrCheck(device, timeout);
    else if (method === 'hue')      result = await hueCheck(device, timeout);
    else if (method === 'salt')     result = await saltCheck(device, timeout);
    else if (method === 'echo')     result = await echoCheck(device, timeout);
    else if (method === 'adb')      result = await shieldCheck(device, timeout);
    else                            result = await httpCheck(device, timeout);
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: err.message || String(err) };
  }
  // Apply per-device value mappings (e.g. printer status code 3 → "Idle")
  if (device.metricMappings && result?.metrics) {
    applyMetricMappings(result, device.metricMappings);
  }
  return result;
}

async function afterCheck(device, result) {
  record(device.id, result);
  await maybeNotify(device, result);
}

async function maybeNotify(device, result) {
  const previous = prevResults.get(device.id);
  prevResults.set(device.id, result);

  const settings = await getSettings();
  const allChannels = settings.notifications || [];
  if (!allChannels.length) return;
  const channelById = new Map(allChannels.map(c => [c.id, c]));

  const deviceRules = Array.isArray(device.notificationRules) ? device.notificationRules : [];
  const useDeviceRules = deviceRules.length > 0;

  if (useDeviceRules) {
    // Per-device rule mode: evaluate each rule independently.
    for (const rule of deviceRules) {
      if (rule.enabled === false) continue;
      const channel = channelById.get(rule.channelId);
      if (!channel) continue;

      const fired = evaluateRule(rule, previous, result, device.id);
      if (!fired) continue;

      const payload = buildPayload(device, result, rule, fired);
      await dispatch(channel, payload).catch(() => null);
    }
    return;
  }

  // Fallback (legacy global behaviour): notify on ANY transition for ALL channels
  const s = result.status;
  if (s !== 'online' && s !== 'offline') return;
  if (!previous || previous.status === s) return;

  const event = s === 'online' ? 'device.online' : 'device.offline';
  const payload = buildPayload(device, result, { event });
  await Promise.all(allChannels.map(c => dispatch(c, payload).catch(() => null)));
}

function buildPayload(device, result, rule, fired = {}) {
  const event = rule.event;
  const s = result.status;
  let title, message;

  if (event === 'device.offline') {
    title = `🚨 ${device.name} nicht erreichbar`;
    message = `${device.name} (${device.host}) antwortet nicht${result.error ? ` — ${result.error}` : ''}.`;
  } else if (event === 'device.online') {
    title = `✅ ${device.name} wieder erreichbar`;
    message = `${device.name} (${device.host}) ist wieder online${result.latency ? ` (${result.latency}ms)` : ''}.`;
  } else if (event === 'metric.threshold') {
    const dur = rule.durationSec ? ` (≥ ${rule.durationSec}s)` : '';
    title = `⚠️ ${device.name}: ${fired.label || rule.metricKey} ${rule.op} ${rule.threshold}`;
    message = `${fired.label || rule.metricKey} = ${fired.value}${dur} auf ${device.name} (${device.host}).`;
  } else {
    title = `Ereignis auf ${device.name}`;
    message = `Status: ${s}`;
  }

  return {
    event,
    title,
    message,
    status: s,
    device,
    deviceId: device.id,
    fromRule: !!rule.id || event === 'metric.threshold',
    cooldownMinutes: rule.cooldownMinutes,
    metricKey: rule.metricKey,
    metricLabel: fired.label,
    value: fired.value,
  };
}

app.use('/api', api);
app.use(express.static(path.join(__dirname, '..', 'public')));

const server = app.listen(PORT, '0.0.0.0', () => {
  log.info(`[net-monitor] running on http://0.0.0.0:${PORT}`);
  startScheduler();
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    log.info(`\n[net-monitor] shutting down (${sig})`);
    if (schedulerTimer) clearInterval(schedulerTimer);
    await shutdownHistory();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 4000).unref();
  });
}
