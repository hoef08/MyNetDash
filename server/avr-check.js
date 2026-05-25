// =====================================================================
// Denon / Marantz AVR check (read-only)
// Uses the HTTP/XML status endpoints common to most networked AVRs:
//   - /goform/formMainZone_MainZoneXmlStatusLite.xml  → main zone status
//   - /goform/formZone2_Zone2XmlStatusLite.xml        → zone 2 (optional)
//   - /goform/Deviceinfo.xml                          → model + firmware
//
// Models 2016+ usually serve these on port 8080. Older models on port 80.
// Both ports are tried automatically when the configured port doesn't answer.
// =====================================================================

// Catalogue of supported AVR metrics. Each entry knows where to fetch its value.
// 'endpoint' refers to one of the URLs below; 'tag' is the XML element name.
const ENDPOINTS = {
  main:    '/goform/formMainZone_MainZoneXmlStatusLite.xml',
  zone2:   '/goform/formZone2_Zone2XmlStatusLite.xml',
  device:  '/goform/Deviceinfo.xml',
};

export const AVR_METRICS = {
  power: {
    label: 'Power', format: 'text',
    endpoint: 'main', tag: 'Power',
  },
  input: {
    label: 'Eingang', format: 'text',
    endpoint: 'main', tag: 'InputFuncSelect',
  },
  volume: {
    label: 'Lautstärke', format: 'db',
    endpoint: 'main', tag: 'MasterVolume',
  },
  mute: {
    label: 'Mute', format: 'text',
    endpoint: 'main', tag: 'Mute',
  },
  surroundMode: {
    label: 'Sound-Mode', format: 'text',
    endpoint: 'main', tag: 'selectSurround',
  },
  zone2Power: {
    label: 'Zone 2 Power', format: 'text',
    endpoint: 'zone2', tag: 'Power',
  },
  zone2Input: {
    label: 'Zone 2 Eingang', format: 'text',
    endpoint: 'zone2', tag: 'InputFuncSelect',
  },
  zone2Volume: {
    label: 'Zone 2 Lautstärke', format: 'db',
    endpoint: 'zone2', tag: 'MasterVolume',
  },
  zone2Mute: {
    label: 'Zone 2 Mute', format: 'text',
    endpoint: 'zone2', tag: 'Mute',
  },
  modelName: {
    label: 'Modell', format: 'text',
    endpoint: 'device', tag: 'ModelName',
  },
  brandCode: {
    label: 'Marke', format: 'text',
    endpoint: 'device', tag: 'BrandCode',
  },
  firmware: {
    label: 'Firmware', format: 'text',
    endpoint: 'device', tag: 'UpgradeVersion',
  },
};

export const AVR_PRESETS = {
  'avr-basic': {
    label: 'AVR Basis (Hauptzone)',
    description: 'Power, Eingang, Lautstärke, Mute, Sound-Mode',
    keys: ['power', 'input', 'volume', 'mute', 'surroundMode']
  },
  'avr-with-zone2': {
    label: 'AVR mit Zone 2',
    description: 'Hauptzone + Zone 2',
    keys: ['power', 'input', 'volume', 'surroundMode',
           'zone2Power', 'zone2Input', 'zone2Volume']
  },
  'avr-full': {
    label: 'AVR Vollständig',
    description: 'Alle Werte inkl. Modell und Firmware',
    keys: ['power', 'input', 'volume', 'mute', 'surroundMode',
           'modelName', 'brandCode', 'firmware']
  },
};

export function getAvrPresets() {
  return Object.entries(AVR_PRESETS).map(([id, p]) => ({ id, ...p }));
}

export function getAvrMetricCatalog() {
  return Object.entries(AVR_METRICS).map(([key, m]) => ({
    key, label: m.label, format: m.format, endpoint: m.endpoint,
  }));
}

// ---------- Helpers ----------

// Extract <Tag><value>X</value></Tag> values from the AVR status XML.
// The "Lite" status XML uses this nested-value layout for almost every field.
function extractValues(xml) {
  const out = {};
  // <SomeTag><value>...</value></SomeTag>  (standard AVR layout)
  const reA = /<([A-Za-z_][A-Za-z0-9_]*)[^>]*>\s*<value>([^<]*)<\/value>\s*<\/\1>/g;
  let m;
  while ((m = reA.exec(xml)) !== null) {
    if (out[m[1]] === undefined) out[m[1]] = m[2].trim();
  }
  // Fallback: <Tag>value</Tag>  (Deviceinfo.xml uses this flatter form)
  const reB = /<([A-Za-z_][A-Za-z0-9_]*)[^>]*>([^<]+)<\/\1>/g;
  while ((m = reB.exec(xml)) !== null) {
    if (out[m[1]] === undefined && !/[\r\n]/.test(m[2])) {
      out[m[1]] = m[2].trim();
    }
  }
  return out;
}

async function fetchEndpoint(host, port, path, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${host}:${port}${path}`, {
      method: 'GET',
      signal: ctrl.signal,
      // Most AVRs ignore Accept but this avoids occasional 406s
      headers: { 'Accept': 'application/xml,text/xml,*/*' },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, port };
    const text = await res.text();
    return { ok: true, text, port };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : (err.message || String(err)), port };
  } finally {
    clearTimeout(timer);
  }
}

// Try the configured port first; if nothing responds, try the other one.
async function tryFetchAuto(host, configuredPort, path, timeoutMs) {
  const candidates = [configuredPort, configuredPort === 8080 ? 80 : 8080];
  let lastErr = null;
  for (const port of candidates) {
    const r = await fetchEndpoint(host, port, path, timeoutMs);
    if (r.ok) return r;
    lastErr = r.error;
  }
  return { ok: false, error: lastErr || 'no response', port: configuredPort };
}

// Map a raw AVR value to our display format.
function formatValue(raw, format) {
  if (raw == null) return null;
  if (format === 'db') {
    // Marantz uses "absolute" scale: -80 (= silent) to +18.
    // Some firmwares return "535" meaning 53.5 (0.5dB scale × 10). Heuristic:
    // a value ≥ 99 with no decimal is probably the integer×10 form.
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    // Convert raw "absolute" to dB: 80 → 0dB, so dB = num - 80
    // But the API already returns the dB-relative number for most models.
    // The string usually contains a decimal point ("-25.5") → use as-is.
    if (typeof raw === 'string' && raw.includes('.')) return num;
    // Integer like "-255" should become -25.5
    if (Math.abs(num) > 30) return num / 10;
    return num;
  }
  return String(raw);
}

// ---------- Main check ----------

export async function avrCheck(device, timeoutSec = 4) {
  const cfg = device.avr || {};
  const wantedKeys = Array.isArray(cfg.metrics) && cfg.metrics.length
    ? cfg.metrics
    : AVR_PRESETS['avr-basic'].keys;
  const port = Number(cfg.port) || 8080;
  const timeoutMs = timeoutSec * 1000;

  // Group wanted keys by endpoint, fetch each endpoint at most once.
  const byEndpoint = new Map();
  for (const key of wantedKeys) {
    const def = AVR_METRICS[key];
    if (!def) continue;
    if (!byEndpoint.has(def.endpoint)) byEndpoint.set(def.endpoint, []);
    byEndpoint.get(def.endpoint).push(key);
  }

  const start = performance.now();
  const fetched = new Map();      // endpoint name → parsed values map
  let firstError = null;
  let detectedPort = null;

  await Promise.all([...byEndpoint.keys()].map(async (epName) => {
    const path = ENDPOINTS[epName];
    const r = await tryFetchAuto(device.host, port, path, timeoutMs);
    if (!r.ok) {
      // Optional endpoints (zone2, device) may simply not exist on the
      // receiver — only treat the main endpoint as critical.
      if (!firstError && epName === 'main') firstError = r.error;
      return;
    }
    detectedPort = r.port;
    fetched.set(epName, extractValues(r.text));
  }));

  const latency = Math.round(performance.now() - start);

  if (!fetched.has('main')) {
    return {
      status: 'offline', latency: null, at: Date.now(),
      error: firstError || 'Hauptzone nicht erreichbar'
    };
  }

  const metrics = wantedKeys.map((key) => {
    const def = AVR_METRICS[key];
    if (!def) return null;
    const values = fetched.get(def.endpoint);
    const raw = values ? values[def.tag] : null;
    return {
      key,
      label: def.label,
      format: def.format,    // 'db' or 'text' — frontend formats accordingly
      value: formatValue(raw, def.format),
    };
  }).filter(Boolean);

  return {
    status: 'online',
    latency,
    at: Date.now(),
    metrics,
    detectedPort,
  };
}
