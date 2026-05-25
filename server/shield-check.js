// =====================================================================
// NVIDIA Shield (Android TV) check via ADB over TCP/IP
//
// Uses the native `adb` binary (android-tools) instead of a JS library.
// This ensures RSA keys are stored in $HOME/.android/ (mounted as a
// Docker volume) so the Shield only needs to confirm the fingerprint once.
//
// Prerequisites on the Shield:
//   Settings → Device Preferences → About → Build (tap 7×) → Developer options
//   Developer options → USB debugging → ON
//   Developer options → Network debugging → ON  (enables port 5555)
//
// On first connect the Shield shows an RSA fingerprint dialog — accept once.
// =====================================================================

import { execFile } from 'node:child_process';
import { log } from './logger.js';

// Last /proc/stat readings keyed by serial — used for incremental CPU calculation
const cpuSamples = new Map();

// ── helpers ─────────────────────────────────────────────────────────────────

function withTimeout(promise, ms, label = 'call') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms): ${label}`)), ms)
    ),
  ]);
}

// Run an adb command and return stdout as trimmed string.
function adb(args, timeoutMs = 10000) {
  return withTimeout(
    new Promise((resolve, reject) => {
      execFile('adb', args, { timeout: timeoutMs, env: { ...process.env, ADB_VENDOR_KEYS: '' } }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr?.trim() || err.message));
        resolve(stdout.trim());
      });
    }),
    timeoutMs,
    `adb ${args.slice(0, 2).join(' ')}`
  );
}

// Run a shell command on the device and return trimmed stdout.
async function shell(serial, cmd, timeoutMs) {
  return adb(['-s', serial, 'shell', cmd], timeoutMs);
}

// ── individual metric fetchers ───────────────────────────────────────────────

async function fetchCpu(serial, timeoutMs) {
  const out  = await shell(serial, 'cat /proc/stat', timeoutMs);
  const line = out.split('\n').find(l => l.startsWith('cpu ')) || '';
  const nums = line.replace(/^cpu\s+/, '').trim().split(/\s+/).map(Number);
  if (nums.length < 4) return null;

  const idle  = (nums[3] || 0) + (nums[4] || 0); // idle + iowait
  const total = nums.reduce((a, b) => a + b, 0);

  const prev = cpuSamples.get(serial);
  cpuSamples.set(serial, { idle, total });

  if (!prev) return null; // first reading — no delta yet
  const deltaIdle  = idle  - prev.idle;
  const deltaTotal = total - prev.total;
  if (deltaTotal <= 0) return null;
  return Math.round((1 - deltaIdle / deltaTotal) * 100);
}

async function fetchRam(serial, timeoutMs) {
  const out   = await shell(serial, 'cat /proc/meminfo', timeoutMs);
  const total = parseInt(out.match(/MemTotal:\s+(\d+)/)?.[1] || '0');
  const avail = parseInt(out.match(/MemAvailable:\s+(\d+)/)?.[1] ||
                         out.match(/MemFree:\s+(\d+)/)?.[1] || '0');
  if (!total) return null;
  const usedPct = Math.round(((total - avail) / total) * 100);
  const usedMb  = Math.round((total - avail) / 1024);
  const totalMb = Math.round(total / 1024);
  return { usedPct, usedMb, totalMb };
}

async function fetchTemp(serial, timeoutMs) {
  const out = await shell(
    serial,
    'for f in /sys/class/thermal/thermal_zone*/temp; do cat "$f" 2>/dev/null; echo; done',
    timeoutMs
  );
  const vals = out.split('\n')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0);
  if (!vals.length) return null;
  const raw = Math.max(...vals);
  return raw > 1000 ? Math.round(raw / 100) / 10 : raw; // millidegrees → °C
}

async function fetchApp(serial, timeoutMs) {
  const out = await shell(
    serial,
    'dumpsys window windows 2>/dev/null | grep -m1 mCurrentFocus',
    timeoutMs
  );
  const m = out.match(/mCurrentFocus=\S+\s+([\w.]+)\//);
  if (m) return m[1];
  // Fallback: activity manager
  const out2 = await shell(
    serial,
    'dumpsys activity activities 2>/dev/null | grep -m1 mResumedActivity',
    timeoutMs
  );
  const m2 = out2.match(/([\w.]+)\/([\w.]+)/);
  return m2 ? m2[1] : null;
}

// ── main export ───────────────────────────────────────────────────────────────

export async function shieldCheck(device, timeout) {
  const cfg          = device.shield || {};
  const host         = device.host;
  const port         = cfg.port || 5555;
  const selectedKeys = Array.isArray(cfg.metrics) ? cfg.metrics : [];
  const timeoutMs    = Math.max(8000, (timeout || 10) * 1000);
  const metricMs     = Math.min(timeoutMs, 6000);
  const serial       = `${host}:${port}`;

  const start = Date.now();

  // Connect (idempotent — adb daemon caches connections)
  try {
    const out = await adb(['connect', serial], timeoutMs);
    log.debug(`[shield] connect: ${out}`);
    if (out.includes('unable') || out.includes('failed')) {
      return { status: 'offline', latency: null, at: Date.now(), error: out };
    }
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: `ADB connect: ${err.message}` };
  }

  // Verify device is authorised
  try {
    const out = await adb(['devices'], 5000);
    const lines = out.split('\n').slice(1); // skip header
    const entry = lines.find(l => l.startsWith(serial));
    if (!entry) {
      return { status: 'offline', latency: null, at: Date.now(), error: 'Shield nicht in ADB-Geräteliste' };
    }
    const type = entry.split('\t')[1]?.trim();
    if (type !== 'device') {
      const hint = type === 'unauthorized'
        ? '— RSA-Fingerabdruck auf dem Shield bestätigen (Shield wecken & Startbildschirm zeigen)'
        : `— ADB state: ${type}`;
      return { status: 'offline', latency: null, at: Date.now(), error: `Shield nicht bereit ${hint}` };
    }
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: `adb devices: ${err.message}` };
  }

  const latency = Date.now() - start;
  const result  = { status: 'online', latency, at: Date.now(), metrics: [] };

  if (selectedKeys.length === 0) return result;

  const metricErrors = [];
  for (const key of selectedKeys) {
    try {
      if (key === 'cpu') {
        const pct = await fetchCpu(serial, metricMs);
        if (pct != null) result.metrics.push({ key, label: 'CPU-Auslastung', value: pct, format: 'percent' });
      } else if (key === 'ram') {
        const ram = await fetchRam(serial, metricMs);
        if (ram) result.metrics.push({
          key, label: `RAM (${ram.usedMb}/${ram.totalMb} MB)`,
          value: ram.usedPct, format: 'percent',
        });
      } else if (key === 'temp') {
        const t = await fetchTemp(serial, metricMs);
        if (t != null) result.metrics.push({ key, label: 'Temperatur', value: t, format: 'celsius' });
      } else if (key === 'app') {
        const app = await fetchApp(serial, metricMs);
        if (app) result.metrics.push({ key, label: 'Aktive App', value: app, format: 'text' });
      }
    } catch (e) {
      log.warn(`[shield] metric '${key}' fehlgeschlagen: ${e.message}`);
      metricErrors.push(`${key}: ${e.message}`);
    }
  }

  if (result.metrics.length === 0 && metricErrors.length > 0) {
    result.error = `Metriken fehlgeschlagen: ${metricErrors.join(' | ')}`;
  }

  return result;
}

export function getShieldPresets() {
  return [
    { id: 'basic', label: 'Basis (CPU + RAM)',   keys: ['cpu', 'ram'] },
    { id: 'full',  label: 'Vollständig',          keys: ['cpu', 'ram', 'temp', 'app'] },
  ];
}

export function getShieldMetricCatalog() {
  return [
    { key: 'cpu',  label: 'CPU-Auslastung',  format: 'percent' },
    { key: 'ram',  label: 'RAM-Auslastung',  format: 'percent' },
    { key: 'temp', label: 'Temperatur',      format: 'celsius' },
    { key: 'app',  label: 'Aktive App',      format: 'text'    },
  ];
}
