import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { log } from './logger.js';

const DATA_DIR     = process.env.DATA_DIR || './data';
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_POINTS   = 500;           // per device
const FLUSH_EVERY  = 60 * 1000;     // 1 min

let buffers = new Map();            // id -> array of points
let dirty = false;
let flushTimer = null;

async function ensureDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

export async function initHistory() {
  await ensureDir();
  if (existsSync(HISTORY_FILE)) {
    try {
      const raw = await readFile(HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const [id, arr] of Object.entries(parsed)) {
        if (Array.isArray(arr)) buffers.set(id, arr.slice(-MAX_POINTS));
      }
      log.info(`[history] loaded ${buffers.size} devices`);
    } catch (err) {
      log.warn('[history] load failed:', err.message);
    }
  }
  if (!flushTimer) flushTimer = setInterval(flush, FLUSH_EVERY);
}

export function record(id, result) {
  if (!id || !result) return;
  let arr = buffers.get(id);
  if (!arr) { arr = []; buffers.set(id, arr); }
  const point = {
    t: result.at || Date.now(),
    s: result.status,
    l: result.latency ?? null,
  };
  // Capture any numeric custom metrics so charts can render them later.
  if (Array.isArray(result.metrics)) {
    const m = {};
    for (const mt of result.metrics) {
      if (typeof mt.value === 'number' && isFinite(mt.value)) {
        m[mt.key] = mt.value;
      }
    }
    if (Object.keys(m).length) point.m = m;
  }
  arr.push(point);
  if (arr.length > MAX_POINTS) arr.splice(0, arr.length - MAX_POINTS);
  dirty = true;
}

export function getHistory(id, limit = MAX_POINTS) {
  const arr = buffers.get(id) || [];
  return arr.slice(-limit);
}

export function getRecent(id, limit = 60) {
  return getHistory(id, limit);
}

export function deleteHistory(id) {
  buffers.delete(id);
  dirty = true;
}

export function getStats(id) {
  const arr = buffers.get(id) || [];
  if (!arr.length) return null;
  const online = arr.filter(p => p.s === 'online').length;
  const latencies = arr.map(p => p.l).filter(x => typeof x === 'number');
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
  const minLatency = latencies.length ? Math.min(...latencies) : null;
  const maxLatency = latencies.length ? Math.max(...latencies) : null;
  return {
    total: arr.length,
    uptime: arr.length ? (online / arr.length) * 100 : null,
    avgLatency, minLatency, maxLatency,
    since: arr[0].t,
  };
}

async function flush() {
  if (!dirty) return;
  dirty = false;
  try {
    await ensureDir();
    const obj = Object.fromEntries(buffers);
    await writeFile(HISTORY_FILE, JSON.stringify(obj), 'utf-8');
  } catch (err) {
    log.error('[history] flush error:', err.message);
    dirty = true; // retry next cycle
  }
}

export async function shutdown() {
  if (flushTimer) clearInterval(flushTimer);
  await flush();
}
