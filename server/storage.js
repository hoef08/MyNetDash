import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { log } from './logger.js';

const DATA_DIR  = process.env.DATA_DIR || './data';
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DB = {
  version: 1,
  settings: {
    interval: 30,
    timeout: 4,
    autoRefresh: true,
    defaultSnmp: { community: 'public', version: '2c', port: 161 },
    notifications: []   // array of channels
  },
  devices: [
    { id: 'seed-1', name: 'FRITZ!Box',       host: '192.168.1.1',   port: 80,   type: 'router',    method: 'http', protocol: 'http',  enabled: true },
    { id: 'seed-2', name: 'Raspberry Pi 4',  host: '192.168.1.20',  port: 161,  type: 'raspberry', method: 'snmp', snmp: { community: 'public', version: '2c', port: 161 }, enabled: true },
    { id: 'seed-3', name: 'Synology NAS',    host: '192.168.1.10',  port: 5000, type: 'nas',       method: 'http', protocol: 'http',  enabled: true }
  ]
};

let cache = null;
let writeLock = Promise.resolve();

async function ensureDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

export async function loadDb() {
  if (cache) return cache;
  await ensureDir();
  if (!existsSync(DATA_FILE)) {
    cache = structuredClone(DEFAULT_DB);
    await persist();
    return cache;
  }
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    cache = JSON.parse(raw);
    // fill in missing defaults
    cache.settings = { ...DEFAULT_DB.settings, ...cache.settings };
    cache.settings.defaultSnmp = { ...DEFAULT_DB.settings.defaultSnmp, ...(cache.settings.defaultSnmp || {}) };
    cache.settings.notifications = Array.isArray(cache.settings.notifications) ? cache.settings.notifications : [];
    cache.devices = Array.isArray(cache.devices) ? cache.devices : [];
    return cache;
  } catch (err) {
    log.warn('[storage] failed to read db.json, using defaults:', err.message);
    cache = structuredClone(DEFAULT_DB);
    return cache;
  }
}

async function persist() {
  writeLock = writeLock.then(async () => {
    try {
      await ensureDir();
      await writeFile(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (err) {
      log.error('[storage] write error:', err.message);
    }
  });
  return writeLock;
}

export async function getSettings() {
  const db = await loadDb();
  return db.settings;
}

export async function updateSettings(patch) {
  const db = await loadDb();
  db.settings = { ...db.settings, ...patch };
  await persist();
  return db.settings;
}

export async function getDevices() {
  const db = await loadDb();
  return db.devices;
}

export async function addDevice(device) {
  const db = await loadDb();
  const id = 'd_' + Math.random().toString(36).slice(2, 10);
  const newDevice = { ...device, id };
  db.devices.push(newDevice);
  await persist();
  return newDevice;
}

export async function updateDevice(id, patch) {
  const db = await loadDb();
  const idx = db.devices.findIndex((d) => d.id === id);
  if (idx < 0) return null;
  db.devices[idx] = { ...db.devices[idx], ...patch, id };
  await persist();
  return db.devices[idx];
}

export async function deleteDevice(id) {
  const db = await loadDb();
  const before = db.devices.length;
  db.devices = db.devices.filter((d) => d.id !== id);
  await persist();
  return db.devices.length < before;
}

export async function reorderDevices(orderedIds) {
  const db = await loadDb();
  if (!Array.isArray(orderedIds)) return false;
  const byId = new Map(db.devices.map((d) => [d.id, d]));
  const reordered = [];
  // First: devices in the requested order
  for (const id of orderedIds) {
    const d = byId.get(id);
    if (d) { reordered.push(d); byId.delete(id); }
  }
  // Then: any devices not mentioned (defensive: keep them at the end)
  for (const d of byId.values()) reordered.push(d);
  db.devices = reordered;
  await persist();
  return true;
}

export async function replaceAll(payload) {
  const db = await loadDb();
  if (Array.isArray(payload.devices)) db.devices = payload.devices;
  if (payload.settings) db.settings = { ...DEFAULT_DB.settings, ...payload.settings };
  await persist();
  return db;
}
