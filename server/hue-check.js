// =====================================================================
// Philips Hue Bridge check (API v1)
// One http://<bridge-ip>/api/<token> call returns the entire system state:
// lights, sensors, switches, groups, config. We aggregate / select metrics
// from that single response.
// =====================================================================

// Catalogue of "summary" metrics that always work without picking specific
// items. These are computed from the full state response.
export const HUE_SUMMARY_METRICS = {
  bridgeName: {
    label: 'Bridge-Name', format: 'text',
    extract: (s) => s.config?.name,
  },
  bridgeModel: {
    label: 'Bridge-Modell', format: 'text',
    extract: (s) => s.config?.modelid,
  },
  swVersion: {
    label: 'Software-Version', format: 'text',
    extract: (s) => s.config?.swversion,
  },
  apiVersion: {
    label: 'API-Version', format: 'text',
    extract: (s) => s.config?.apiversion,
  },
  zigbeeChannel: {
    label: 'ZigBee-Kanal', format: 'int',
    extract: (s) => s.config?.zigbeechannel,
  },
  updateAvailable: {
    label: 'Update verfügbar', format: 'text',
    extract: (s) => {
      const u = s.config?.swupdate2?.state;
      if (!u) return null;
      // 'noupdates' | 'transferring' | 'anyreadytoinstall' | 'allreadytoinstall'
      return u === 'noupdates' ? 'nein' : 'ja';
    },
  },

  lightsTotal: {
    label: 'Lampen gesamt', format: 'int',
    extract: (s) => Object.keys(s.lights || {}).length,
  },
  lightsReachable: {
    label: 'Lampen erreichbar', format: 'int',
    extract: (s) => Object.values(s.lights || {}).filter(l => l.state?.reachable).length,
  },
  lightsOn: {
    label: 'Lampen an', format: 'int',
    extract: (s) => Object.values(s.lights || {}).filter(l => l.state?.on && l.state?.reachable).length,
  },
  lightsUnreachable: {
    label: 'Lampen nicht erreichbar', format: 'int',
    extract: (s) => Object.values(s.lights || {}).filter(l => !l.state?.reachable).length,
  },

  sensorsTotal: {
    label: 'Sensoren gesamt', format: 'int',
    extract: (s) => Object.values(s.sensors || {}).filter(isPhysicalSensor).length,
  },
  sensorsLowBattery: {
    label: 'Sensoren mit niedriger Batterie', format: 'int',
    extract: (s) => Object.values(s.sensors || {})
      .filter(isPhysicalSensor)
      .filter(x => typeof x.config?.battery === 'number' && x.config.battery < 20).length,
  },

  switchesTotal: {
    label: 'Schalter gesamt', format: 'int',
    extract: (s) => Object.values(s.sensors || {}).filter(isSwitch).length,
  },

  groupsTotal: {
    label: 'Gruppen gesamt', format: 'int',
    extract: (s) => Object.keys(s.groups || {}).length,
  },
  groupsAnyOn: {
    label: 'Gruppen mit Licht an', format: 'int',
    extract: (s) => Object.values(s.groups || {}).filter(g => g.state?.any_on).length,
  },
};

function isPhysicalSensor(s) {
  // Hue stores virtual "daylight" and CLIPGenericStatus etc. as sensors too.
  // Filter to the ones that have a productname / battery (= real hardware).
  if (!s) return false;
  const t = s.type || '';
  return /Temperature|Presence|LightLevel|GenericFlag|GenericStatus/.test(t)
    && !!s.uniqueid && !!s.productname;
}

function isSwitch(s) {
  if (!s) return false;
  const t = s.type || '';
  return /Switch|RotaryDial|Button/.test(t) || /buttonevent/.test(JSON.stringify(s.state || ''));
}

export const HUE_PRESETS = {
  'hue-summary': {
    label: 'Hue Übersicht',
    description: 'Bridge + Zähler über alle Lampen/Sensoren/Schalter',
    summaryKeys: [
      'bridgeName', 'swVersion', 'updateAvailable',
      'lightsTotal', 'lightsOn', 'lightsUnreachable',
      'sensorsTotal', 'switchesTotal', 'groupsAnyOn'
    ],
    items: [],
  },
  'hue-bridge': {
    label: 'Nur Bridge-Info',
    description: 'Software-Version, Update, ZigBee-Kanal',
    summaryKeys: ['bridgeName', 'bridgeModel', 'swVersion', 'apiVersion', 'zigbeeChannel', 'updateAvailable'],
    items: [],
  },
  'hue-health': {
    label: 'Health-Check',
    description: 'Sieht auf einen Blick was an Hue-Geräten Probleme hat',
    summaryKeys: ['lightsUnreachable', 'sensorsLowBattery', 'updateAvailable'],
    items: [],
  },
};

export function getHuePresets() {
  return Object.entries(HUE_PRESETS).map(([id, p]) => ({ id, ...p }));
}

export function getHueSummaryCatalog() {
  return Object.entries(HUE_SUMMARY_METRICS).map(([key, m]) => ({
    key, label: m.label, format: m.format,
  }));
}

// ---------- Discovery: list devices the user can pick ----------

/**
 * Fetch the full bridge state and return a flat list of selectable items,
 * sorted by category.
 */
export async function hueDiscover(host, token, port, timeoutSec = 5, tls = true) {
  const state = await fetchBridge(host, port, token, timeoutSec, tls);
  const items = [];

  // Lights
  for (const [id, l] of Object.entries(state.lights || {})) {
    items.push({
      kind: 'light',
      id,
      label: l.name || `Light ${id}`,
      type:  l.type || '',
      modelid: l.modelid || '',
    });
  }

  // Sensors split by kind
  for (const [id, s] of Object.entries(state.sensors || {})) {
    if (!s) continue;
    if (isSwitch(s)) {
      items.push({
        kind: 'switch',
        id,
        label: s.name || `Switch ${id}`,
        type: s.type || '',
        modelid: s.modelid || '',
      });
    } else if (isPhysicalSensor(s)) {
      let subkind = 'sensor';
      if (/Temperature/.test(s.type || ''))   subkind = 'temperature';
      if (/Presence/.test(s.type || ''))      subkind = 'presence';
      if (/LightLevel/.test(s.type || ''))    subkind = 'lightlevel';
      items.push({
        kind: subkind,
        id,
        label: s.name || `Sensor ${id}`,
        type: s.type || '',
        modelid: s.modelid || '',
      });
    }
  }

  // Groups (rooms / zones)
  for (const [id, g] of Object.entries(state.groups || {})) {
    items.push({
      kind: 'group',
      id,
      label: g.name || `Group ${id}`,
      type: g.type || '',
      lights: (g.lights || []).length,
    });
  }

  return { ok: true, items };
}

// Hue Gen-2 bridges only serve their API over HTTPS, with a self-signed
// certificate. The shared http-util handles the self-signed cert case.
import { rawRequest } from './http-util.js';

async function fetchBridge(host, port, token, timeoutSec, tls = true) {
  const proto = tls ? 'https' : 'http';
  const defaultPort = tls ? 443 : 80;
  const url = `${proto}://${host}:${port || defaultPort}/api/${encodeURIComponent(token)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutSec * 1000);
  try {
    const { status, body } = await rawRequest(url, { signal: ctrl.signal, tls });
    if (status !== 200) throw new Error(`HTTP ${status}`);
    let data;
    try { data = JSON.parse(body); }
    catch { throw new Error('Antwort der Bridge ist kein JSON'); }
    if (Array.isArray(data) && data[0]?.error) {
      const e = data[0].error;
      throw new Error(`Hue ${e.type}: ${e.description}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Build per-item metrics from a full state ----------

function lightMetrics(prefix, light) {
  const s = light.state || {};
  const out = [];
  out.push({ key: `${prefix}_on`, label: `${light.name}: an`, format: 'text',
             value: s.reachable === false ? '—' : (s.on ? 'an' : 'aus') });
  out.push({ key: `${prefix}_reach`, label: `${light.name}: erreichbar`, format: 'text',
             value: s.reachable ? 'ja' : 'nein' });
  if (typeof s.bri === 'number') {
    out.push({ key: `${prefix}_bri`, label: `${light.name}: Helligkeit`, format: 'percent',
               value: Math.round((s.bri / 254) * 100) });
  }
  return out;
}

function sensorMetrics(prefix, sensor) {
  const out = [];
  const cfg = sensor.config || {};
  const st  = sensor.state  || {};
  if (typeof cfg.battery === 'number') {
    out.push({ key: `${prefix}_battery`, label: `${sensor.name}: Batterie`, format: 'percent',
               value: cfg.battery });
  }
  if (typeof st.temperature === 'number') {
    out.push({ key: `${prefix}_temp`, label: `${sensor.name}: Temperatur`, format: 'celsius',
               value: st.temperature / 100 });   // hue stores °C × 100
  }
  if (typeof st.lightlevel === 'number') {
    // raw lightlevel is "10000 × log10(lux) + 1"; many people display lux
    const lux = Math.round(Math.pow(10, (st.lightlevel - 1) / 10000));
    out.push({ key: `${prefix}_lux`, label: `${sensor.name}: Lux`, format: 'int', value: lux });
    out.push({ key: `${prefix}_dark`, label: `${sensor.name}: dunkel`, format: 'text',
               value: st.dark ? 'ja' : 'nein' });
  }
  if (typeof st.presence === 'boolean') {
    out.push({ key: `${prefix}_presence`, label: `${sensor.name}: Bewegung`, format: 'text',
               value: st.presence ? 'erkannt' : 'keine' });
    if (st.lastupdated) {
      out.push({ key: `${prefix}_lastupd`, label: `${sensor.name}: zuletzt`, format: 'text',
                 value: st.lastupdated.replace('T', ' ') });
    }
  }
  return out;
}

function switchMetrics(prefix, sw) {
  const out = [];
  const cfg = sw.config || {};
  const st  = sw.state  || {};
  if (typeof cfg.battery === 'number') {
    out.push({ key: `${prefix}_battery`, label: `${sw.name}: Batterie`, format: 'percent',
               value: cfg.battery });
  }
  if (typeof st.buttonevent === 'number') {
    out.push({ key: `${prefix}_lastbutton`, label: `${sw.name}: letzter Knopf`, format: 'int',
               value: st.buttonevent });
  }
  if (st.lastupdated) {
    out.push({ key: `${prefix}_lastupd`, label: `${sw.name}: zuletzt`, format: 'text',
               value: st.lastupdated.replace('T', ' ') });
  }
  return out;
}

function groupMetrics(prefix, group) {
  const out = [];
  const st = group.state || {};
  out.push({ key: `${prefix}_anyon`, label: `${group.name}: Licht an`, format: 'text',
             value: st.any_on ? 'ja' : 'nein' });
  out.push({ key: `${prefix}_allon`, label: `${group.name}: alle an`, format: 'text',
             value: st.all_on ? 'ja' : 'nein' });
  out.push({ key: `${prefix}_count`, label: `${group.name}: Lampen`, format: 'int',
             value: (group.lights || []).length });
  return out;
}

// ---------- Main check ----------

/**
 * device.hue = {
 *   token: 'abcdef…',
 *   port: 80,
 *   summaryKeys: ['lightsTotal', ...],
 *   items: [{ kind: 'light', id: '1' }, { kind: 'sensor', id: '7' }, ...]
 * }
 */
export async function hueCheck(device, timeoutSec = 5) {
  const cfg = device.hue || {};
  const token = cfg.token || '';
  if (!token) {
    return { status: 'offline', latency: null, at: Date.now(), error: 'API-Token fehlt' };
  }

  const start = performance.now();
  let state;
  try {
    const tls = cfg.tls !== false;   // default: HTTPS (Gen-2 bridges require it)
    const port = cfg.port || (tls ? 443 : 80);
    state = await fetchBridge(device.host, port, token, timeoutSec, tls);
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: err.message };
  }
  const latency = Math.round(performance.now() - start);

  const metrics = [];

  // Summary metrics
  for (const key of (cfg.summaryKeys || [])) {
    const def = HUE_SUMMARY_METRICS[key];
    if (!def) continue;
    let v;
    try { v = def.extract(state); } catch { v = null; }
    metrics.push({ key, label: def.label, format: def.format, value: v ?? null });
  }

  // Per-item metrics
  for (const it of (cfg.items || [])) {
    const safeId = String(it.id).replace(/[^a-zA-Z0-9]/g, '');
    const prefix = `${it.kind}_${safeId}`;
    if (it.kind === 'light') {
      const l = state.lights?.[it.id];
      if (l) metrics.push(...lightMetrics(prefix, l));
    } else if (it.kind === 'group') {
      const g = state.groups?.[it.id];
      if (g) metrics.push(...groupMetrics(prefix, g));
    } else if (['temperature', 'presence', 'lightlevel', 'sensor'].includes(it.kind)) {
      const s = state.sensors?.[it.id];
      if (s) metrics.push(...sensorMetrics(prefix, s));
    } else if (it.kind === 'switch') {
      const s = state.sensors?.[it.id];
      if (s) metrics.push(...switchMetrics(prefix, s));
    }
  }

  return {
    status: 'online',
    latency,
    at: Date.now(),
    metrics,
  };
}
