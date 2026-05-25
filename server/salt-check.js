// =====================================================================
// Salt Fiber Box check (XGS-PON Wi-Fi 7 router by Salt Switzerland)
//
// One HTTPS call to /api/device returns a JSON payload with device info,
// network status and optical (PON) telemetry. Self-signed cert → we use
// rawRequest with cert validation disabled.
// =====================================================================

import { fetchJson } from './http-util.js';

// Catalogue of supported metrics. Each entry knows:
//   - the JSON field on the device response
//   - how to display the value (format)
//   - optional transform to clean up the raw string (Salt embeds units
//     directly in values, e.g. "53.699 degree C")
export const SALT_METRICS = {
  modelName:      { label: 'Modell',         format: 'text', field: 'modelName' },
  firmwareVersion:{ label: 'Firmware',       format: 'text', field: 'firmwareVersion' },
  hardwareVersion:{ label: 'Hardware',       format: 'text', field: 'hardwareVersion' },
  bootCodeVersion:{ label: 'Boot-Code',      format: 'text', field: 'bootCodeVersion' },
  serialNumber:   { label: 'Seriennummer',   format: 'text', field: 'serialNumber' },
  oltVendorId:    { label: 'OLT Vendor-ID',  format: 'text', field: 'OLTVendorId' },
  oltVersion:     { label: 'OLT-Version',    format: 'text', field: 'OLTVersion' },

  ipv4Address:    { label: 'IPv4-Adresse',   format: 'text', field: 'IPv4_address' },
  ipv4Dns:        { label: 'IPv4-DNS',       format: 'text', field: 'IPv4_DNS' },
  ipv6Address:    { label: 'IPv6-Adresse',   format: 'text', field: 'IPv6_address' },
  ipv6Dns:        { label: 'IPv6-DNS',       format: 'text', field: 'IPv6_DNS' },

  temperature:    { label: 'Temperatur',     format: 'celsius', field: 'Temperature',
                    extract: extractNumber },
  voltage:        { label: 'Spannung',       format: 'float', field: 'Voltage',
                    extract: extractNumber, unit: 'V' },
  biasCurrent:    { label: 'Bias-Strom',     format: 'float', field: 'bias_current',
                    extract: extractNumber, unit: 'mA' },
  rxPower:        { label: 'RX-Leistung',    format: 'float', field: 'rx_power',
                    extract: extractNumber, unit: 'dBm' },
  txPower:        { label: 'TX-Leistung',    format: 'float', field: 'tx_power',
                    extract: extractNumber, unit: 'dBm' },
};

// Pull the leading numeric portion out of strings like "53.699 degree C"
// or "-14.213 dbm". Negative values are supported (important for rx_power
// which is normally negative on a healthy fiber link).
function extractNumber(raw) {
  if (raw == null) return null;
  const m = String(raw).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// Recommended sets users can apply with one click.
export const SALT_PRESETS = {
  'salt-basic': {
    label: 'Salt Basis (Status + IP)',
    description: 'Modell, Firmware, IPv4/IPv6, alle optischen Telemetrie-Werte',
    keys: ['modelName', 'firmwareVersion',
           'ipv4Address', 'ipv6Address',
           'temperature', 'rxPower', 'txPower'],
  },
  'salt-optical': {
    label: 'Salt Optical-Telemetrie',
    description: 'Glasfaser-Werte für Performance-Überwachung',
    keys: ['temperature', 'voltage', 'biasCurrent', 'rxPower', 'txPower'],
  },
  'salt-full': {
    label: 'Salt Vollständig',
    description: 'Alle verfügbaren Felder',
    keys: Object.keys(SALT_METRICS),
  },
};

export function getSaltPresets() {
  return Object.entries(SALT_PRESETS).map(([id, p]) => ({ id, ...p }));
}

export function getSaltMetricCatalog() {
  return Object.entries(SALT_METRICS).map(([key, m]) => ({
    key, label: m.label, format: m.format, unit: m.unit,
  }));
}

// ---------- Main check ----------

/**
 * Run a Salt Fiber Box check.
 * device.salt = { metrics: ['key1', 'key2', ...], tls: true, port: 443 }
 */
export async function saltCheck(device, timeoutSec = 5) {
  const cfg = device.salt || {};
  const wantedKeys = Array.isArray(cfg.metrics) && cfg.metrics.length
    ? cfg.metrics
    : SALT_PRESETS['salt-basic'].keys;
  const tls = cfg.tls !== false;     // default HTTPS (Salt boxes only do HTTPS)
  const port = cfg.port || (tls ? 443 : 80);
  const proto = tls ? 'https' : 'http';
  const url = `${proto}://${device.host}:${port}/api/device`;

  const start = performance.now();
  let payload;
  try {
    payload = await fetchJson(url, { timeoutMs: timeoutSec * 1000, tls });
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: err.message };
  }
  const latency = Math.round(performance.now() - start);

  const metrics = wantedKeys.map((key) => {
    const def = SALT_METRICS[key];
    if (!def) return null;
    const raw = payload[def.field];
    let value;
    if (def.extract) {
      value = def.extract(raw);
    } else {
      value = raw != null ? String(raw) : null;
    }
    return { key, label: def.label, format: def.format, value, unit: def.unit };
  }).filter(Boolean);

  return {
    status: 'online',
    latency,
    at: Date.now(),
    metrics,
  };
}
