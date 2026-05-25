// Notification channels: discord, telegram, ntfy, webhook
// Events:  device.offline, device.online, metric.threshold

import { log } from './logger.js';

const lastSent = new Map(); // key = channelId:deviceId:event:metricKey, value = timestamp

// State for "minimum duration" rule evaluation:
//   "trigger only if condition has been true for N seconds"
// Map<deviceId+ruleId, { since: timestamp, triggered: boolean }>
const ruleState = new Map();

function within(ms) { return (ts) => ts && (Date.now() - ts) < ms; }

// ---------- Threshold rule evaluation ----------

/**
 * Check whether a per-device rule should fire given the latest result.
 * @param {Object} rule    — { event, channelId, metricKey?, op?, threshold?, durationSec?, cooldownMinutes? }
 * @param {Object} prev    — previous result object (or null)
 * @param {Object} current — current check result
 * @returns {Object|null}  — { ruleKey, value? } if rule triggers, else null
 */
export function evaluateRule(rule, prev, current, deviceId) {
  const ruleKey = `${deviceId}:${rule.id || rule.event + ':' + (rule.metricKey || '')}`;

  if (rule.event === 'device.offline') {
    if (prev?.status === 'online' && current.status === 'offline') {
      return { ruleKey };
    }
    return null;
  }
  if (rule.event === 'device.online') {
    if (prev?.status === 'offline' && current.status === 'online') {
      return { ruleKey };
    }
    return null;
  }
  if (rule.event === 'metric.threshold') {
    if (current.status !== 'online' || !Array.isArray(current.metrics)) return null;
    const m = current.metrics.find(x => x.key === rule.metricKey);
    if (!m || typeof m.value !== 'number' || !isFinite(m.value)) return null;

    const threshold = Number(rule.threshold);
    const op = rule.op || '>';
    let condition = false;
    if (op === '>')  condition = m.value >  threshold;
    if (op === '>=') condition = m.value >= threshold;
    if (op === '<')  condition = m.value <  threshold;
    if (op === '<=') condition = m.value <= threshold;
    if (op === '==') condition = m.value === threshold;
    if (op === '!=') condition = m.value !== threshold;

    const minDurMs = Math.max(0, (rule.durationSec || 0) * 1000);
    let s = ruleState.get(ruleKey);

    if (condition) {
      // condition true: track since-time
      if (!s) { s = { since: Date.now(), triggered: false }; ruleState.set(ruleKey, s); }
      const heldFor = Date.now() - s.since;
      if (heldFor >= minDurMs && !s.triggered) {
        s.triggered = true;
        return { ruleKey, value: m.value, label: m.label };
      }
      return null;
    } else {
      // condition false: reset
      if (s) ruleState.delete(ruleKey);
      return null;
    }
  }
  return null;
}

export function clearRuleState(deviceId) {
  for (const k of ruleState.keys()) {
    if (k.startsWith(deviceId + ':')) ruleState.delete(k);
  }
}

// ---------- Dispatch ----------

export async function dispatch(channel, payload) {
  if (!channel?.enabled) return { skipped: 'disabled' };

  // For non-rule-based (legacy global) dispatch, check the channel's events flag.
  // For rule-based dispatch (payload.fromRule), the rule has already decided.
  if (!payload.fromRule) {
    if (!channel?.events?.[payload.event]) return { skipped: 'event-disabled' };
  }

  // cooldown — include metric key so different metrics on same device get
  // independent cooldowns
  const cdMs = Math.max(0, (channel.cooldownMinutes ?? payload.cooldownMinutes ?? 5) * 60 * 1000);
  const key  = `${channel.id}:${payload.deviceId}:${payload.event}:${payload.metricKey || ''}`;
  if (cdMs > 0 && within(cdMs)(lastSent.get(key))) {
    return { skipped: 'cooldown' };
  }

  try {
    const type = channel.type;
    if (type === 'discord')  await sendDiscord(channel, payload);
    else if (type === 'telegram') await sendTelegram(channel, payload);
    else if (type === 'ntfy')     await sendNtfy(channel, payload);
    else if (type === 'webhook')  await sendWebhook(channel, payload);
    else throw new Error(`unknown channel type: ${type}`);
    lastSent.set(key, Date.now());
    return { ok: true };
  } catch (err) {
    log.error(`[notifier:${channel.type}]`, err.message);
    return { error: err.message };
  }
}

/** Send test message directly (ignores cooldown / event flags). */
export async function sendTest(channel) {
  const fake = {
    event: 'device.online',
    deviceId: '_test',
    title: '✅ NET.MONITOR Test',
    message: 'Dies ist eine Testbenachrichtigung von NET.MONITOR.',
    device: { name: 'Test-Gerät', host: '192.168.1.1', type: 'router' },
    status: 'online',
  };
  try {
    const type = channel.type;
    if (type === 'discord')       await sendDiscord(channel, fake);
    else if (type === 'telegram') await sendTelegram(channel, fake);
    else if (type === 'ntfy')     await sendNtfy(channel, fake);
    else if (type === 'webhook')  await sendWebhook(channel, fake);
    else throw new Error(`unknown channel type: ${type}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ----------------- senders -----------------

async function sendDiscord(channel, p) {
  const url = channel.config?.webhookUrl;
  if (!url) throw new Error('webhookUrl missing');
  const color = p.status === 'online' ? 0x10b981 : (p.event === 'metric.threshold' ? 0xf59e0b : 0xef4444);
  const fields = [
    { name: 'Gerät', value: p.device?.name || '—',  inline: true },
    { name: 'Host',  value: p.device?.host || '—', inline: true },
    { name: 'Status', value: (p.status || '—').toUpperCase(), inline: true },
  ];
  if (p.event === 'metric.threshold' && p.metricLabel != null) {
    fields.push({ name: p.metricLabel, value: String(p.value ?? '—'), inline: true });
  }
  const body = {
    username: 'NET.MONITOR',
    embeds: [{
      title: p.title,
      description: p.message,
      color,
      fields,
      timestamp: new Date().toISOString()
    }]
  };
  await postJSON(url, body);
}

async function sendTelegram(channel, p) {
  const token  = channel.config?.botToken;
  const chatId = channel.config?.chatId;
  if (!token || !chatId) throw new Error('botToken and chatId required');
  const emoji = p.status === 'online' ? '✅' : '🚨';
  const text =
    `${emoji} *${escapeMd(p.title)}*\n\n${escapeMd(p.message)}\n\n` +
    `Gerät: \`${escapeMd(p.device?.name || '—')}\`\n` +
    `Host: \`${escapeMd(p.device?.host || '—')}\`\n` +
    `Status: \`${(p.status || '—').toUpperCase()}\``;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await postJSON(url, { chat_id: chatId, text, parse_mode: 'MarkdownV2' });
}

async function sendNtfy(channel, p) {
  const topic    = channel.config?.topic;       // full URL like https://ntfy.sh/my-topic
  const priority = channel.config?.priority || 'default';
  if (!topic) throw new Error('topic URL required');
  const tags = p.status === 'online' ? 'white_check_mark' : 'rotating_light';
  const res = await fetch(topic, {
    method: 'POST',
    headers: {
      'Title': p.title,
      'Priority': priority,
      'Tags': tags,
      ...(channel.config?.token ? { 'Authorization': `Bearer ${channel.config.token}` } : {})
    },
    body: `${p.message}\n\nGerät: ${p.device?.name || '—'} (${p.device?.host || '—'})`
  });
  if (!res.ok) throw new Error(`ntfy HTTP ${res.status}`);
}

async function sendWebhook(channel, p) {
  const url     = channel.config?.url;
  const method  = (channel.config?.method || 'POST').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(channel.config?.headers || {}) };
  if (!url) throw new Error('url required');
  const body = {
    event: p.event,
    title: p.title,
    message: p.message,
    status: p.status,
    device: p.device,
    timestamp: new Date().toISOString(),
  };
  const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`webhook HTTP ${res.status}`);
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}

function escapeMd(str = '') {
  return String(str).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
