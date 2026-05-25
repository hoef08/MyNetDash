// =====================================================================
// NET.MONITOR — frontend
// =====================================================================

const DEVICE_TYPES = {
  nas:        { label: 'NAS',           accent: 'sky',     iconId: 'hard-drive' },
  raspberry:  { label: 'Raspberry Pi',  accent: 'rose',    iconId: 'cpu' },
  pc:         { label: 'PC / Server',   accent: 'violet',  iconId: 'monitor' },
  router:     { label: 'Router',        accent: 'cyan',    iconId: 'router' },
  printer:    { label: 'Drucker',       accent: 'amber',   iconId: 'printer' },
  tv:         { label: 'TV / Media',    accent: 'fuchsia', iconId: 'tv' },
  camera:     { label: 'Kamera',        accent: 'indigo',  iconId: 'camera' },
  smart:      { label: 'Smart Device',  accent: 'yellow',  iconId: 'lightbulb' },
  switch:     { label: 'Switch',        accent: 'blue',    iconId: 'network' },
  other:      { label: 'Sonstiges',     accent: 'zinc',    iconId: 'server' },
  echo:       { label: 'Amazon Echo',   accent: 'orange',  iconId: 'speaker' },
  shield:     { label: 'NVIDIA Shield', accent: 'green',   iconId: 'gamepad' },
};

const ICONS = {
  'hard-drive': '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
  'cpu':        '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/>',
  'monitor':    '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'router':     '<rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6.01 18H6M10.01 18H10M15 10V5a3 3 0 0 0-6 0M12 10v0M7 10h10"/>',
  'printer':    '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  'tv':         '<rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>',
  'camera':     '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  'lightbulb':  '<line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  'network':    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  'server':     '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  'refresh':    '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  'zap':        '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'pencil':     '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  'trash':      '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'clock':      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'check':      '<polyline points="20 6 9 17 4 12"/>',
  'x':          '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'activity':   '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'speaker':    '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12.01" y2="6"/>',
  'gamepad':    '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/>',
};

const svg = (id, size = 20, stroke = 1.5) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[id] || ''}</svg>`;

// =====================================================================
// Theme
// =====================================================================
const THEME_KEY = 'nm-theme';
const THEME_ORDER = ['dark', 'light', 'auto'];

function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; }
  catch { return 'dark'; }
}
function setTheme(theme) {
  if (!THEME_ORDER.includes(theme)) theme = 'dark';
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme();
  updateThemeButton();
  syncThemeChooser();
}
function applyTheme() {
  const pref = getTheme();
  const resolved = pref === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : pref;
  document.documentElement.setAttribute('data-theme', resolved);
}
function cycleTheme() {
  const cur = getTheme();
  const next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
  setTheme(next);
}
const THEME_ICONS = {
  dark:  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M21 12.5A8.5 8.5 0 0 1 11.5 3a7 7 0 1 0 9.5 9.5z" fill="currentColor" stroke="none"/>',
  light: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
  auto:  '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>',
};
function updateThemeButton() {
  const btn = document.querySelector('#btnTheme');
  if (!btn) return;
  const t = getTheme();
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">${THEME_ICONS[t]}</svg>`;
  btn.title = `Theme: ${t === 'dark' ? 'Dunkel' : t === 'light' ? 'Hell' : 'Auto'} (klicken zum Wechseln)`;
}
function syncThemeChooser() {
  const cur = getTheme();
  document.querySelectorAll('#themeChooser button').forEach((b) => {
    b.classList.toggle('active', b.dataset.themeVal === cur);
  });
}
// Follow OS theme changes when set to 'auto'
const mq = window.matchMedia('(prefers-color-scheme: light)');
mq.addEventListener?.('change', () => {
  if (getTheme() === 'auto') applyTheme();
});

// =====================================================================
// State
// =====================================================================
let state = {
  devices: [],
  settings: { interval: 30, timeout: 4, autoRefresh: true, defaultSnmp: { community: 'public', version: '2c', port: 161 }, notifications: [] },
  results: {},
  history: {},
  presets: [],
  mibs: [],              // uploaded MIB files with parsed modules
  fritzPresets: [],      // FRITZ!Box metric presets from backend
  fritzCatalog: [],      // FRITZ!Box metric catalogue from backend
  avrPresets: [],        // AVR metric presets
  avrCatalog: [],        // AVR metric catalogue
  huePresets: [],        // Hue presets
  hueSummaryCatalog: [], // Hue summary metrics catalogue
  hueDiscoveredItems: [],// last-discovered Hue lights/sensors/switches/groups
  saltPresets: [],       // Salt Fiber Box presets
  saltCatalog: [],       // Salt Fiber Box metric catalogue
  echoPresets: [],       // Amazon Echo presets
  echoCatalog: [],       // Amazon Echo metric catalogue
  shieldPresets: [],     // NVIDIA Shield presets
  shieldCatalog: [],     // NVIDIA Shield metric catalogue
  standardMappings: [],  // library of pre-defined value mappings
  search: '',
  typeFilter: 'all',
  statusFilter: 'all',
  checking: false,
  timer: null,
};

// Metrics currently being edited in the device modal
let draftMetrics = [];

// Notification rules currently being edited in the device modal
let draftRules = [];

// FritzBox metric keys selected in the device modal
let draftFritzMetrics = [];

// AVR metric keys selected in the device modal
let draftAvrMetrics = [];

// Hue summary keys + selected items in the device modal
let draftHueSummaryKeys = [];
let draftHueItems = [];   // array of { kind, id }

// Per-device value mappings — array of { metricKey, pairs: [{from, to}, ...] }
// Stored as array internally for the editor; serialized as { metricKey: { from: to } } object.
let draftMappings = [];

// Salt Fiber Box metric keys selected in the device modal
let draftSaltMetrics = [];

// Amazon Echo metric keys selected in the device modal
let draftEchoMetrics = [];

// NVIDIA Shield metric keys selected in the device modal
let draftShieldMetrics = [];

// =====================================================================
// API
// =====================================================================
const API = '/api';
const api = {
  devices:  ()        => fetch(`${API}/devices`).then(r => r.json()),
  settings: ()        => fetch(`${API}/settings`).then(r => r.json()),
  addDevice: (d)      => fetch(`${API}/devices`, { method: 'POST', headers: jsonH(), body: JSON.stringify(d) }).then(r => r.json()),
  updDevice: (id, d)  => fetch(`${API}/devices/${id}`, { method: 'PUT', headers: jsonH(), body: JSON.stringify(d) }).then(r => r.json()),
  delDevice: (id)     => fetch(`${API}/devices/${id}`, { method: 'DELETE' }),
  reorderDevices: (ids) => fetch(`${API}/devices/reorder`, { method: 'PUT', headers: jsonH(), body: JSON.stringify({ ids }) }).then(r => r.json()),
  updSettings: (s)    => fetch(`${API}/settings`, { method: 'PUT', headers: jsonH(), body: JSON.stringify(s) }).then(r => r.json()),
  checkAll: ()        => fetch(`${API}/check-all`).then(r => r.json()),
  checkOne: (id)      => fetch(`${API}/check/${id}`).then(r => r.json()),
  import: (payload)   => fetch(`${API}/import`, { method: 'POST', headers: jsonH(), body: JSON.stringify(payload) }).then(r => r.json()),
  historyAll: (limit = 60) => fetch(`${API}/history?limit=${limit}`).then(r => r.json()),
  historyOne: (id)    => fetch(`${API}/history/${id}`).then(r => r.json()),
  testChannel: (c)    => fetch(`${API}/notifications/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(c) }).then(r => r.json()),
  snmpPresets: ()     => fetch(`${API}/snmp/presets`).then(r => r.json()),
  snmpGet: (device, oids)     => fetch(`${API}/snmp/get`,  { method: 'POST', headers: jsonH(), body: JSON.stringify({ device, oids }) }).then(r => r.json()),
  snmpWalk: (device, rootOid) => fetch(`${API}/snmp/walk`, { method: 'POST', headers: jsonH(), body: JSON.stringify({ device, rootOid }) }).then(r => r.json()),
  mibs: ()            => fetch(`${API}/mibs`).then(r => r.json()),
  mibUpload: (filename, content) => fetch(`${API}/mibs`, { method: 'POST', headers: jsonH(), body: JSON.stringify({ filename, content }) }).then(r => r.json()),
  mibDelete: (filename) => fetch(`${API}/mibs/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  fritzPresets: ()    => fetch(`${API}/fritz/presets`).then(r => r.json()),
  fritzCatalog: ()    => fetch(`${API}/fritz/catalog`).then(r => r.json()),
  fritzTest: (device) => fetch(`${API}/fritz/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  avrPresets: ()      => fetch(`${API}/avr/presets`).then(r => r.json()),
  avrCatalog: ()      => fetch(`${API}/avr/catalog`).then(r => r.json()),
  avrTest: (device)   => fetch(`${API}/avr/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  huePresets: ()      => fetch(`${API}/hue/presets`).then(r => r.json()),
  hueSummaryCatalog: () => fetch(`${API}/hue/summary-catalog`).then(r => r.json()),
  hueDiscover: (host, token, port, tls) => fetch(`${API}/hue/discover`, { method: 'POST', headers: jsonH(), body: JSON.stringify({ host, token, port, tls }) }).then(r => r.json()),
  hueTest: (device)   => fetch(`${API}/hue/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  saltPresets: ()     => fetch(`${API}/salt/presets`).then(r => r.json()),
  saltCatalog: ()     => fetch(`${API}/salt/catalog`).then(r => r.json()),
  saltTest: (device)  => fetch(`${API}/salt/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  echoPresets: ()     => fetch(`${API}/echo/presets`).then(r => r.json()),
  echoCatalog: ()     => fetch(`${API}/echo/catalog`).then(r => r.json()),
  shieldPresets: ()   => fetch(`${API}/shield/presets`).then(r => r.json()),
  shieldCatalog: ()   => fetch(`${API}/shield/catalog`).then(r => r.json()),
  shieldTest: (device) => fetch(`${API}/shield/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  echoAuthStart: (region, sessionId, proxyPort, deviceId) => fetch(`${API}/echo/auth-start`, { method: 'POST', headers: jsonH(), body: JSON.stringify({ region, sessionId, proxyPort, deviceId, serverHost: window.location.hostname }) }).then(r => r.json()),
  echoAuthPoll: (sessionId) => fetch(`${API}/echo/auth-poll/${sessionId}`).then(r => r.json()),
  echoLastAuth: () => fetch(`${API}/echo/last-auth`).then(r => r.json()),
  echoTest: (device)  => fetch(`${API}/echo/test`, { method: 'POST', headers: jsonH(), body: JSON.stringify(device) }).then(r => r.json()),
  standardMappings: () => fetch(`${API}/mappings/standards`).then(r => r.json()),
};
const jsonH = () => ({ 'Content-Type': 'application/json' });

// =====================================================================
// Utilities
// =====================================================================
const fmtAgo = (ts) => {
  if (!ts) return '—';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'eben';
  if (s < 60) return `vor ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m}m`;
  const h = Math.round(m / 60);
  return `vor ${h}h`;
};
const fmtUptime = (sec) => {
  if (!sec) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
const fmtMem = (kb) => {
  if (!kb) return '—';
  const mb = kb / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
};
const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, children = []) => {
  const e = document.createElement(tag);
  Object.assign(e, props);
  if (props.className) e.className = props.className;
  children.forEach((c) => typeof c === 'string' ? e.append(c) : e.append(c));
  return e;
};

// =====================================================================
// Render
// =====================================================================

function renderTypeOptions() {
  const typeFilter = $('#typeFilter');
  const typeSelect = $('#typeSelect');
  typeFilter.innerHTML = '<option value="all">Alle</option>';
  typeSelect.innerHTML = '';
  for (const [k, v] of Object.entries(DEVICE_TYPES)) {
    typeFilter.append(new Option(v.label, k));
    typeSelect.append(new Option(v.label, k));
  }
}

function renderStats() {
  const stats = state.devices.reduce(
    (a, d) => {
      if (!d.enabled) { a.paused++; return a; }
      const s = state.results[d.id]?.status || 'checking';
      if (s === 'online') a.online++;
      else if (s === 'offline') a.offline++;
      else a.checking++;
      return a;
    },
    { online: 0, offline: 0, checking: 0, paused: 0 }
  );
  const lats = Object.values(state.results).map(r => r?.latency).filter(x => typeof x === 'number');
  const avg = lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : null;

  $('#stats').innerHTML = `
    <div class="stat-card online">
      <div class="label">Online</div>
      <div class="value">${stats.online}</div>
      <div class="sub">von ${state.devices.length} Geräten</div>
    </div>
    <div class="stat-card offline">
      <div class="label">Offline</div>
      <div class="value">${stats.offline}</div>
      <div class="sub">${stats.offline > 0 ? 'Problem erkannt' : 'keine Probleme'}</div>
    </div>
    <div class="stat-card warn">
      <div class="label">Prüfung</div>
      <div class="value">${stats.checking + stats.paused}</div>
      <div class="sub">${stats.paused} pausiert</div>
    </div>
    <div class="stat-card info">
      <div class="label">Latenz</div>
      <div class="value">${avg != null ? avg : '—'}</div>
      <div class="sub">${avg != null ? 'ms Ø' : 'keine Daten'}</div>
    </div>
  `;
}

function deviceCardHTML(d) {
  const typeDef = DEVICE_TYPES[d.type] || DEVICE_TYPES.other;
  const status = !d.enabled ? 'unknown' : (state.results[d.id]?.status || 'checking');
  const r = state.results[d.id];

  const method = d.method || 'http';
  let methodTag = `${method.toUpperCase()}`;
  if (method === 'http') methodTag = `${(d.protocol || 'http').toUpperCase()}`;
  if (method === 'snmp') methodTag = `SNMP ${d.snmp?.version || '2c'}`;
  if (method === 'fritzbox') methodTag = 'FRITZ!Box';
  if (method === 'avr')      methodTag = 'AVR';
  if (method === 'hue')      methodTag = 'Hue';
  if (method === 'salt')     methodTag = 'Salt';
  if (method === 'echo')     methodTag = 'Alexa';

  const metricsHTML = buildMetricsHTML(r);
  const sparkHTML   = buildSparklineHTML(d.id);

  return `
    <div class="device ${status} ${!d.enabled ? 'disabled' : ''}" data-id="${d.id}" draggable="true">
      <div class="device-hover-actions">
        <button class="recheck" data-action="recheck" title="Jetzt prüfen">${svg('refresh', 14, 2)}</button>
        <button class="toggle"  data-action="toggle"  title="${d.enabled ? 'Pausieren' : 'Aktivieren'}">${svg('zap', 14, 2)}</button>
        <button class="edit"    data-action="edit"    title="Bearbeiten">${svg('pencil', 14, 2)}</button>
        <button class="del"     data-action="delete"  title="Löschen">${svg('trash', 14, 2)}</button>
      </div>

      <div class="device-head">
        <div class="device-title">
          <div class="device-icon ac-${typeDef.accent}">${svg(typeDef.iconId, 20, 1.6)}</div>
          <div>
            <div class="device-name">${escapeHTML(d.name)}</div>
            <div class="device-type">${typeDef.label}</div>
          </div>
        </div>
        <div class="dot-wrap ${status}">
          <div class="dot-core"></div>
          ${status === 'online' ? '<div class="dot-ping"></div>' : ''}
        </div>
      </div>

      <div class="info-rows">
        <div class="info-row"><span class="k">Host</span><span class="v">${escapeHTML(d.host || '—')}</span></div>
        <div class="info-row"><span class="k">Port</span><span class="v">${d.port || '—'}</span></div>
        <div class="info-row"><span class="k">Check</span><span class="v">${methodTag}</span></div>
      </div>

      ${metricsHTML}
      ${sparkHTML}

      <div class="device-foot">
        <div>
          <span class="status-label ${status}">${statusText(status)}</span>
          ${r?.latency != null ? `<span class="latency">${r.latency}ms</span>` : ''}
        </div>
        <div class="updated">${svgClockInline()}${fmtAgo(r?.at)}</div>
      </div>
    </div>
  `;
}

function buildSparklineHTML(id) {
  const pts = state.history[id] || [];
  const lats = pts.map(p => p.l).filter(x => typeof x === 'number');
  if (lats.length < 2) return '';

  const W = 280, H = 32;
  const max = Math.max(...lats, 10);
  const min = Math.min(...lats, 0);
  const range = Math.max(1, max - min);

  const stepX = W / (pts.length - 1 || 1);
  let path = '';
  let area = '';
  pts.forEach((p, i) => {
    const x = i * stepX;
    if (p.s !== 'online' || p.l == null) {
      // break line on offline points
      path += ` M ${x.toFixed(1)} ${H}`;
      return;
    }
    const y = H - ((p.l - min) / range) * (H - 4) - 2;
    if (path === '' || path.endsWith(`${H}`)) {
      path += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
      if (!area) area += `M ${x.toFixed(1)} ${H} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      area += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  if (area) area += ` L ${(W).toFixed(1)} ${H} Z`;

  const recent = pts[pts.length - 1];
  const recentL = recent?.l != null ? `${recent.l}ms` : '—';

  return `
    <div class="sparkline">
      <div class="sparkline-label">
        <span>Latenz · ${pts.length} pts</span>
        <span>${min}–${max}ms · zuletzt ${recentL}</span>
      </div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-g-${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="currentColor" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${area ? `<path d="${area}" fill="url(#spark-g-${id})" stroke="none"/>` : ''}
        <path d="${path.trim()}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

function buildMetricsHTML(r) {
  const m = r?.metrics;
  if (!Array.isArray(m) || !m.length) {
    // Legacy HTTP check returns { httpStatus }
    if (r?.metrics?.httpStatus != null) {
      return `<div class="metrics">${metricBlock('HTTP', String(r.metrics.httpStatus))}</div>`;
    }
    return '';
  }

  // Dynamic SNMP metrics; render up to the first 6 with meaningful values.
  const shown = m.filter(x => x.value != null && x.value !== '').slice(0, 6);
  if (!shown.length) return '';

  const parts = shown.map(mt => {
    const fmt = formatMetricValue(mt.value, mt.format);
    if (mt.format === 'percent' && typeof mt.value === 'number') {
      const pct = Math.max(0, Math.min(100, Math.round(mt.value)));
      const cls = pct > 85 ? 'bad' : (pct > 70 ? 'warn' : '');
      return `
        <div class="metric">
          <div class="mlabel">${escapeHTML(mt.label)}</div>
          <div class="mval">${fmt}</div>
          <div class="bar"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
        </div>`;
    }
    return metricBlock(mt.label, fmt);
  });
  return `<div class="metrics">${parts.join('')}</div>`;
}

function formatMetricValue(value, format) {
  if (value == null) return '—';
  switch (format) {
    case 'uptime':  return fmtUptimeTicks(value);
    case 'seconds': return fmtUptime(Number(value));
    case 'percent': return `${(+value).toFixed(1)}%`;
    case 'bytes':   return fmtBytes(value);
    case 'kbytes':  return fmtBytes(Number(value) * 1024);
    case 'bps':     return fmtBitrate(value);
    case 'db':      return `${(+value).toFixed(1)} dB`;
    case 'bool':    return escapeHTML(String(value));
    case 'celsius': return `${value}°C`;
    case 'float':   return (+value).toFixed(2);
    case 'int':     return String(Math.round(value));
    case 'text':
    default:        return escapeHTML(String(value));
  }
}

function fmtBitrate(bps) {
  const n = Number(bps);
  if (!isFinite(n) || n < 0) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Gbit/s`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} Mbit/s`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kbit/s`;
  return `${Math.round(n)} bit/s`;
}

function fmtUptimeTicks(ticks) {
  if (!ticks) return '—';
  // sysUpTime is in 1/100 seconds (TimeTicks)
  const seconds = typeof ticks === 'number' ? Math.round(ticks / 100) : Number(ticks);
  if (!isFinite(seconds) || seconds <= 0) return '—';
  return fmtUptime(seconds);
}

function fmtBytes(bytes) {
  if (bytes == null) return '—';
  const n = Number(bytes);
  if (!isFinite(n)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function metricBlock(label, value) {
  return `<div class="metric"><div class="mlabel">${label}</div><div class="mval">${value}</div></div>`;
}

function svgClockInline() {
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
}

function statusText(s) {
  return { online: 'ONLINE', offline: 'OFFLINE', checking: 'PRÜFE…', unknown: 'UNBEKANNT' }[s];
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderGrid() {
  const filtered = state.devices.filter(d => {
    if (state.typeFilter !== 'all' && d.type !== state.typeFilter) return false;
    const st = !d.enabled ? 'unknown' : (state.results[d.id]?.status || 'checking');
    if (state.statusFilter !== 'all' && st !== state.statusFilter) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !(d.host || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grid = $('#grid');
  if (!filtered.length) {
    grid.outerHTML = '<section id="grid" class="empty"><p>Keine Geräte gefunden.</p><p class="hint">Passe die Filter an oder füge ein Gerät hinzu.</p></section>';
    return;
  }

  grid.className = 'grid';
  grid.innerHTML = filtered.map(deviceCardHTML).join('');
  wireDragDrop();
}

// =====================================================================
// Drag & Drop reordering
// =====================================================================
let dragSrcId = null;
let justDragged = false;

function wireDragDrop() {
  const cards = document.querySelectorAll('.device[draggable="true"]');

  cards.forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      // Don't start drag on action buttons or interactive elements inside the card
      if (e.target.closest('.device-hover-actions, button, a, input')) {
        e.preventDefault();
        return;
      }
      dragSrcId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragSrcId); } catch {}
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.device.drop-before, .device.drop-after')
        .forEach(c => c.classList.remove('drop-before', 'drop-after'));
      dragSrcId = null;
      // Suppress the synthetic click event that some browsers fire after drop,
      // so the detail-modal doesn't open right after reordering.
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 200);
    });

    card.addEventListener('dragover', (e) => {
      if (!dragSrcId || card.dataset.id === dragSrcId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = card.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      card.classList.toggle('drop-before',  before);
      card.classList.toggle('drop-after',  !before);
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drop-before', 'drop-after');
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = card.dataset.id;
      const before   = card.classList.contains('drop-before');
      card.classList.remove('drop-before', 'drop-after');
      if (!dragSrcId || dragSrcId === targetId) return;
      await reorderDevice(dragSrcId, targetId, before);
    });
  });
}

async function reorderDevice(srcId, targetId, before) {
  // Reorder state.devices and persist
  const ids = state.devices.map(d => d.id);
  const fromIdx = ids.indexOf(srcId);
  const toIdx   = ids.indexOf(targetId);
  if (fromIdx < 0 || toIdx < 0) return;

  const [moved] = state.devices.splice(fromIdx, 1);
  // Re-resolve target index since the array shifted after splice
  const newTargetIdx = state.devices.findIndex(d => d.id === targetId);
  const insertAt = before ? newTargetIdx : newTargetIdx + 1;
  state.devices.splice(insertAt, 0, moved);

  render();

  // Persist on the server
  try {
    await api.reorderDevices(state.devices.map(d => d.id));
  } catch (err) {
    console.error('reorder failed', err);
    toast('Reihenfolge konnte nicht gespeichert werden', 'error');
  }
}

function renderFooter() {
  const s = state.settings;
  $('#footer').innerHTML = `
    <span>Intervall: ${s.interval}s · Timeout: ${s.timeout}s · Auto-Refresh: ${s.autoRefresh ? 'AN' : 'AUS'}</span>
    <span>${state.devices.length} Geräte konfiguriert</span>
  `;
}

function render() {
  renderStats();
  renderGrid();
  renderFooter();
}

// =====================================================================
// Checks
// =====================================================================
async function runChecks() {
  if (state.checking) return;
  state.checking = true;
  // No more "checking" flicker: the server returns cached results instantly,
  // so the previous result stays visible until the new one arrives.
  try {
    const results = await api.checkAll();
    results.forEach(r => { state.results[r.id] = r; });
    try {
      const hist = await api.historyAll(60);
      state.history = hist;
    } catch {}
  } catch (err) {
    console.error('check-all failed', err);
  } finally {
    state.checking = false;
    render();
  }
}

async function recheckOne(id) {
  const d = state.devices.find(x => x.id === id);
  if (!d || !d.enabled) return;
  state.results[id] = { ...(state.results[id] || {}), status: 'checking' };
  render();
  try {
    const res = await api.checkOne(id);
    state.results[id] = res;
    // append to local history buffer
    if (!state.history[id]) state.history[id] = [];
    state.history[id].push({
      t: res.at, s: res.status, l: res.latency ?? null,
      mem: res.metrics?.memory?.usagePct ?? null,
      load: res.metrics?.load?.one ?? null
    });
    if (state.history[id].length > 60) state.history[id] = state.history[id].slice(-60);
  } catch (err) {
    state.results[id] = { status: 'offline', latency: null, at: Date.now(), error: String(err) };
  }
  render();
}

function scheduleAutoRefresh() {
  if (state.timer) clearInterval(state.timer);
  if (!state.settings.autoRefresh) return;
  state.timer = setInterval(runChecks, Math.max(5, state.settings.interval) * 1000);
}

// =====================================================================
// Modals
// =====================================================================
let editingId = null;

function openDeviceModal(device = null) {
  editingId = device?.id || null;
  const form = $('#deviceForm');
  form.reset();
  $('#deviceModalTitle').textContent = device ? 'Gerät bearbeiten' : 'Gerät hinzufügen';

  // Show delete button only in edit mode
  $('#btnDeleteDevice').hidden = !device;

  const defaults = device || { type: 'other', method: 'http', protocol: 'http', enabled: true, snmp: state.settings.defaultSnmp };
  form.name.value = defaults.name || '';
  form.host.value = defaults.host || '';
  form.port.value = defaults.port || '';
  form.type.value = defaults.type || 'other';
  form.method.value = defaults.method || 'http';
  form.protocol.value = defaults.protocol || 'http';
  const s = defaults.snmp || {};
  form['snmp.community'].value    = s.community || state.settings.defaultSnmp?.community || 'public';
  form['snmp.version'].value      = s.version || state.settings.defaultSnmp?.version || '2c';
  form['snmp.port'].value         = s.port || state.settings.defaultSnmp?.port || 161;
  form['snmp.user'].value         = s.user || '';
  form['snmp.authProtocol'].value = s.authProtocol || 'sha';
  form['snmp.authKey'].value      = s.authKey || '';
  form['snmp.privKey'].value      = s.privKey || '';
  form['snmp.privProtocol'].value = s.privProtocol || 'aes';

  // Init metrics editor
  draftMetrics = Array.isArray(s.metrics) ? JSON.parse(JSON.stringify(s.metrics)) : [];
  renderMetricsList();
  renderPresetOptions();
  $('#walkResults').hidden = true;
  $('#walkResults').innerHTML = '';

  // Init rules editor
  draftRules = Array.isArray(defaults.notificationRules)
    ? JSON.parse(JSON.stringify(defaults.notificationRules))
    : [];
  renderRulesList();

  // Init FritzBox editor
  const fritz = defaults.fritz || {};
  form['fritz.username'].value = fritz.username || '';
  form['fritz.password'].value = fritz.password || '';
  draftFritzMetrics = Array.isArray(fritz.metrics) ? [...fritz.metrics] : [];
  renderFritzPresetOptions();
  renderFritzMetricsList();
  $('#fritzTestResult').hidden = true;

  // Init AVR editor
  const avr = defaults.avr || {};
  form['avr.port'].value = avr.port || '';
  draftAvrMetrics = Array.isArray(avr.metrics) ? [...avr.metrics] : [];
  renderAvrPresetOptions();
  renderAvrMetricsList();
  $('#avrTestResult').hidden = true;

  // Init Hue editor
  const hue = defaults.hue || {};
  form['hue.token'].value = hue.token || '';
  form['hue.port'].value = hue.port || '';
  form['hue.tls'].checked = hue.tls !== false;   // default ON
  draftHueSummaryKeys = Array.isArray(hue.summaryKeys) ? [...hue.summaryKeys] : [];
  draftHueItems = Array.isArray(hue.items) ? JSON.parse(JSON.stringify(hue.items)) : [];
  state.hueDiscoveredItems = [];
  renderHuePresetOptions();
  renderHueSummaryList();
  renderHueItemsList();
  $('#hueTestResult').hidden = true;

  // Init Salt editor
  const salt = defaults.salt || {};
  form['salt.port'].value = salt.port || '';
  form['salt.tls'].checked = salt.tls !== false;
  draftSaltMetrics = Array.isArray(salt.metrics) ? [...salt.metrics] : [];
  renderSaltPresetOptions();
  renderSaltMetricsList();
  $('#saltTestResult').hidden = true;

  // Init Echo editor
  const echo = defaults.echo || {};
  form['echo.cookie'].value = echo.cookie || '';   // hidden input
  form['echo.region'].value = echo.region || 'de';
  form['echo.serial'].value = echo.serial || '';
  draftEchoMetrics = Array.isArray(echo.metrics) ? [...echo.metrics] : [];
  renderEchoPresetOptions();
  renderEchoMetricsList();

  // Init Shield editor
  const shield = defaults.shield || {};
  form['shield.port'].value = shield.port || '';
  draftShieldMetrics = Array.isArray(shield.metrics) ? [...shield.metrics] : [];
  renderShieldPresetOptions();
  renderShieldMetricsList();
  $('#shieldTestResult').hidden = true;
  $('#echoTestResult').hidden = true;
  $('#echoDiscoveredList').hidden = true;
  updateEchoAuthStatus(!!echo.cookie);

  // If no cookie stored, check if server has a recent auth result (e.g. poll was missed)
  if (!echo.cookie) {
    api.echoLastAuth().then(r => {
      if (!r.available) return;
      form['echo.cookie'].value = r.cookie;
      if (r.region) form['echo.region'].value = r.region;
      updateEchoAuthStatus(true);
      if (r.devices?.length) renderEchoDeviceList(r.devices, form);
      toast('Gespeicherter Amazon-Login geladen', 'ok');
    }).catch(() => {});
  }

  // Init mappings editor: convert object form to array form for editing
  draftMappings = [];
  const mObj = defaults.metricMappings || {};
  for (const [metricKey, pairs] of Object.entries(mObj)) {
    if (!pairs || typeof pairs !== 'object') continue;
    draftMappings.push({
      metricKey,
      pairs: Object.entries(pairs).map(([from, to]) => ({ from, to })),
    });
  }
  renderMappingsList();

  updateMethodVisibility();
  $('#deviceModal').hidden = false;
}

function renderPresetOptions() {
  const sel = $('#presetSelect');
  if (sel) {
    sel.innerHTML = '<option value="">Preset einfügen…</option>' +
      state.presets.map(p => `<option value="${p.id}">${escapeHTML(p.label)}</option>`).join('');
  }
  // MIB metrics dropdown: grouped by module
  const mibSel = $('#mibSelect');
  if (mibSel) {
    const groups = [];
    for (const mib of state.mibs) {
      if (mib.error || !mib.modules) continue;
      for (const mod of mib.modules) {
        if (!mod.metrics?.length) continue;
        const opts = mod.metrics.map((m, idx) =>
          `<option value="${mib.filename}|${mod.name}|${idx}">${escapeHTML(m.key)} — ${escapeHTML(m.label).slice(0, 40)}</option>`
        ).join('');
        groups.push(`<optgroup label="${escapeHTML(mod.name)} (${mib.filename})">${opts}</optgroup>`);
      }
    }
    mibSel.innerHTML = '<option value="">MIB-Metrik einfügen…</option>' + groups.join('');
  }
}

function renderMetricsList() {
  const list = $('#metricsList');
  list.innerHTML = draftMetrics.map((m, i) => `
    <div class="metric-row" data-idx="${i}">
      <span class="mr-handle">${i + 1}</span>
      <div class="mr-fields">
        <input placeholder="Label" data-k="label" value="${escapeHTML(m.label || '')}" />
        <input placeholder="OID (z.B. 1.3.6.1.2.1.1.3.0)" data-k="oid" value="${escapeHTML(m.oid || '')}" />
        <select data-k="format">
          ${['text','uptime','seconds','percent','bytes','kbytes','bps','celsius','db','float','int','bool']
            .map(f => `<option value="${f}" ${m.format === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <input placeholder="key" data-k="key" value="${escapeHTML(m.key || '')}" style="max-width:90px" />
      <button type="button" class="mr-del" data-action="del-metric" title="Entfernen">×</button>
    </div>
  `).join('');

  // wire inputs
  list.querySelectorAll('.metric-row').forEach(row => {
    const idx = Number(row.dataset.idx);
    row.querySelectorAll('[data-k]').forEach(inp => {
      inp.addEventListener('input', (e) => {
        draftMetrics[idx][e.target.dataset.k] = e.target.value;
      });
    });
    row.querySelector('[data-action="del-metric"]').addEventListener('click', () => {
      draftMetrics.splice(idx, 1);
      renderMetricsList();
    });
  });
}

function addCustomMetric() {
  const n = draftMetrics.length + 1;
  draftMetrics.push({ key: `metric${n}`, label: `Metrik ${n}`, oid: '', format: 'text' });
  renderMetricsList();
}

function applyPreset() {
  const id = $('#presetSelect').value;
  if (!id) return;
  const preset = state.presets.find(p => p.id === id);
  if (!preset) return;
  const existingKeys = new Set(draftMetrics.map(m => m.key));
  for (const m of preset.metrics) {
    let key = m.key;
    let i = 2;
    while (existingKeys.has(key)) key = `${m.key}_${i++}`;
    existingKeys.add(key);
    draftMetrics.push({ ...m, key });
  }
  renderMetricsList();
  $('#presetSelect').value = '';
}

// =====================================================================
// Per-device notification rules editor
// =====================================================================

function renderRulesList() {
  const list = $('#rulesList');
  if (!list) return;

  const channels = state.settings.notifications || [];
  if (!channels.length) {
    list.innerHTML = `<p class="rule-no-channels">⚠️ Keine Channels verfügbar. Erst unter Einstellungen → Benachrichtigungen einen Channel anlegen.</p>`;
    return;
  }

  list.innerHTML = draftRules.map((r, i) => renderRuleRow(r, i, channels)).join('');

  // Wire up form change events
  list.querySelectorAll('.rule-row').forEach((row, idx) => {
    row.querySelectorAll('[data-r-key]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.rKey;
        let val;
        if (input.type === 'checkbox') val = input.checked;
        else if (input.type === 'number') val = Number(input.value);
        else val = input.value;
        draftRules[idx][key] = val;
        // event-type changed → re-render this row to swap in/out the threshold line
        if (key === 'event') renderRulesList();
      });
    });
    row.querySelector('.rule-del').addEventListener('click', () => {
      draftRules.splice(idx, 1);
      renderRulesList();
    });
  });
}

// All formats that produce numeric values usable for threshold comparison.
// Note: 'db' (AVR volume) and 'bps' (FRITZ bandwidth) are also numeric even
// though they get a unit-suffix when displayed.
const NUMERIC_FORMATS = new Set([
  'percent', 'int', 'float', 'celsius',
  'bytes', 'kbytes',
  'db', 'bps', 'seconds', 'uptime',
]);

// Collect numeric metrics from whichever source applies to the currently
// edited device's check method. Returns [{ key, label }, ...].
function collectNumericMetricsForCurrentDevice() {
  const method = $('#deviceForm')?.method?.value || 'http';
  const out = [];

  // SNMP / TCP / HTTP — user-defined custom metrics in draftMetrics
  if (method === 'snmp' || method === 'http' || method === 'tcp') {
    for (const m of draftMetrics) {
      if (m.key && NUMERIC_FORMATS.has(m.format)) out.push({ key: m.key, label: m.label || m.key });
    }
  }

  // FRITZ!Box — selected keys filtered through the catalogue
  if (method === 'fritzbox') {
    for (const key of draftFritzMetrics) {
      const def = state.fritzCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }

  // Denon/Marantz AVR
  if (method === 'avr') {
    for (const key of draftAvrMetrics) {
      const def = state.avrCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }

  // Philips Hue — summary metrics only. Per-item metric keys are dynamically
  // generated (e.g. "light_1_bri") and not known until a check has run, so
  // threshold rules on them have to be set up manually via the metric-key
  // field in raw form.
  if (method === 'hue') {
    for (const key of draftHueSummaryKeys) {
      const def = state.hueSummaryCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }

  // Salt Fiber Box
  if (method === 'salt') {
    for (const key of draftSaltMetrics) {
      const def = state.saltCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }

  // Amazon Echo
  if (method === 'echo') {
    for (const key of draftEchoMetrics) {
      const def = state.echoCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }
  // NVIDIA Shield
  if (method === 'adb') {
    for (const key of draftShieldMetrics) {
      const def = state.shieldCatalog.find(c => c.key === key);
      if (def && NUMERIC_FORMATS.has(def.format)) out.push({ key, label: def.label });
    }
  }

  return out;
}

function renderRuleRow(rule, idx, channels) {
  const channelOpts = channels.map(c =>
    `<option value="${c.id}" ${rule.channelId === c.id ? 'selected' : ''}>${escapeHTML(c.name)} (${c.type})</option>`
  ).join('');

  const events = [
    ['device.offline',    'wenn Gerät offline geht'],
    ['device.online',     'wenn Gerät wieder online ist'],
    ['metric.threshold',  'wenn Metrik einen Schwellwert über-/unterschreitet'],
  ];
  const eventOpts = events.map(([v, label]) =>
    `<option value="${v}" ${rule.event === v ? 'selected' : ''}>${label}</option>`
  ).join('');

  let thresholdLine = '';
  if (rule.event === 'metric.threshold') {
    // Metric options come from the currently-edited device. Different check
    // methods source their metrics differently — SNMP from draftMetrics,
    // FRITZ/AVR/Salt/Hue from their respective catalogues filtered by what
    // the user has selected.
    const numericMetrics = collectNumericMetricsForCurrentDevice();
    const metricOpts = numericMetrics.length
      ? numericMetrics.map(m =>
          `<option value="${m.key}" ${rule.metricKey === m.key ? 'selected' : ''}>${escapeHTML(m.label || m.key)}</option>`
        ).join('')
      : '<option value="">(keine numerischen Metriken konfiguriert)</option>';

    const ops = ['>', '>=', '<', '<=', '==', '!='];
    const opOpts = ops.map(o => `<option value="${o}" ${rule.op === o ? 'selected' : ''}>${o}</option>`).join('');

    thresholdLine = `
      <div class="rule-line threshold-line">
        <select data-r-key="metricKey">${metricOpts}</select>
        <select data-r-key="op">${opOpts}</select>
        <input type="number" data-r-key="threshold" value="${rule.threshold ?? ''}" placeholder="Schwellwert" step="any" title="Schwellwert für den Vergleich" />
        <input type="number" data-r-key="durationSec" value="${rule.durationSec || ''}" placeholder="Dauer (s)" min="0" title="Mindestdauer in Sekunden, die die Bedingung anhalten muss (0 oder leer = sofort)" />
      </div>`;
  }

  const enabled = rule.enabled !== false;
  return `
    <div class="rule-row">
      <div class="rule-line">
        <select data-r-key="event">${eventOpts}</select>
        <select data-r-key="channelId"><option value="">— Channel —</option>${channelOpts}</select>
        <button type="button" class="rule-del" title="Regel entfernen">×</button>
      </div>
      ${thresholdLine}
      <div class="rule-foot">
        <label><input type="checkbox" data-r-key="enabled" ${enabled ? 'checked' : ''}/> Aktiv</label>
        <label>Cooldown: <input type="number" data-r-key="cooldownMinutes" value="${rule.cooldownMinutes ?? 5}" min="0" max="1440" /> Min</label>
      </div>
    </div>`;
}

function addRule() {
  if (!(state.settings.notifications || []).length) {
    toast('Bitte erst einen Notification-Channel in den Einstellungen anlegen.', 'error');
    return;
  }
  draftRules.push({
    id: 'r_' + Math.random().toString(36).slice(2, 8),
    event: 'device.offline',
    channelId: state.settings.notifications[0]?.id || '',
    enabled: true,
    cooldownMinutes: 5,
  });
  renderRulesList();
}

// =====================================================================
// Value mappings editor
// =====================================================================

function renderMappingsList() {
  const list = $('#mappingsList');
  if (!list) return;

  list.innerHTML = draftMappings.map((m, i) => renderMappingRow(m, i)).join('');

  list.querySelectorAll('.mapping-row').forEach((row, idx) => {
    // metric key input
    const keyInput = row.querySelector('[data-m-key]');
    if (keyInput) {
      keyInput.addEventListener('input', () => {
        draftMappings[idx].metricKey = keyInput.value.trim();
      });
    }

    // standard preset selector
    const presetSel = row.querySelector('[data-m-preset]');
    if (presetSel) {
      presetSel.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) return;
        const std = state.standardMappings.find(s => s.id === id);
        if (std?.mapping) {
          draftMappings[idx].pairs = Object.entries(std.mapping).map(([from, to]) => ({ from, to }));
          renderMappingsList();
        }
        e.target.value = '';
      });
    }

    // pair inputs
    row.querySelectorAll('.mapping-pair').forEach((pair, pIdx) => {
      pair.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', () => {
          if (!draftMappings[idx].pairs[pIdx]) return;
          draftMappings[idx].pairs[pIdx][inp.dataset.pField] = inp.value;
        });
      });
      pair.querySelector('.mapping-pair-del').addEventListener('click', () => {
        draftMappings[idx].pairs.splice(pIdx, 1);
        renderMappingsList();
      });
    });

    // add pair button
    const addBtn = row.querySelector('[data-m-action="add-pair"]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        draftMappings[idx].pairs.push({ from: '', to: '' });
        renderMappingsList();
      });
    }

    // delete mapping button
    row.querySelector('.rule-del').addEventListener('click', () => {
      draftMappings.splice(idx, 1);
      renderMappingsList();
    });
  });
}

function renderMappingRow(m, idx) {
  const presetOpts = state.standardMappings.map(s =>
    `<option value="${s.id}">${escapeHTML(s.label)}</option>`
  ).join('');

  const pairsHtml = (m.pairs || []).map((p, i) => `
    <div class="mapping-pair">
      <input data-p-field="from" placeholder="Wert" value="${escapeHTML(String(p.from ?? ''))}" />
      <input data-p-field="to"   placeholder="→ Text" value="${escapeHTML(String(p.to ?? ''))}" />
      <button type="button" class="mapping-pair-del" title="Zeile entfernen">×</button>
    </div>
  `).join('');

  return `
    <div class="mapping-row">
      <div class="mapping-head">
        <input data-m-key placeholder="Metric-Key (z.B. printerStatus)" value="${escapeHTML(m.metricKey || '')}" />
        <select data-m-preset>
          <option value="">Standard-Mapping…</option>
          ${presetOpts}
        </select>
        <button type="button" class="rule-del" title="Mapping löschen">×</button>
      </div>
      <div class="mapping-pairs">
        ${pairsHtml || '<p style="font-size:11px;color:var(--text-4);text-align:center;padding:6px">— keine Werte —</p>'}
      </div>
      <div class="mapping-actions">
        <button type="button" class="btn btn-ghost btn-xs" data-m-action="add-pair">+ Wert</button>
      </div>
    </div>`;
}

function addMapping() {
  draftMappings.push({
    metricKey: '',
    pairs: [{ from: '', to: '' }],
  });
  renderMappingsList();
}

// Convert array-form mappings to the object-form expected by the server.
// Drops empty entries to avoid garbage.
function serializeMappings(mappings) {
  const out = {};
  for (const m of mappings) {
    if (!m.metricKey) continue;
    const pairs = (m.pairs || []).filter(p => p.from !== '' && p.to !== '');
    if (!pairs.length) continue;
    out[m.metricKey] = Object.fromEntries(pairs.map(p => [String(p.from), String(p.to)]));
  }
  return out;
}

// =====================================================================
// FRITZ!Box editor
// =====================================================================

function renderFritzPresetOptions() {
  const sel = $('#fritzPresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.fritzPresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderFritzMetricsList() {
  const list = $('#fritzMetricsList');
  if (!list) return;
  if (!state.fritzCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.fritzCatalog.map(m => {
    const selected = draftFritzMetrics.includes(m.key);
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-fritz-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        ${m.requiresAuth ? '<span class="lock" title="Login erforderlich">🔒</span>' : ''}
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('input[data-fritz-key]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.fritzKey;
      if (e.target.checked) {
        if (!draftFritzMetrics.includes(key)) draftFritzMetrics.push(key);
      } else {
        draftFritzMetrics = draftFritzMetrics.filter(k => k !== key);
      }
      // toggle selected class on parent pill
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

function applyFritzPreset() {
  const id = $('#fritzPresetSelect').value;
  if (!id) return;
  const preset = state.fritzPresets.find(p => p.id === id);
  if (!preset) return;
  // Replace selection with preset (additive feels confusing here)
  draftFritzMetrics = [...preset.keys];
  renderFritzMetricsList();
  renderRulesList();
  $('#fritzPresetSelect').value = '';
}

async function testFritzConnection() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  if (!host) { toast('Bitte zuerst Host/IP angeben', 'error'); return; }
  if (!draftFritzMetrics.length) {
    toast('Bitte erst Metriken auswählen oder Preset anwenden', 'error');
    return;
  }

  const result = $('#fritzTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Teste Verbindung…</span></div>';

  const device = {
    host,
    fritz: {
      username: form['fritz.username'].value,
      password: form['fritz.password'].value,
      metrics:  draftFritzMetrics,
    }
  };

  try {
    const res = await api.fritzTest(device);
    if (res.status === 'online' && Array.isArray(res.metrics)) {
      result.className = 'fritz-test-result ok';
      const rows = res.metrics.map(m => `
        <div class="row">
          <span class="k">${escapeHTML(m.label)}</span>
          <span class="v">${m.value != null ? formatMetricValue(m.value, m.format) : '<em style="color:var(--text-4)">—</em>'}</span>
        </div>
      `).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms)</span></div>${rows}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || 'unbekannt')}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

// =====================================================================
// Denon / Marantz AVR editor
// =====================================================================

function renderAvrPresetOptions() {
  const sel = $('#avrPresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.avrPresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderAvrMetricsList() {
  const list = $('#avrMetricsList');
  if (!list) return;
  if (!state.avrCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.avrCatalog.map(m => {
    const selected = draftAvrMetrics.includes(m.key);
    const zoneTag = m.endpoint === 'zone2' ? '<span class="meta">Zone 2</span>' : '';
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-avr-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        ${zoneTag}
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('input[data-avr-key]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.avrKey;
      if (e.target.checked) {
        if (!draftAvrMetrics.includes(key)) draftAvrMetrics.push(key);
      } else {
        draftAvrMetrics = draftAvrMetrics.filter(k => k !== key);
      }
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

function applyAvrPreset() {
  const id = $('#avrPresetSelect').value;
  if (!id) return;
  const preset = state.avrPresets.find(p => p.id === id);
  if (!preset) return;
  draftAvrMetrics = [...preset.keys];
  renderAvrMetricsList();
  renderRulesList();
  $('#avrPresetSelect').value = '';
}

async function testAvrConnection() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  if (!host) { toast('Bitte zuerst Host/IP angeben', 'error'); return; }
  if (!draftAvrMetrics.length) {
    toast('Bitte erst Metriken auswählen oder Preset anwenden', 'error');
    return;
  }

  const result = $('#avrTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Teste Verbindung…</span></div>';

  const device = {
    host,
    avr: {
      port:    form['avr.port'].value ? Number(form['avr.port'].value) : 8080,
      metrics: draftAvrMetrics,
    }
  };

  try {
    const res = await api.avrTest(device);
    if (res.status === 'online' && Array.isArray(res.metrics)) {
      result.className = 'fritz-test-result ok';
      const portInfo = res.detectedPort ? ` · Port ${res.detectedPort}` : '';
      const rows = res.metrics.map(m => `
        <div class="row">
          <span class="k">${escapeHTML(m.label)}</span>
          <span class="v">${m.value != null ? formatMetricValue(m.value, m.format) : '<em style="color:var(--text-4)">—</em>'}</span>
        </div>
      `).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms${portInfo})</span></div>${rows}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || 'unbekannt')}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

// =====================================================================
// Philips Hue editor
// =====================================================================

function renderHuePresetOptions() {
  const sel = $('#huePresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.huePresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderHueSummaryList() {
  const list = $('#hueSummaryList');
  if (!list) return;
  if (!state.hueSummaryCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.hueSummaryCatalog.map(m => {
    const selected = draftHueSummaryKeys.includes(m.key);
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-hue-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('input[data-hue-key]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.hueKey;
      if (e.target.checked) {
        if (!draftHueSummaryKeys.includes(key)) draftHueSummaryKeys.push(key);
      } else {
        draftHueSummaryKeys = draftHueSummaryKeys.filter(k => k !== key);
      }
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

const HUE_KIND_LABELS = {
  light:       { label: 'Lampen',                  icon: '💡' },
  group:       { label: 'Gruppen / Räume',         icon: '🏠' },
  switch:      { label: 'Schalter',                icon: '🎚' },
  presence:    { label: 'Bewegungsmelder',         icon: '👋' },
  temperature: { label: 'Temperatursensoren',      icon: '🌡' },
  lightlevel:  { label: 'Helligkeitssensoren',     icon: '☀️' },
  sensor:      { label: 'Sonstige Sensoren',       icon: '🔘' },
};
const HUE_KIND_ORDER = ['light', 'group', 'switch', 'presence', 'temperature', 'lightlevel', 'sensor'];

function renderHueItemsList() {
  const list = $('#hueItemsList');
  if (!list) return;

  if (!state.hueDiscoveredItems.length) {
    list.innerHTML = '<p class="hue-empty">Klicke "Geräte erkennen" um Lampen, Sensoren und Schalter aufzulisten.</p>';
    return;
  }

  // Build a key for dedup-comparison: kind|id
  const itemKey = (it) => `${it.kind}|${it.id}`;
  const selectedKeys = new Set(draftHueItems.map(itemKey));

  // Group discovered items by kind
  const byKind = new Map();
  for (const it of state.hueDiscoveredItems) {
    if (!byKind.has(it.kind)) byKind.set(it.kind, []);
    byKind.get(it.kind).push(it);
  }

  let html = '';
  for (const kind of HUE_KIND_ORDER) {
    const items = byKind.get(kind);
    if (!items?.length) continue;
    const meta = HUE_KIND_LABELS[kind] || { label: kind, icon: '•' };
    html += `<div class="hue-group-header">${meta.icon} ${escapeHTML(meta.label)} (${items.length})</div>`;
    for (const it of items) {
      const selected = selectedKeys.has(itemKey(it));
      const meta2 = it.modelid ? `<span class="hue-meta">${escapeHTML(it.modelid)}</span>` : '';
      html += `
        <label class="hue-item-pill ${selected ? 'selected' : ''}">
          <input type="checkbox" data-hue-item="${it.kind}|${it.id}" ${selected ? 'checked' : ''} hidden />
          <span class="hue-icon">${meta.icon}</span>
          <span class="hue-name">${escapeHTML(it.label)}</span>
          ${meta2}
        </label>`;
    }
  }

  list.innerHTML = html;

  list.querySelectorAll('input[data-hue-item]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const [kind, id] = e.target.dataset.hueItem.split('|');
      const k = `${kind}|${id}`;
      if (e.target.checked) {
        if (!draftHueItems.find(x => itemKey(x) === k)) {
          draftHueItems.push({ kind, id });
        }
      } else {
        draftHueItems = draftHueItems.filter(x => itemKey(x) !== k);
      }
      e.target.closest('.hue-item-pill').classList.toggle('selected', e.target.checked);
    });
  });
}

function applyHuePreset() {
  const id = $('#huePresetSelect').value;
  if (!id) return;
  const preset = state.huePresets.find(p => p.id === id);
  if (!preset) return;
  draftHueSummaryKeys = [...(preset.summaryKeys || [])];
  // Don't touch draftHueItems — presets only set summary keys
  renderHueSummaryList();
  renderRulesList();
  $('#huePresetSelect').value = '';
}

async function discoverHueDevices() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  const token = form['hue.token'].value.trim();
  const tls = form['hue.tls'].checked;
  const port = form['hue.port'].value ? Number(form['hue.port'].value) : (tls ? 443 : 80);

  if (!host)  { toast('Bitte zuerst Host/IP der Bridge angeben', 'error'); return; }
  if (!token) { toast('Bitte API-Token eingeben', 'error'); return; }

  const list = $('#hueItemsList');
  list.innerHTML = '<p class="hue-empty">Suche Geräte auf der Bridge…</p>';

  try {
    const res = await api.hueDiscover(host, token, port, tls);
    if (!res.ok) {
      list.innerHTML = `<p class="hue-empty" style="color:var(--offline)">✗ ${escapeHTML(res.error || 'unbekannter Fehler')}</p>`;
      return;
    }
    state.hueDiscoveredItems = Array.isArray(res.items) ? res.items : [];
    renderHueItemsList();
    if (!state.hueDiscoveredItems.length) {
      list.innerHTML = '<p class="hue-empty">Keine Geräte gefunden.</p>';
    } else {
      toast(`${state.hueDiscoveredItems.length} Geräte gefunden`, 'success');
    }
  } catch (err) {
    list.innerHTML = `<p class="hue-empty" style="color:var(--offline)">✗ ${escapeHTML(err.message)}</p>`;
  }
}

async function testHueConnection() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  const token = form['hue.token'].value.trim();
  const tls = form['hue.tls'].checked;
  const port = form['hue.port'].value ? Number(form['hue.port'].value) : (tls ? 443 : 80);

  if (!host)  { toast('Bitte zuerst Host/IP angeben', 'error'); return; }
  if (!token) { toast('Bitte API-Token eingeben', 'error'); return; }
  if (!draftHueSummaryKeys.length && !draftHueItems.length) {
    toast('Bitte erst Metriken oder einzelne Geräte auswählen', 'error');
    return;
  }

  const result = $('#hueTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Teste Verbindung…</span></div>';

  const device = {
    host,
    hue: {
      token, port, tls,
      summaryKeys: draftHueSummaryKeys,
      items: draftHueItems,
    }
  };

  try {
    const res = await api.hueTest(device);
    if (res.status === 'online' && Array.isArray(res.metrics)) {
      result.className = 'fritz-test-result ok';
      const rows = res.metrics.map(m => `
        <div class="row">
          <span class="k">${escapeHTML(m.label)}</span>
          <span class="v">${m.value != null ? formatMetricValue(m.value, m.format) : '<em style="color:var(--text-4)">—</em>'}</span>
        </div>
      `).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms · ${res.metrics.length} Werte)</span></div>${rows}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || 'unbekannt')}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

// =====================================================================
// Salt Fiber Box editor
// =====================================================================

function renderSaltPresetOptions() {
  const sel = $('#saltPresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.saltPresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderSaltMetricsList() {
  const list = $('#saltMetricsList');
  if (!list) return;
  if (!state.saltCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.saltCatalog.map(m => {
    const selected = draftSaltMetrics.includes(m.key);
    const unit = m.unit ? `<span class="meta">${escapeHTML(m.unit)}</span>` : '';
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-salt-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        ${unit}
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('input[data-salt-key]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.saltKey;
      if (e.target.checked) {
        if (!draftSaltMetrics.includes(key)) draftSaltMetrics.push(key);
      } else {
        draftSaltMetrics = draftSaltMetrics.filter(k => k !== key);
      }
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

function applySaltPreset() {
  const id = $('#saltPresetSelect').value;
  if (!id) return;
  const preset = state.saltPresets.find(p => p.id === id);
  if (!preset) return;
  draftSaltMetrics = [...preset.keys];
  renderSaltMetricsList();
  renderRulesList();
  $('#saltPresetSelect').value = '';
}

async function testSaltConnection() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  if (!host) { toast('Bitte zuerst Host/IP angeben', 'error'); return; }
  if (!draftSaltMetrics.length) {
    toast('Bitte erst Metriken auswählen oder Preset anwenden', 'error');
    return;
  }

  const result = $('#saltTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Teste Verbindung…</span></div>';

  const tls = form['salt.tls'].checked;
  const device = {
    host,
    salt: {
      port:    form['salt.port'].value ? Number(form['salt.port'].value) : null,
      tls,
      metrics: draftSaltMetrics,
    }
  };

  try {
    const res = await api.saltTest(device);
    if (res.status === 'online' && Array.isArray(res.metrics)) {
      result.className = 'fritz-test-result ok';
      const rows = res.metrics.map(m => {
        const valDisplay = m.value == null
          ? '<em style="color:var(--text-4)">—</em>'
          : (m.unit && m.format !== 'text')
            ? `${formatMetricValue(m.value, m.format)} ${escapeHTML(m.unit)}`
            : formatMetricValue(m.value, m.format);
        return `
          <div class="row">
            <span class="k">${escapeHTML(m.label)}</span>
            <span class="v">${valDisplay}</span>
          </div>`;
      }).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms)</span></div>${rows}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || 'unbekannt')}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

// =====================================================================
// Amazon Echo / Alexa editor
// =====================================================================

function renderEchoPresetOptions() {
  const sel = $('#echoPresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.echoPresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderEchoMetricsList() {
  const list = $('#echoMetricsList');
  if (!list) return;
  if (!state.echoCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.echoCatalog.map(m => {
    const selected = draftEchoMetrics.includes(m.key);
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-echo-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('input[data-echo-key]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.echoKey;
      if (e.target.checked) {
        if (!draftEchoMetrics.includes(key)) draftEchoMetrics.push(key);
      } else {
        draftEchoMetrics = draftEchoMetrics.filter(k => k !== key);
      }
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

function updateEchoAuthStatus(loggedIn) {
  const el = $('#echoAuthStatus');
  if (!el) return;
  el.className = `echo-auth-status ${loggedIn ? 'logged-in' : 'not-logged-in'}`;
  el.textContent = loggedIn ? 'Angemeldet ✓' : 'Nicht angemeldet';
}

function applyEchoPreset() {
  const id = $('#echoPresetSelect').value;
  if (!id) return;
  const preset = state.echoPresets.find(p => p.id === id);
  if (!preset) return;
  draftEchoMetrics = [...preset.keys];
  renderEchoMetricsList();
  renderRulesList();
  $('#echoPresetSelect').value = '';
}

let echoAuthPollTimer = null;

async function startEchoLogin() {
  const form = $('#deviceForm');
  const region = form['echo.region'].value;
  const sessionId = `echo-${Date.now()}`;
  const proxyPort = 3001;

  const btn = $('#btnEchoLogin');
  btn.disabled = true;
  btn.textContent = 'Öffne Login…';
  updateEchoAuthStatus(false);

  try {
    const start = await api.echoAuthStart(region, sessionId, proxyPort, editingId || undefined);
    if (!start.ok) throw new Error(start.error || 'Start fehlgeschlagen');

    // Open proxy login in new tab
    window.open(start.proxyUrl, '_blank');
    btn.textContent = 'Warte auf Login…';

    // Poll until done
    clearInterval(echoAuthPollTimer);
    echoAuthPollTimer = setInterval(async () => {
      try {
        const result = await api.echoAuthPoll(sessionId);
        if (!result.done) return;

        clearInterval(echoAuthPollTimer);
        btn.disabled = false;
        btn.textContent = 'Amazon Login…';

        if (result.error) {
          toast(`Alexa-Login fehlgeschlagen: ${result.error}`, 'error');
          return;
        }

        // Save cookie to hidden field
        form['echo.cookie'].value = result.cookie || '';
        updateEchoAuthStatus(true);

        // Persist cookie immediately so it survives modal close without saving
        if (editingId) {
          const dev = state.devices.find(d => d.id === editingId);
          if (dev) {
            const updated = { ...dev, echo: { ...(dev.echo || {}), cookie: result.cookie, region: form['echo.region'].value, serial: form['echo.serial'].value } };
            api.updDevice(editingId, updated).then(r => {
              state.devices = state.devices.map(d => d.id === editingId ? r : d);
            }).catch(() => {});
          }
        }

        toast(editingId ? 'Amazon-Login erfolgreich — gespeichert' : 'Amazon-Login erfolgreich — bitte Gerät speichern', 'ok');

        // Show discovered devices
        if (result.devices?.length) {
          renderEchoDeviceList(result.devices, form);
        }
      } catch { /* polling errors are transient */ }
    }, 2000);

  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Amazon Login…';
    toast(`Login-Start fehlgeschlagen: ${err.message}`, 'error');
  }
}

function renderEchoDeviceList(devices, form) {
  const list = $('#echoDiscoveredList');
  list.hidden = false;
  list.innerHTML = devices.map(d => `
    <div class="hue-item-row" data-serial="${escapeHTML(d.serial)}">
      <span class="hue-item-name">${escapeHTML(d.name)}</span>
      <span class="hue-item-meta">${escapeHTML(d.type)}</span>
      <span class="hue-item-state ${d.online ? 'on' : 'off'}">${d.online ? 'online' : 'offline'}</span>
      <button type="button" class="btn btn-ghost btn-xs echo-pick-btn">Auswählen</button>
    </div>
  `).join('');
  list.querySelectorAll('.echo-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const serial = btn.closest('[data-serial]').dataset.serial;
      const name   = btn.closest('[data-serial]').querySelector('.hue-item-name')?.textContent || '';
      form['echo.serial'].value = serial;
      if (!form.name.value) form.name.value = name;
      toast(`${name || serial} ausgewählt`, 'ok');
    });
  });
}

async function testEchoConnection() {
  const form = $('#deviceForm');
  if (!form['echo.cookie'].value.trim()) {
    toast('Bitte zuerst Amazon-Cookie eintragen', 'error');
    return;
  }

  const result = $('#echoTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Teste Verbindung…</span></div>';

  const device = {
    host: form.host.value.trim() || 'echo',
    echo: {
      cookie:  form['echo.cookie'].value,
      region:  form['echo.region'].value,
      serial:  form['echo.serial'].value,
      metrics: draftEchoMetrics,
    }
  };

  try {
    const res = await api.echoTest(device);
    if (res.status === 'online') {
      result.className = 'fritz-test-result ok';
      const rows = (res.metrics || []).map(m => `
        <div class="row">
          <span class="k">${escapeHTML(m.label)}</span>
          <span class="v">${m.value != null ? formatMetricValue(m.value, m.format) : '<em style="color:var(--text-4)">—</em>'}</span>
        </div>
      `).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms)</span></div>${rows || '<div class="row"><span class="k" style="color:var(--text-4)">Keine Metriken ausgewählt</span></div>'}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || res.status)}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

// ── Shield helpers ─────────────────────────────────────────────────────────

function renderShieldPresetOptions() {
  const sel = $('#shieldPresetSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">Preset wählen…</option>' +
    state.shieldPresets.map(p =>
      `<option value="${p.id}">${escapeHTML(p.label)}</option>`
    ).join('');
}

function renderShieldMetricsList() {
  const list = $('#shieldMetricsList');
  if (!list) return;
  if (!state.shieldCatalog.length) {
    list.innerHTML = '<p style="font-size:12px;color:var(--text-4);padding:8px">Lade Katalog…</p>';
    return;
  }
  list.innerHTML = state.shieldCatalog.map(m => {
    const selected = draftShieldMetrics.includes(m.key);
    return `
      <label class="fritz-metric-pill ${selected ? 'selected' : ''}">
        <input type="checkbox" data-shield-key="${m.key}" ${selected ? 'checked' : ''} />
        <span>${escapeHTML(m.label)}</span>
        <span class="meta">${m.format}</span>
      </label>`;
  }).join('');
  list.querySelectorAll('input[data-shield-key]').forEach(cb => {
    cb.addEventListener('change', e => {
      const key = e.target.dataset.shieldKey;
      if (e.target.checked) {
        if (!draftShieldMetrics.includes(key)) draftShieldMetrics.push(key);
      } else {
        draftShieldMetrics = draftShieldMetrics.filter(k => k !== key);
      }
      e.target.closest('.fritz-metric-pill').classList.toggle('selected', e.target.checked);
      renderRulesList();
    });
  });
}

function applyShieldPreset() {
  const id = $('#shieldPresetSelect').value;
  if (!id) return;
  const preset = state.shieldPresets.find(p => p.id === id);
  if (!preset) return;
  draftShieldMetrics = [...preset.keys];
  renderShieldMetricsList();
  renderRulesList();
  $('#shieldPresetSelect').value = '';
}

async function testShieldConnection() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  if (!host) { toast('Bitte zuerst Host/IP angeben', 'error'); return; }

  const result = $('#shieldTestResult');
  result.hidden = false;
  result.className = 'fritz-test-result';
  result.innerHTML = '<div class="row"><span class="k">Verbinde via ADB…</span></div>';

  const device = {
    host,
    shield: {
      port:    form['shield.port'].value ? Number(form['shield.port'].value) : 5555,
      metrics: draftShieldMetrics,
    }
  };

  try {
    const res = await api.shieldTest(device);
    if (res.status === 'online') {
      result.className = 'fritz-test-result ok';
      const rows = (res.metrics || []).map(m => `
        <div class="row">
          <span class="k">${escapeHTML(m.label)}</span>
          <span class="v">${m.value != null ? formatMetricValue(m.value, m.format) : '<em style="color:var(--text-4)">—</em>'}</span>
        </div>
      `).join('');
      result.innerHTML = `<div class="row"><span class="k">✓ Verbunden (${res.latency} ms)</span></div>${rows || '<div class="row"><span class="k" style="color:var(--text-4)">Keine Metriken ausgewählt</span></div>'}`;
    } else {
      result.className = 'fritz-test-result error';
      result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(res.error || res.status)}</span></div>`;
    }
  } catch (err) {
    result.className = 'fritz-test-result error';
    result.innerHTML = `<div class="row"><span class="k">✗ Fehler:</span><span class="v">${escapeHTML(err.message)}</span></div>`;
  }
}

function applyMibMetric() {
  const val = $('#mibSelect').value;
  if (!val) return;
  const [filename, modName, idxStr] = val.split('|');
  const mib = state.mibs.find(m => m.filename === filename);
  const mod = mib?.modules?.find(m => m.name === modName);
  const metric = mod?.metrics?.[Number(idxStr)];
  if (!metric) return;

  // Uniquify key
  let key = metric.key;
  const existingKeys = new Set(draftMetrics.map(m => m.key));
  let i = 2;
  while (existingKeys.has(key)) key = `${metric.key}_${i++}`;

  draftMetrics.push({
    key,
    label: metric.label,
    oid: metric.oid,
    format: metric.format,
  });
  renderMetricsList();
  $('#mibSelect').value = '';
  toast(`Metrik aus ${modName} hinzugefügt`, 'ok');
}

async function snmpWalkFromEditor() {
  const form = $('#deviceForm');
  const host = form.host.value.trim();
  if (!host) { toast('Bitte zuerst Host/IP angeben', 'error'); return; }

  // Build transient device object from form
  const device = currentFormDevice();

  const wr = $('#walkResults');
  wr.hidden = false;
  wr.innerHTML = `
    <div class="wr-input">
      <input id="walkRoot" placeholder="Root-OID, z.B. 1.3.6.1.2.1.1" value="1.3.6.1.2.1.1" />
      <button type="button" class="btn btn-ghost btn-xs" id="walkGo">Walk</button>
    </div>
    <div class="wr-empty">Root-OID eingeben und "Walk" klicken.</div>
  `;
  $('#walkGo').addEventListener('click', async () => {
    const rootOid = $('#walkRoot').value.trim();
    if (!rootOid) return;
    wr.querySelector('.wr-empty')?.remove();
    const res = document.createElement('div');
    res.innerHTML = `<div class="wr-empty">Walk läuft…</div>`;
    wr.append(res);
    const result = await api.snmpWalk(device, rootOid);
    res.remove();
    if (!result.ok || !result.results?.length) {
      const msg = result.error || 'Keine Ergebnisse';
      const err = document.createElement('div');
      err.innerHTML = `<div class="wr-empty">${escapeHTML(msg)}</div>`;
      wr.append(err);
      return;
    }
    const rows = document.createElement('div');
    rows.innerHTML = `
      <div class="wr-head">
        <span class="wr-title">${result.results.length} Ergebnisse</span>
        <button type="button" class="btn-xs btn btn-ghost" onclick="this.closest('.walk-results').querySelectorAll('.wr-row').forEach(r => r.remove()); this.parentElement.parentElement.remove();">Schließen</button>
      </div>
      ${result.results.map(r => `
        <div class="wr-row">
          <span class="wr-oid" title="${escapeHTML(r.oid)}">${escapeHTML(r.oid)}</span>
          <span class="wr-val" title="${escapeHTML(String(r.value ?? '—'))}">${escapeHTML(String(r.value ?? '—'))}</span>
          <button type="button" data-wr-add="${escapeHTML(r.oid)}" data-wr-val="${escapeHTML(String(r.value ?? ''))}">+</button>
        </div>
      `).join('')}
    `;
    wr.append(rows);
    rows.querySelectorAll('[data-wr-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const oid = btn.dataset.wrAdd;
        // Derive label from last OID segment number or text value
        const lastSeg = oid.split('.').slice(-2).join('.');
        const label = `OID ${lastSeg}`;
        draftMetrics.push({ key: `custom_${draftMetrics.length + 1}`, label, oid, format: 'text' });
        renderMetricsList();
        toast('Metrik hinzugefügt', 'ok');
      });
    });
  });
}

function currentFormDevice() {
  const form = $('#deviceForm');
  const fd = new FormData(form);
  return {
    host: fd.get('host'),
    snmp: {
      community:    fd.get('snmp.community') || 'public',
      version:      fd.get('snmp.version') || '2c',
      port:         fd.get('snmp.port') ? Number(fd.get('snmp.port')) : 161,
      user:         fd.get('snmp.user') || undefined,
      authProtocol: fd.get('snmp.authProtocol') || undefined,
      authKey:      fd.get('snmp.authKey') || undefined,
      privProtocol: fd.get('snmp.privProtocol') || undefined,
      privKey:      fd.get('snmp.privKey') || undefined,
    }
  };
}

function updateMethodVisibility() {
  const v = $('#methodSelect').value;
  document.querySelectorAll('#deviceModal .method-block').forEach(b => {
    b.hidden = b.dataset.method !== v;
  });
  // Re-render rules because available numeric metrics depend on the method
  renderRulesList();
}

function closeModals() {
  clearInterval(echoAuthPollTimer);
  echoAuthPollTimer = null;
  $('#deviceModal').hidden = true;
  $('#settingsModal').hidden = true;
  $('#detailModal').hidden = true;
}

async function submitDevice(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const device = {
    name:     fd.get('name'),
    host:     fd.get('host'),
    port:     fd.get('port') ? Number(fd.get('port')) : '',
    type:     fd.get('type'),
    method:   fd.get('method'),
    protocol: fd.get('protocol'),
    enabled:  true,
    snmp: {
      community:    fd.get('snmp.community') || 'public',
      version:      fd.get('snmp.version') || '2c',
      port:         fd.get('snmp.port') ? Number(fd.get('snmp.port')) : 161,
      user:         fd.get('snmp.user') || undefined,
      authProtocol: fd.get('snmp.authProtocol') || undefined,
      authKey:      fd.get('snmp.authKey') || undefined,
      privProtocol: fd.get('snmp.privProtocol') || undefined,
      privKey:      fd.get('snmp.privKey') || undefined,
      metrics:      draftMetrics.filter(m => m.key && (m.oid || m.expression)),
    },
    fritz: {
      username: fd.get('fritz.username') || '',
      password: fd.get('fritz.password') || '',
      metrics:  [...draftFritzMetrics],
    },
    avr: {
      port:    fd.get('avr.port') ? Number(fd.get('avr.port')) : 8080,
      metrics: [...draftAvrMetrics],
    },
    hue: {
      token: fd.get('hue.token') || '',
      port:  fd.get('hue.port') ? Number(fd.get('hue.port')) : null,
      tls:   form['hue.tls'].checked,
      summaryKeys: [...draftHueSummaryKeys],
      items: [...draftHueItems],
    },
    salt: {
      port:    fd.get('salt.port') ? Number(fd.get('salt.port')) : null,
      tls:     form['salt.tls'].checked,
      metrics: [...draftSaltMetrics],
    },
    echo: {
      cookie:  fd.get('echo.cookie') || '',
      region:  fd.get('echo.region') || 'de',
      serial:  fd.get('echo.serial') || '',
      metrics: [...draftEchoMetrics],
    },
    shield: {
      port:    form['shield.port'].value ? Number(form['shield.port'].value) : 5555,
      metrics: [...draftShieldMetrics],
    },
    notificationRules: draftRules.filter(r => r.channelId && r.event),
    metricMappings: serializeMappings(draftMappings),
  };
  if (editingId) {
    const existing = state.devices.find(x => x.id === editingId);
    const updated = await api.updDevice(editingId, { ...existing, ...device });
    state.devices = state.devices.map(x => x.id === editingId ? updated : x);
  } else {
    const created = await api.addDevice(device);
    state.devices.push(created);
  }
  closeModals();
  render();
  runChecks();
}

function openSettings() {
  const f = $('#settingsForm');
  f.interval.value = state.settings.interval;
  f.timeout.value = state.settings.timeout;
  f.autoRefresh.checked = state.settings.autoRefresh;
  f.logLevel.value = state.settings.logLevel || 'info';
  const s = state.settings.defaultSnmp || {};
  f['snmp.community'].value = s.community || 'public';
  f['snmp.version'].value   = s.version || '2c';
  f['snmp.port'].value      = s.port || 161;
  syncThemeChooser();
  renderChannelsList();
  renderMibsList();
  document.querySelectorAll('.channel-editor').forEach(e => e.remove());
  $('#settingsModal').hidden = false;
}

async function submitSettings(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const next = {
    interval: Number(fd.get('interval')) || 30,
    timeout:  Number(fd.get('timeout')) || 4,
    autoRefresh: fd.get('autoRefresh') === 'on',
    logLevel: fd.get('logLevel') || 'info',
    defaultSnmp: {
      community: fd.get('snmp.community') || 'public',
      version:   fd.get('snmp.version') || '2c',
      port:      Number(fd.get('snmp.port')) || 161
    },
    notifications: state.settings.notifications || []
  };
  state.settings = await api.updSettings(next);
  scheduleAutoRefresh();
  closeModals();
  render();
}

async function deleteDevice(id) {
  if (!confirm('Gerät wirklich löschen?')) return;
  await api.delDevice(id);
  state.devices = state.devices.filter(d => d.id !== id);
  delete state.results[id];
  render();
}

async function toggleDevice(id) {
  const d = state.devices.find(x => x.id === id);
  if (!d) return;
  const updated = await api.updDevice(id, { ...d, enabled: !d.enabled });
  state.devices = state.devices.map(x => x.id === id ? updated : x);
  render();
  if (updated.enabled) recheckOne(id);
}

// =====================================================================
// Device Detail Modal
// =====================================================================
async function openDetail(id) {
  const d = state.devices.find(x => x.id === id);
  if (!d) return;
  $('#detailModal').hidden = false;
  $('#detailTitle').textContent = `${d.name} · ${d.host}`;
  $('#detailBody').innerHTML = '<div class="detail-empty">Lade Verlauf…</div>';

  try {
    const { points, stats } = await api.historyOne(id);
    renderDetail(d, points || [], stats);
  } catch (err) {
    $('#detailBody').innerHTML = `<div class="detail-empty">Fehler: ${escapeHTML(err.message)}</div>`;
  }
}

function renderDetail(d, points, stats) {
  const typeDef = DEVICE_TYPES[d.type] || DEVICE_TYPES.other;
  const body = $('#detailBody');

  if (!points.length) {
    body.innerHTML = `
      <div class="detail-head">
        <div class="device-icon ac-${typeDef.accent}">${svg(typeDef.iconId, 24, 1.6)}</div>
        <div>
          <h2>${escapeHTML(d.name)}</h2>
          <div class="meta">${escapeHTML(d.host)} · ${typeDef.label}</div>
        </div>
      </div>
      <div class="detail-empty">Noch keine Messwerte — warte auf den nächsten Check.</div>
    `;
    return;
  }

  const latencyPoints = points.filter(p => p.s === 'online' && p.l != null).map(p => ({ t: p.t, v: p.l }));

  // Discover custom metric keys from history (point.m is an object)
  const metricKeys = new Set();
  for (const p of points) if (p.m) Object.keys(p.m).forEach(k => metricKeys.add(k));

  // Look up labels + format from current device config
  const metricsDef = d.snmp?.metrics || [];
  const labelFor = (key) => metricsDef.find(m => m.key === key);

  const first = points[0]?.t;
  const last  = points[points.length - 1]?.t;
  const span  = first && last ? humanSpan(last - first) : '—';

  const uptimePct  = stats?.uptime != null ? `${stats.uptime.toFixed(1)}%` : '—';
  const avgL       = stats?.avgLatency != null ? `${stats.avgLatency}ms` : '—';
  const minL       = stats?.minLatency != null ? `${stats.minLatency}ms` : '—';
  const maxL       = stats?.maxLatency != null ? `${stats.maxLatency}ms` : '—';

  const customCharts = [...metricKeys].map(key => {
    const def = labelFor(key);
    const series = points.filter(p => p.m && typeof p.m[key] === 'number').map(p => ({ t: p.t, v: p.m[key] }));
    if (series.length < 2) return '';
    const title = def?.label ? `${def.label}${unitSuffix(def.format)}` : key;
    const opts = def?.format === 'percent' ? { max: 100 } : {};
    return bigChart(title, series, points, key, opts);
  }).join('');

  body.innerHTML = `
    <div class="detail-head">
      <div class="device-icon ac-${typeDef.accent}">${svg(typeDef.iconId, 24, 1.6)}</div>
      <div>
        <h2>${escapeHTML(d.name)}</h2>
        <div class="meta">${escapeHTML(d.host)}${d.port ? ':' + d.port : ''} · ${typeDef.label} · ${(d.method || 'http').toUpperCase()}</div>
      </div>
    </div>

    <div class="detail-stats">
      <div class="detail-stat ${parseFloat(uptimePct) >= 99 ? 'good' : (parseFloat(uptimePct) < 90 ? 'bad' : '')}">
        <div class="k">Uptime</div><div class="v">${uptimePct}</div>
      </div>
      <div class="detail-stat"><div class="k">Ø Latenz</div><div class="v">${avgL}</div></div>
      <div class="detail-stat"><div class="k">Min</div><div class="v">${minL}</div></div>
      <div class="detail-stat"><div class="k">Max</div><div class="v">${maxL}</div></div>
      <div class="detail-stat"><div class="k">Zeitraum</div><div class="v">${span}</div></div>
    </div>

    ${bigChart('Latenz (ms)', latencyPoints, points, 'latency')}
    ${customCharts}
  `;
}

function unitSuffix(format) {
  if (format === 'percent') return ' (%)';
  if (format === 'bytes' || format === 'kbytes') return ' (bytes)';
  if (format === 'celsius') return ' (°C)';
  if (format === 'uptime')  return '';
  return '';
}

function bigChart(title, series, allPoints, kind, opts = {}) {
  if (series.length < 2) return '';

  const W = 860, H = 120, PAD = 8;
  const values = series.map(s => s.v);
  const max = opts.max != null ? opts.max : Math.max(...values);
  const min = 0;
  const range = Math.max(1, max - min);

  const t0 = allPoints[0].t, t1 = allPoints[allPoints.length - 1].t;
  const tSpan = Math.max(1, t1 - t0);

  const x = (t) => PAD + ((t - t0) / tSpan) * (W - PAD * 2);
  const y = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);

  // Offline segments (background)
  const offlineMarks = allPoints
    .filter(p => p.s === 'offline')
    .map(p => `<line x1="${x(p.t).toFixed(1)}" y1="${PAD}" x2="${x(p.t).toFixed(1)}" y2="${H - PAD}" stroke="var(--offline)" stroke-width="1" opacity="0.25"/>`)
    .join('');

  // Line
  let path = '', area = '';
  series.forEach((s, i) => {
    const X = x(s.t).toFixed(1), Y = y(s.v).toFixed(1);
    if (i === 0) { path += `M ${X} ${Y}`; area += `M ${X} ${H - PAD} L ${X} ${Y}`; }
    else { path += ` L ${X} ${Y}`; area += ` L ${X} ${Y}`; }
  });
  area += ` L ${x(series[series.length - 1].t).toFixed(1)} ${H - PAD} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const val = min + range * f;
    const yy  = y(val);
    return `<line x1="${PAD}" y1="${yy.toFixed(1)}" x2="${W - PAD}" y2="${yy.toFixed(1)}" stroke="var(--border-soft)" stroke-dasharray="2 3" stroke-width="0.5"/><text x="${PAD + 2}" y="${(yy - 2).toFixed(1)}" font-size="9" fill="var(--text-4)" font-family="var(--font-mono)">${formatTickValue(val, kind)}</text>`;
  }).join('');

  const color = kind === 'latency' ? 'var(--sky)' : (kind === 'memory' ? 'var(--amber)' : 'var(--violet)');
  const gradId = `grad-${kind}-${Math.random().toString(36).slice(2, 7)}`;

  return `
    <div class="detail-chart">
      <div class="detail-chart-head">
        <div class="detail-chart-title">${title}</div>
        <div class="detail-chart-range">${fmtTime(t0)} → ${fmtTime(t1)}</div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="color: ${color}">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="currentColor" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${yTicks}
        ${offlineMarks}
        <path d="${area}" fill="url(#${gradId})" stroke="none"/>
        <path d="${path}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

function formatTickValue(v, kind) {
  if (kind === 'memory') return `${Math.round(v)}%`;
  if (kind === 'latency') return `${Math.round(v)}`;
  return v.toFixed(2);
}
function humanSpan(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// =====================================================================
// Notification channel editor (inside settings modal)
// =====================================================================
let channelEditingIndex = -1;

function renderChannelsList() {
  const container = $('#channelsList');
  const channels = state.settings.notifications || [];
  if (!channels.length) {
    container.innerHTML = '<p style="font-size:12px;color:var(--text-4)">Keine Channels konfiguriert.</p>';
    return;
  }
  container.innerHTML = channels.map((c, idx) => `
    <div class="channel-row ${c.type}">
      <span class="ch-type">${c.type}</span>
      <span class="ch-name">${escapeHTML(c.name || '(unbenannt)')} ${c.enabled ? '' : '· <em style="color:var(--text-4)">aus</em>'}</span>
      <div class="ch-actions">
        <button type="button" class="test" data-ch-action="test" data-idx="${idx}">Test</button>
        <button type="button" class="edit" data-ch-action="edit" data-idx="${idx}">Bearbeiten</button>
        <button type="button" class="del"  data-ch-action="del"  data-idx="${idx}">Löschen</button>
      </div>
    </div>
  `).join('');
}

function addChannel() {
  const type = $('#newChannelType').value;
  const defaults = { discord:{},telegram:{},ntfy:{topic:'https://ntfy.sh/'},webhook:{method:'POST'} }[type] || {};
  const newCh = {
    id: 'c_' + Math.random().toString(36).slice(2, 8),
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Channel`,
    type, enabled: true,
    config: defaults,
    events: { 'device.offline': true, 'device.online': true },
    cooldownMinutes: 5,
  };
  state.settings.notifications = state.settings.notifications || [];
  state.settings.notifications.push(newCh);
  channelEditingIndex = state.settings.notifications.length - 1;
  renderChannelsList();
  openChannelEditor(channelEditingIndex);
}

function openChannelEditor(idx) {
  const ch = state.settings.notifications[idx];
  if (!ch) return;

  // Remove existing editor if any
  document.querySelectorAll('.channel-editor').forEach(e => e.remove());

  const cfgRows = renderChannelConfigRows(ch);
  const editor = document.createElement('div');
  editor.className = 'channel-editor';
  editor.innerHTML = `
    <label class="field">
      <span>Name</span>
      <input class="ch-field" data-key="name" value="${escapeHTML(ch.name || '')}" />
    </label>
    ${cfgRows}
    <div class="ch-events">
      <label><input type="checkbox" class="ch-event" data-ev="device.offline" ${ch.events?.['device.offline'] ? 'checked' : ''}/> Offline</label>
      <label><input type="checkbox" class="ch-event" data-ev="device.online"  ${ch.events?.['device.online']  ? 'checked' : ''}/> Online</label>
      <label><input type="checkbox" class="ch-field" data-key="enabled" ${ch.enabled ? 'checked' : ''}/> Aktiv</label>
    </div>
    <label class="field">
      <span>Cooldown (Minuten)</span>
      <input class="ch-field" data-key="cooldownMinutes" type="number" min="0" max="1440" value="${ch.cooldownMinutes ?? 5}"/>
    </label>
    <div class="editor-actions">
      <button type="button" class="btn btn-ghost" data-ch-action="cancel">Schließen</button>
    </div>
  `;
  $('#channelsList').append(editor);

  editor.addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList.contains('ch-field')) {
      const key = t.dataset.key;
      const val = t.type === 'checkbox' ? t.checked : (t.type === 'number' ? Number(t.value) : t.value);
      ch[key] = val;
    } else if (t.classList.contains('ch-cfg')) {
      const key = t.dataset.key;
      ch.config[key] = t.type === 'checkbox' ? t.checked : t.value;
    } else if (t.classList.contains('ch-event')) {
      ch.events = ch.events || {};
      ch.events[t.dataset.ev] = t.checked;
    }
    renderChannelsList();
  });
  editor.addEventListener('click', (e) => {
    if (e.target.dataset.chAction === 'cancel') {
      editor.remove();
      channelEditingIndex = -1;
    }
  });
}

function renderChannelConfigRows(ch) {
  const c = ch.config || {};
  if (ch.type === 'discord') {
    return `<label class="field"><span>Webhook URL</span><input class="ch-cfg" data-key="webhookUrl" value="${escapeHTML(c.webhookUrl||'')}" placeholder="https://discord.com/api/webhooks/..."/></label>`;
  }
  if (ch.type === 'telegram') {
    return `
      <div class="row">
        <label class="field"><span>Bot Token</span><input class="ch-cfg" data-key="botToken" value="${escapeHTML(c.botToken||'')}" placeholder="123456:ABC..."/></label>
        <label class="field"><span>Chat ID</span><input class="ch-cfg" data-key="chatId" value="${escapeHTML(c.chatId||'')}" placeholder="-1001234..."/></label>
      </div>`;
  }
  if (ch.type === 'ntfy') {
    return `
      <label class="field"><span>Topic URL</span><input class="ch-cfg" data-key="topic" value="${escapeHTML(c.topic||'https://ntfy.sh/')}" placeholder="https://ntfy.sh/my-topic"/></label>
      <div class="row">
        <label class="field"><span>Priority</span>
          <select class="ch-cfg" data-key="priority">
            ${['default','min','low','high','urgent'].map(p => `<option value="${p}" ${c.priority===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Auth Token (opt.)</span><input class="ch-cfg" data-key="token" value="${escapeHTML(c.token||'')}"/></label>
      </div>`;
  }
  if (ch.type === 'webhook') {
    return `
      <label class="field"><span>URL</span><input class="ch-cfg" data-key="url" value="${escapeHTML(c.url||'')}" placeholder="https://..."/></label>
      <label class="field"><span>Method</span>
        <select class="ch-cfg" data-key="method">
          ${['POST','PUT'].map(m => `<option value="${m}" ${c.method===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </label>`;
  }
  return '';
}

async function testChannel(idx) {
  const ch = state.settings.notifications[idx];
  if (!ch) return;
  toast('Sende Testbenachrichtigung…', 'ok');
  const res = await api.testChannel(ch);
  if (res.ok) toast('Test erfolgreich gesendet ✓', 'ok');
  else        toast(`Test fehlgeschlagen: ${res.error || 'unbekannt'}`, 'error');
}

function deleteChannel(idx) {
  if (!confirm('Channel wirklich löschen?')) return;
  state.settings.notifications.splice(idx, 1);
  renderChannelsList();
  document.querySelectorAll('.channel-editor').forEach(e => e.remove());
}

function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; }, 2500);
  setTimeout(() => el.remove(), 2900);
}

// =====================================================================
// MIB file management
// =====================================================================
function renderMibsList() {
  const container = $('#mibsList');
  if (!container) return;
  if (!state.mibs.length) {
    container.innerHTML = '';  // CSS :empty rule shows placeholder
    return;
  }
  container.innerHTML = state.mibs.map((mib) => {
    if (mib.error) {
      return `
        <div class="mib-row error">
          <div class="mib-icon">MIB</div>
          <div class="mib-info">
            <div class="mib-filename">${escapeHTML(mib.filename)}</div>
            <div class="mib-meta error">${escapeHTML(mib.error)}</div>
          </div>
          <div class="mib-actions">
            <button type="button" data-mib-del="${escapeHTML(mib.filename)}">Entfernen</button>
          </div>
        </div>`;
    }
    const totalMetrics = (mib.modules || []).reduce((a, m) => a + (m.metrics?.length || 0), 0);
    const modNames = (mib.modules || []).map(m => m.name).join(', ') || '—';
    return `
      <div class="mib-row">
        <div class="mib-icon">MIB</div>
        <div class="mib-info">
          <div class="mib-filename">${escapeHTML(mib.filename)}</div>
          <div class="mib-meta">${escapeHTML(modNames)} · ${totalMetrics} Metrik${totalMetrics === 1 ? '' : 'en'}</div>
        </div>
        <div class="mib-actions">
          <button type="button" data-mib-del="${escapeHTML(mib.filename)}">Entfernen</button>
        </div>
      </div>`;
  }).join('');
}

async function uploadMibFile() {
  $('#mibFile').click();
}

async function onMibFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    toast('Datei zu groß (max. 4 MB)', 'error');
    return;
  }
  try {
    const content = await file.text();
    const result = await api.mibUpload(file.name, content);
    if (result.error) {
      toast(`Fehler: ${result.error}`, 'error');
      return;
    }
    // Refresh list
    state.mibs = await api.mibs();
    renderMibsList();
    renderPresetOptions();  // so the Device Editor dropdown picks up new metrics
    const count = (result.modules || []).reduce((a, m) => a + (m.metrics?.length || 0), 0);
    toast(`${file.name}: ${count} Metrik${count === 1 ? '' : 'en'} geladen`, 'ok');
  } catch (err) {
    toast(`Fehler beim Lesen: ${err.message}`, 'error');
  }
  e.target.value = '';
}

async function deleteMibFile(filename) {
  if (!confirm(`MIB-Datei "${filename}" entfernen?`)) return;
  const res = await api.mibDelete(filename);
  if (res.ok || res.status === 204) {
    state.mibs = state.mibs.filter(m => m.filename !== filename);
    renderMibsList();
    renderPresetOptions();
    toast('MIB entfernt', 'ok');
  } else {
    toast('Entfernen fehlgeschlagen', 'error');
  }
}

// =====================================================================
// Import / Export / Reset
// =====================================================================
function exportData() {
  const payload = { version: 1, exported: new Date().toISOString(), devices: state.devices, settings: state.settings };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `net-monitor-${Date.now()}.json`;
  a.click();
}

function importData() { $('#importFile').click(); }

async function onImportFile(e) {
  const f = e.target.files?.[0]; if (!f) return;
  const text = await f.text();
  try {
    const parsed = JSON.parse(text);
    await api.import(parsed);
    await bootstrap();
    closeModals();
    alert('Import erfolgreich');
  } catch (err) {
    alert('Ungültige Datei: ' + err.message);
  }
  e.target.value = '';
}

async function resetAll() {
  if (!confirm('Wirklich ALLES zurücksetzen? Alle Geräte und Einstellungen werden gelöscht.')) return;
  await api.import({ devices: [], settings: {} });
  await bootstrap();
  closeModals();
}

// =====================================================================
// Bootstrap / Events
// =====================================================================
async function bootstrap() {
  const [devices, settings, presets, mibs, fritzPresets, fritzCatalog, avrPresets, avrCatalog, huePresets, hueSummaryCatalog, saltPresets, saltCatalog, echoPresets, echoCatalog, shieldPresets, shieldCatalog, standardMappings] = await Promise.all([
    api.devices(), api.settings(),
    api.snmpPresets().catch(() => []),
    api.mibs().catch(() => []),
    api.fritzPresets().catch(() => []),
    api.fritzCatalog().catch(() => []),
    api.avrPresets().catch(() => []),
    api.avrCatalog().catch(() => []),
    api.huePresets().catch(() => []),
    api.hueSummaryCatalog().catch(() => []),
    api.saltPresets().catch(() => []),
    api.saltCatalog().catch(() => []),
    api.echoPresets().catch(() => []),
    api.echoCatalog().catch(() => []),
    api.shieldPresets().catch(() => []),
    api.shieldCatalog().catch(() => []),
    api.standardMappings().catch(() => []),
  ]);
  state.devices = devices;
  state.settings = settings;
  state.presets = Array.isArray(presets) ? presets : [];
  state.mibs = Array.isArray(mibs) ? mibs : [];
  state.fritzPresets = Array.isArray(fritzPresets) ? fritzPresets : [];
  state.fritzCatalog = Array.isArray(fritzCatalog) ? fritzCatalog : [];
  state.avrPresets = Array.isArray(avrPresets) ? avrPresets : [];
  state.avrCatalog = Array.isArray(avrCatalog) ? avrCatalog : [];
  state.huePresets = Array.isArray(huePresets) ? huePresets : [];
  state.hueSummaryCatalog = Array.isArray(hueSummaryCatalog) ? hueSummaryCatalog : [];
  state.saltPresets = Array.isArray(saltPresets) ? saltPresets : [];
  state.saltCatalog = Array.isArray(saltCatalog) ? saltCatalog : [];
  state.echoPresets = Array.isArray(echoPresets) ? echoPresets : [];
  state.echoCatalog = Array.isArray(echoCatalog) ? echoCatalog : [];
  state.shieldPresets = Array.isArray(shieldPresets) ? shieldPresets : [];
  state.shieldCatalog = Array.isArray(shieldCatalog) ? shieldCatalog : [];
  state.standardMappings = Array.isArray(standardMappings) ? standardMappings : [];
  render();
  scheduleAutoRefresh();
  runChecks();
}

function wireEvents() {
  $('#btnRefresh').onclick  = () => runChecks();
  $('#btnSettings').onclick = () => openSettings();
  $('#btnAdd').onclick      = () => openDeviceModal();
  $('#btnTheme').onclick    = () => cycleTheme();

  // Theme chooser in settings
  document.querySelector('#themeChooser').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme-val]');
    if (btn) setTheme(btn.dataset.themeVal);
  });

  $('#search').addEventListener('input', (e) => { state.search = e.target.value; render(); });
  $('#typeFilter').addEventListener('change', (e) => { state.typeFilter = e.target.value; render(); });
  $('#statusFilter').addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    document.querySelectorAll('#statusFilter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.statusFilter = btn.dataset.val;
    render();
  });

  // Grid click handler (event delegation)
  document.body.addEventListener('click', (e) => {
    // MIB delete buttons
    const mibDel = e.target.closest('[data-mib-del]');
    if (mibDel) {
      e.preventDefault();
      deleteMibFile(mibDel.dataset.mibDel);
      return;
    }

    // Notification channel actions (inside settings modal)
    const chBtn = e.target.closest('[data-ch-action]');
    if (chBtn) {
      e.preventDefault();
      const idx = Number(chBtn.dataset.idx);
      if (chBtn.dataset.chAction === 'test')   testChannel(idx);
      if (chBtn.dataset.chAction === 'edit')   openChannelEditor(idx);
      if (chBtn.dataset.chAction === 'del')    deleteChannel(idx);
      if (chBtn.dataset.chAction === 'cancel') {
        document.querySelectorAll('.channel-editor').forEach(e => e.remove());
      }
      return;
    }

    // Device card actions
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const card = actionBtn.closest('.device');
      const id = card?.dataset?.id;
      if (!id) return;
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      if (action === 'recheck') recheckOne(id);
      if (action === 'toggle')  toggleDevice(id);
      if (action === 'edit')    openDeviceModal(state.devices.find(d => d.id === id));
      if (action === 'delete')  deleteDevice(id);
      return;
    }

    // Click on a device card anywhere else → open detail
    // (but not if a drag was just performed)
    const card = e.target.closest('.device');
    if (card?.dataset?.id && !justDragged) {
      openDetail(card.dataset.id);
    }
  });

  document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModals);
  document.querySelectorAll('.modal-backdrop').forEach(b => b.onclick = closeModals);

  $('#deviceForm').addEventListener('submit', submitDevice);
  $('#methodSelect').addEventListener('change', updateMethodVisibility);
  $('#settingsForm').addEventListener('submit', submitSettings);

  // Device modal metric editor
  $('#btnApplyPreset').onclick = applyPreset;
  $('#btnAddMibMetric').onclick = applyMibMetric;
  $('#btnAddMetric').onclick   = addCustomMetric;
  $('#btnSnmpWalk').onclick    = snmpWalkFromEditor;
  $('#btnAddRule').onclick     = addRule;
  $('#btnAddMapping').onclick  = addMapping;
  $('#btnApplyFritzPreset').onclick = applyFritzPreset;
  $('#btnFritzTest').onclick   = testFritzConnection;
  $('#btnApplyAvrPreset').onclick = applyAvrPreset;
  $('#btnAvrTest').onclick     = testAvrConnection;
  $('#btnApplyHuePreset').onclick = applyHuePreset;
  $('#btnHueDiscover').onclick = discoverHueDevices;
  $('#btnHueTest').onclick     = testHueConnection;
  $('#btnApplySaltPreset').onclick = applySaltPreset;
  $('#btnSaltTest').onclick    = testSaltConnection;
  $('#btnApplyEchoPreset').onclick = applyEchoPreset;
  $('#btnEchoLogin').onclick       = startEchoLogin;
  $('#btnEchoTest').onclick        = testEchoConnection;
  $('#btnApplyShieldPreset').onclick = applyShieldPreset;
  $('#btnShieldTest').onclick        = testShieldConnection;
  $('#btnDeleteDevice').onclick = () => {
    if (editingId) {
      deleteDevice(editingId);
      closeModals();
    }
  };

  // MIB upload
  $('#btnUploadMib').onclick = uploadMibFile;
  $('#mibFile').addEventListener('change', onMibFileSelected);

  $('#btnExport').onclick  = exportData;
  $('#btnImport').onclick  = importData;
  $('#btnReset').onclick   = resetAll;
  $('#btnAddChannel').onclick = addChannel;
  $('#importFile').addEventListener('change', onImportFile);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
  });
}

renderTypeOptions();
wireEvents();
updateThemeButton();
bootstrap();

// Keep updated "last seen" strings fresh without re-running checks
setInterval(() => render(), 30000);
