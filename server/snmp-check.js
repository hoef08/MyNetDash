import snmp from 'net-snmp';

// --------- MIB Presets ---------
// Common metric bundles for 1-click configuration.

export const PRESETS = {
  'system-base': {
    label: 'System Info (RFC 1213)',
    description: 'Standard SNMP: sysName, sysDescr, sysUpTime, sysLocation',
    metrics: [
      { key: 'sysName',    label: 'System-Name', oid: '1.3.6.1.2.1.1.5.0', format: 'text'   },
      { key: 'sysDescr',   label: 'Beschreibung', oid: '1.3.6.1.2.1.1.1.0', format: 'text'   },
      { key: 'sysUptime',  label: 'Uptime',      oid: '1.3.6.1.2.1.1.3.0', format: 'uptime' },
      { key: 'sysLocation', label: 'Standort',    oid: '1.3.6.1.2.1.1.6.0', format: 'text'   },
    ]
  },
  'linux-ucd': {
    label: 'Linux (UCD-SNMP)',
    description: 'CPU-Load, RAM-Auslastung, Uptime — funktioniert auf Linux mit snmpd',
    metrics: [
      { key: 'uptime',    label: 'Uptime',       oid: '1.3.6.1.2.1.1.3.0',        format: 'uptime'  },
      { key: 'loadAvg1',  label: 'Load Ø 1m',    oid: '1.3.6.1.4.1.2021.10.1.3.1', format: 'float'   },
      { key: 'loadAvg5',  label: 'Load Ø 5m',    oid: '1.3.6.1.4.1.2021.10.1.3.2', format: 'float'   },
      { key: 'memTotal',  label: 'RAM gesamt',   oid: '1.3.6.1.4.1.2021.4.5.0',   format: 'kbytes'  },
      { key: 'memAvail',  label: 'RAM frei',     oid: '1.3.6.1.4.1.2021.4.6.0',   format: 'kbytes'  },
      { key: 'memUsagePct', label: 'RAM-Auslastung',
        expression: 'memTotal memAvail - memTotal / 100 *', format: 'percent' },
    ]
  },
  'hostresources': {
    label: 'Host Resources MIB',
    description: 'CPU-Last, Prozess-Anzahl — Standard für viele Systeme',
    metrics: [
      { key: 'uptime',    label: 'Uptime',       oid: '1.3.6.1.2.1.25.1.1.0',     format: 'uptime' },
      { key: 'numUsers',  label: 'Aktive User',  oid: '1.3.6.1.2.1.25.1.5.0',     format: 'int' },
      { key: 'numProcs',  label: 'Prozesse',     oid: '1.3.6.1.2.1.25.1.6.0',     format: 'int' },
    ]
  },
  'synology': {
    label: 'Synology DSM',
    description: 'Systemstatus, Temperatur, Lüfter. Erfordert aktiviertes SNMP im DSM.',
    metrics: [
      { key: 'model',     label: 'Modell',       oid: '1.3.6.1.4.1.6574.1.5.1.0', format: 'text'   },
      { key: 'serial',    label: 'Seriennummer', oid: '1.3.6.1.4.1.6574.1.5.2.0', format: 'text'   },
      { key: 'tempC',     label: 'Temperatur',   oid: '1.3.6.1.4.1.6574.1.2.0',   format: 'celsius' },
      { key: 'uptime',    label: 'Uptime',       oid: '1.3.6.1.2.1.1.3.0',        format: 'uptime' },
      { key: 'systemStatus', label: 'Systemstatus', oid: '1.3.6.1.4.1.6574.1.1.0', format: 'int' },
    ]
  },
  'printer': {
    label: 'Drucker (Printer MIB)',
    description: 'Status, Seitenzahl, Fehler — RFC 3805',
    metrics: [
      { key: 'printerStatus', label: 'Druckerstatus', oid: '1.3.6.1.2.1.25.3.5.1.1.1', format: 'int' },
      { key: 'printerAlert',  label: 'Fehlerstatus',  oid: '1.3.6.1.2.1.25.3.5.1.2.1', format: 'int' },
      { key: 'totalPages',    label: 'Seiten gesamt', oid: '1.3.6.1.2.1.43.10.2.1.4.1.1', format: 'int' },
    ]
  },
  'interface-stats': {
    label: 'Netzwerk-Interface #1',
    description: 'Inbound/Outbound-Traffic auf Interface Index 1',
    metrics: [
      { key: 'ifDescr',     label: 'Interface',   oid: '1.3.6.1.2.1.2.2.1.2.1',    format: 'text'  },
      { key: 'ifInOctets',  label: 'RX Bytes',    oid: '1.3.6.1.2.1.2.2.1.10.1',   format: 'bytes' },
      { key: 'ifOutOctets', label: 'TX Bytes',    oid: '1.3.6.1.2.1.2.2.1.16.1',   format: 'bytes' },
    ]
  }
};

export function getPresets() {
  return Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label, description: p.description, metrics: p.metrics }));
}

// --------- Session helpers ---------
function versionFromString(v) {
  if (v === '1' || v === 1)  return snmp.Version1;
  if (v === '3' || v === 3)  return snmp.Version3;
  return snmp.Version2c;
}

function openSession(device, timeoutSec = 4) {
  const conf = device.snmp || {};
  const community = conf.community || 'public';
  const version = versionFromString(conf.version);
  const port = Number(conf.port) || 161;
  const target = device.host;

  const opts = {
    port,
    retries: 1,
    timeout: Math.max(1000, timeoutSec * 1000),
    version,
    transport: 'udp4',
  };

  if (version === snmp.Version3) {
    const user = {
      name: conf.user || 'initial',
      level: conf.authKey && conf.privKey
        ? snmp.SecurityLevel.authPriv
        : (conf.authKey ? snmp.SecurityLevel.authNoPriv : snmp.SecurityLevel.noAuthNoPriv),
      authProtocol: (conf.authProtocol === 'sha') ? snmp.AuthProtocols.sha : snmp.AuthProtocols.md5,
      authKey: conf.authKey,
      privProtocol: (conf.privProtocol === 'aes') ? snmp.PrivProtocols.aes : snmp.PrivProtocols.des,
      privKey: conf.privKey
    };
    return snmp.createV3Session(target, user, opts);
  }
  return snmp.createSession(target, community, opts);
}

function parseVarbind(vb) {
  if (snmp.isVarbindError(vb)) return { error: snmp.varbindError(vb) };
  const val = vb.value;
  if (Buffer.isBuffer(val))    return { value: val.toString('utf-8').trim(), type: vb.type };
  if (typeof val === 'bigint') return { value: Number(val), type: vb.type };
  return { value: val, type: vb.type };
}

// --------- Expression evaluator (RPN) ---------
// Lets users compose metrics like `memTotal memAvail - memTotal / 100 *`
// Operators: + - * / % min max
function evalExpression(expr, context) {
  if (!expr) return null;
  const tokens = String(expr).trim().split(/\s+/);
  const stack = [];
  for (const tok of tokens) {
    if (/^-?\d+(\.\d+)?$/.test(tok)) {
      stack.push(Number(tok));
    } else if (['+','-','*','/','%'].includes(tok)) {
      const b = stack.pop(), a = stack.pop();
      if (a == null || b == null) return null;
      if (tok === '+') stack.push(a + b);
      if (tok === '-') stack.push(a - b);
      if (tok === '*') stack.push(a * b);
      if (tok === '/') stack.push(b === 0 ? 0 : a / b);
      if (tok === '%') stack.push(a % b);
    } else if (tok === 'min' || tok === 'max') {
      const b = stack.pop(), a = stack.pop();
      stack.push(tok === 'min' ? Math.min(a, b) : Math.max(a, b));
    } else {
      // variable reference
      const v = context[tok];
      if (v == null || typeof v !== 'number') return null;
      stack.push(v);
    }
  }
  return stack.length ? stack[0] : null;
}

// --------- Main check ---------
export async function snmpCheck(device, timeoutSec = 4) {
  // Collect OIDs from custom metrics (with backward-compat defaults).
  let metricsDef = device.snmp?.metrics;
  if (!Array.isArray(metricsDef) || !metricsDef.length) {
    // Legacy default: behave like previous version.
    metricsDef = PRESETS['linux-ucd'].metrics;
  }

  // Separate metrics requiring SNMP queries from computed (expression) ones.
  const oidMetrics  = metricsDef.filter(m => m.oid);
  const exprMetrics = metricsDef.filter(m => !m.oid && m.expression);

  let session;
  const start = performance.now();
  try {
    session = openSession(device, timeoutSec);
    const oids = oidMetrics.map(m => m.oid);

    const raw = await new Promise((resolve) => {
      if (!oids.length) return resolve({ ok: true, values: {} });
      session.get(oids, (err, varbinds) => {
        if (err) return resolve({ ok: false, error: err.message || String(err) });
        const out = {};
        varbinds.forEach((vb, i) => {
          const parsed = parseVarbind(vb);
          if (parsed.error == null) out[oidMetrics[i].key] = parsed.value;
        });
        resolve({ ok: true, values: out });
      });
    });

    const latency = Math.round(performance.now() - start);
    if (!raw.ok) {
      return { status: 'offline', latency: null, at: Date.now(), error: raw.error };
    }

    // Compute derived/expression metrics
    for (const m of exprMetrics) {
      const v = evalExpression(m.expression, raw.values);
      if (v != null) raw.values[m.key] = v;
    }

    // Build ordered output respecting the user's metric order
    const metrics = metricsDef.map(m => ({
      key: m.key,
      label: m.label,
      format: m.format || 'text',
      value: raw.values[m.key] ?? null,
    }));

    return { status: 'online', latency, at: Date.now(), metrics };
  } catch (err) {
    return { status: 'offline', latency: null, at: Date.now(), error: err.message || String(err) };
  } finally {
    if (session) { try { session.close(); } catch {} }
  }
}

// --------- Ad-hoc SNMP GET (for the editor "Test"/"Walk" button) ---------
export async function snmpGet(device, oids, timeoutSec = 4) {
  const list = Array.isArray(oids) ? oids : [oids];
  let session;
  try {
    session = openSession(device, timeoutSec);
    const result = await new Promise((resolve) => {
      session.get(list, (err, varbinds) => {
        if (err) return resolve({ ok: false, error: err.message || String(err) });
        const out = varbinds.map((vb, i) => {
          const parsed = parseVarbind(vb);
          return {
            oid: list[i],
            error: parsed.error || null,
            value: parsed.value ?? null,
            type: parsed.type ? snmp.ObjectType[parsed.type] || parsed.type : null,
          };
        });
        resolve({ ok: true, results: out });
      });
    });
    return result;
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    if (session) { try { session.close(); } catch {} }
  }
}

// --------- SNMP Walk (for discovering OIDs under a subtree) ---------
export async function snmpWalk(device, rootOid, timeoutSec = 6, maxResults = 80) {
  let session;
  try {
    session = openSession(device, timeoutSec);
    const results = [];
    const hardDeadline = new Promise((resolve) =>
      setTimeout(() => resolve('deadline'), (timeoutSec + 2) * 1000)
    );
    const walkDone = new Promise((resolve, reject) => {
      session.subtree(rootOid, 20, (varbinds) => {
        for (const vb of varbinds) {
          if (results.length >= maxResults) return;
          const parsed = parseVarbind(vb);
          results.push({
            oid: vb.oid,
            error: parsed.error || null,
            value: parsed.value ?? null,
            type: parsed.type ? snmp.ObjectType[parsed.type] || parsed.type : null,
          });
        }
      }, (err) => err ? reject(err) : resolve('ok'));
    }).catch(() => 'error');
    await Promise.race([walkDone, hardDeadline]);
    return { ok: true, results, partial: results.length >= maxResults };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    if (session) { try { session.close(); } catch {} }
  }
}
