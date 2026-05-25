// =====================================================================
// FRITZ!Box check — uses TR-064 to fetch a configurable set of metrics.
// Designed to plug into the same result format as snmp-check.js.
// =====================================================================

import { tr064Call } from './tr064-client.js';

// Catalogue of supported FritzBox metrics. Each entry knows:
//   - the SOAP service / action / control URL
//   - which response field holds the value
//   - how it should be displayed (format)
//   - whether authentication is required
//
// 'auth' calls go to /upnp/control/* (port 49000 / HTTP).
// 'igd' calls go to /igdupnp/control/* — these are unauthenticated.
//
export const FRITZ_METRICS = {
  // ----- public (no auth) — always available on port 49000 -----
  externalIp: {
    label: 'Externe IP',  format: 'text',
    auth: false,
    controlUrl:  '/igdupnp/control/WANIPConn1',
    serviceType: 'urn:schemas-upnp-org:service:WANIPConnection:1',
    action: 'GetExternalIPAddress',
    field:  'NewExternalIPAddress',
  },
  connectionStatus: {
    label: 'Verbindung',  format: 'text',
    auth: false,
    controlUrl:  '/igdupnp/control/WANIPConn1',
    serviceType: 'urn:schemas-upnp-org:service:WANIPConnection:1',
    action: 'GetStatusInfo',
    field:  'NewConnectionStatus',
  },
  connectionUptime: {
    label: 'Verbindungs-Uptime', format: 'seconds',
    auth: false,
    controlUrl:  '/igdupnp/control/WANIPConn1',
    serviceType: 'urn:schemas-upnp-org:service:WANIPConnection:1',
    action: 'GetStatusInfo',
    field:  'NewUptime',
  },
  totalBytesReceived: {
    label: 'Total empfangen', format: 'bytes',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetTotalBytesReceived',
    field:  'NewTotalBytesReceived',
  },
  totalBytesSent: {
    label: 'Total gesendet', format: 'bytes',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetTotalBytesSent',
    field:  'NewTotalBytesSent',
  },
  maxDownstream: {
    label: 'Max. Downstream', format: 'bps',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetCommonLinkProperties',
    field:  'NewLayer1DownstreamMaxBitRate',
  },
  maxUpstream: {
    label: 'Max. Upstream', format: 'bps',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetCommonLinkProperties',
    field:  'NewLayer1UpstreamMaxBitRate',
  },

  // ----- authenticated TR-064 calls -----
  modelName: {
    label: 'Modell', format: 'text',
    auth: true,
    controlUrl:  '/upnp/control/deviceinfo',
    serviceType: 'urn:dslforum-org:service:DeviceInfo:1',
    action: 'GetInfo',
    field:  'NewModelName',
  },
  firmwareVersion: {
    label: 'Firmware', format: 'text',
    auth: true,
    controlUrl:  '/upnp/control/deviceinfo',
    serviceType: 'urn:dslforum-org:service:DeviceInfo:1',
    action: 'GetInfo',
    field:  'NewSoftwareVersion',
  },
  deviceUptime: {
    label: 'Box-Uptime', format: 'seconds',
    auth: true,
    controlUrl:  '/upnp/control/deviceinfo',
    serviceType: 'urn:dslforum-org:service:DeviceInfo:1',
    action: 'GetInfo',
    field:  'NewUpTime',
  },
  serialNumber: {
    label: 'Seriennummer', format: 'text',
    auth: true,
    controlUrl:  '/upnp/control/deviceinfo',
    serviceType: 'urn:dslforum-org:service:DeviceInfo:1',
    action: 'GetInfo',
    field:  'NewSerialNumber',
  },
  wlan24Enabled: {
    label: '2.4 GHz WLAN', format: 'bool',
    auth: true,
    controlUrl:  '/upnp/control/wlanconfig1',
    serviceType: 'urn:dslforum-org:service:WLANConfiguration:1',
    action: 'GetInfo',
    field:  'NewEnable',
  },
  wlan24Clients: {
    label: '2.4 GHz Clients', format: 'int',
    auth: true,
    controlUrl:  '/upnp/control/wlanconfig1',
    serviceType: 'urn:dslforum-org:service:WLANConfiguration:1',
    action: 'GetTotalAssociations',
    field:  'NewTotalAssociations',
  },
  wlan5Enabled: {
    label: '5 GHz WLAN', format: 'bool',
    auth: true,
    controlUrl:  '/upnp/control/wlanconfig2',
    serviceType: 'urn:dslforum-org:service:WLANConfiguration:1',
    action: 'GetInfo',
    field:  'NewEnable',
  },
  wlan5Clients: {
    label: '5 GHz Clients', format: 'int',
    auth: true,
    controlUrl:  '/upnp/control/wlanconfig2',
    serviceType: 'urn:dslforum-org:service:WLANConfiguration:1',
    action: 'GetTotalAssociations',
    field:  'NewTotalAssociations',
  },
  wlanGuestEnabled: {
    label: 'Gast-WLAN', format: 'bool',
    auth: true,
    controlUrl:  '/upnp/control/wlanconfig3',
    serviceType: 'urn:dslforum-org:service:WLANConfiguration:1',
    action: 'GetInfo',
    field:  'NewEnable',
  },
  hostsCount: {
    label: 'Geräte im Netz', format: 'int',
    auth: true,
    controlUrl:  '/upnp/control/hosts',
    serviceType: 'urn:dslforum-org:service:Hosts:1',
    action: 'GetHostNumberOfEntries',
    field:  'NewHostNumberOfEntries',
  },
  // Real-time bandwidth (instantaneous, B/s)
  byteSendRate: {
    label: 'Upload Rate', format: 'bps',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetAddonInfos',
    field:  'NewByteSendRate',
    multiplyBy: 8,   // bytes/s → bits/s for "bps" format
  },
  byteReceiveRate: {
    label: 'Download Rate', format: 'bps',
    auth: false,
    controlUrl:  '/igdupnp/control/WANCommonIFC1',
    serviceType: 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1',
    action: 'GetAddonInfos',
    field:  'NewByteReceiveRate',
    multiplyBy: 8,
  },
};

// Recommended sets users can apply with one click.
export const FRITZ_PRESETS = {
  'fritz-basic': {
    label: 'FRITZ!Box Basis (kein Login)',
    description: 'Online-Status, externe IP, Bandbreite — funktioniert ohne Anmeldung',
    keys: ['connectionStatus', 'externalIp', 'connectionUptime',
           'byteReceiveRate', 'byteSendRate',
           'totalBytesReceived', 'totalBytesSent']
  },
  'fritz-full': {
    label: 'FRITZ!Box Vollständig',
    description: 'Alle Metriken inkl. WLAN-Status (Login erforderlich)',
    keys: ['connectionStatus', 'externalIp',
           'modelName', 'firmwareVersion', 'deviceUptime',
           'wlan24Clients', 'wlan5Clients', 'hostsCount',
           'byteReceiveRate', 'byteSendRate',
           'maxDownstream', 'maxUpstream']
  },
  'fritz-wlan': {
    label: 'FRITZ!Box WLAN',
    description: 'Nur WLAN-bezogene Metriken (Login erforderlich)',
    keys: ['wlan24Enabled', 'wlan24Clients', 'wlan5Enabled', 'wlan5Clients',
           'wlanGuestEnabled', 'hostsCount']
  },
};

export function getFritzPresets() {
  return Object.entries(FRITZ_PRESETS).map(([id, p]) => ({ id, ...p }));
}

export function getFritzMetricCatalog() {
  return Object.entries(FRITZ_METRICS).map(([key, m]) => ({
    key, label: m.label, format: m.format, requiresAuth: m.auth,
  }));
}

// ---------- Main check ----------

/**
 * Run a FRITZ!Box check.
 * device.fritz = { username, password, metrics: ['key1', 'key2', ...] }
 */
export async function fritzboxCheck(device, timeoutSec = 5) {
  const cfg = device.fritz || {};
  const wantedKeys = Array.isArray(cfg.metrics) && cfg.metrics.length
    ? cfg.metrics
    : FRITZ_PRESETS['fritz-basic'].keys;
  const username = cfg.username || '';
  const password = cfg.password || '';

  // Group calls by (controlUrl + action) so we don't call the same SOAP
  // method multiple times when several metrics share a response.
  const callGroups = new Map();
  for (const key of wantedKeys) {
    const def = FRITZ_METRICS[key];
    if (!def) continue;
    const groupKey = `${def.controlUrl}|${def.action}`;
    if (!callGroups.has(groupKey)) {
      callGroups.set(groupKey, { def, keys: [] });
    }
    callGroups.get(groupKey).keys.push(key);
  }

  const start = performance.now();
  const metricsOut = wantedKeys
    .map((k) => FRITZ_METRICS[k] && { key: k, label: FRITZ_METRICS[k].label, format: FRITZ_METRICS[k].format })
    .filter(Boolean);

  // Index metrics by key for value insertion
  const byKey = new Map(metricsOut.map((m) => [m.key, m]));

  let firstError = null;

  await Promise.all([...callGroups.values()].map(async ({ def, keys }) => {
    try {
      const result = await tr064Call({
        host:        device.host,
        port:        cfg.port || 49000,
        tls:         !!cfg.tls,
        username,
        password,
        controlUrl:  def.controlUrl,
        serviceType: def.serviceType,
        action:      def.action,
        timeoutMs:   timeoutSec * 1000,
      });
      for (const k of keys) {
        const fdef = FRITZ_METRICS[k];
        const raw = result[fdef.field];
        if (raw == null) continue;
        let value = raw;
        if (['int', 'seconds', 'bytes', 'bps'].includes(fdef.format)) {
          const n = Number(value);
          if (Number.isFinite(n)) {
            value = fdef.multiplyBy ? n * fdef.multiplyBy : n;
          } else {
            continue;
          }
        }
        if (fdef.format === 'bool') {
          value = (raw === '1' || raw === 'true' || raw === 'TRUE') ? 'ein' : 'aus';
        }
        const m = byKey.get(k);
        if (m) m.value = value;
      }
    } catch (err) {
      if (!firstError) firstError = err.message || String(err);
    }
  }));

  const latency = Math.round(performance.now() - start);
  const anySuccess = metricsOut.some((m) => m.value !== undefined && m.value !== null);

  if (!anySuccess) {
    return {
      status: 'offline', latency: null, at: Date.now(),
      error: firstError || 'Keine Antwort von der FRITZ!Box'
    };
  }

  return {
    status: 'online',
    latency,
    at: Date.now(),
    metrics: metricsOut.map((m) => ({
      key: m.key, label: m.label, format: m.format, value: m.value ?? null,
    })),
  };
}
