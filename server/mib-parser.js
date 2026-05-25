import snmp from 'net-snmp';
import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || './data';
const MIB_DIR  = path.join(DATA_DIR, 'mibs');

async function ensureMibDir() {
  if (!existsSync(MIB_DIR)) await mkdir(MIB_DIR, { recursive: true });
}

// Map MIB SYNTAX (string or object) to our display format.
function formatFromSyntax(syntax) {
  if (!syntax) return 'text';
  const name = typeof syntax === 'string' ? syntax : Object.keys(syntax)[0] || 'text';

  switch (name) {
    case 'TimeTicks':
    case 'TimeStamp':
      return 'uptime';
    case 'Counter32':
    case 'Counter64':
    case 'Counter':
    case 'Gauge32':
    case 'Gauge':
    case 'Unsigned32':
    case 'Integer32':
    case 'INTEGER':
      return 'int';
    case 'DisplayString':
    case 'OCTET STRING':
    case 'OBJECT IDENTIFIER':
    case 'IpAddress':
    case 'MacAddress':
      return 'text';
    default:
      return 'text';
  }
}

function describeSyntax(syntax) {
  if (!syntax) return '';
  if (typeof syntax === 'string') return syntax;
  const key = Object.keys(syntax)[0];
  return key || '';
}

function shortLabel(name, description) {
  if (!description) return name;
  const firstSentence = String(description)
    .replace(/\s+/g, ' ')
    .split(/[.!?]/)[0]
    .trim();
  if (firstSentence.length > 3 && firstSentence.length < 80) return firstSentence;
  return name;
}

// --------- Core API ---------

/**
 * Parse a MIB file and return ALL loaded module names (uploaded file may
 * contain multiple modules). We isolate each upload in its own ModuleStore
 * so cross-file imports don't pollute each other's parsing state.
 */
export async function parseMibFile(filePath) {
  // Suppress stderr from net-snmp's parser warnings ("Unable to mount node…")
  // which are noisy and not actionable for our display-only use case.
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = () => true;

  const store = snmp.createModuleStore();
  const beforeNames = new Set(store.getModuleNames(true));
  try {
    store.loadFromFile(filePath);
  } catch (err) {
    process.stderr.write = origStderrWrite;
    throw new Error(`Parser-Fehler: ${err.message}`);
  }
  const afterNames = store.getModuleNames(true);
  const newModules = afterNames.filter((n) => !beforeNames.has(n) && n && n !== 'undefined');

  if (!newModules.length) {
    process.stderr.write = origStderrWrite;
    throw new Error('Keine gültigen MIB-Module in der Datei gefunden.');
  }

  const modules = newModules.map((name) => summarizeModule(store, name));
  process.stderr.write = origStderrWrite;
  return { modules };
}

function summarizeModule(store, moduleName) {
  const mod = store.getModule(moduleName) || {};
  const providers = store.getProvidersForModule(moduleName) || [];

  const scalars = providers.filter((p) => p.type === snmp.MibProviderType.Scalar);
  const tables  = providers.filter((p) => p.type === snmp.MibProviderType.Table);

  const metrics = scalars.map((p) => {
    const def = mod[p.name] || {};
    const syntax = def.SYNTAX;
    return {
      key: sanitizeKey(p.name),
      label: shortLabel(p.name, def.DESCRIPTION),
      oid: normalizeOid(p.oid) + '.0',   // scalar leaf → .0
      format: formatFromSyntax(syntax),
      _syntax: describeSyntax(syntax),
      _description: def.DESCRIPTION ? String(def.DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 200) : null,
    };
  });

  return {
    name: moduleName,
    scalarCount: scalars.length,
    tableCount:  tables.length,
    metrics,
  };
}

function sanitizeKey(name) {
  return String(name).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
}

// net-snmp's MIB parser sometimes emits OIDs with a leading dot when the
// root ISO(1) node is not resolvable (e.g. modules that reference numeric
// parents directly). Normalize: strip the leading dot, and prepend '1' if
// the resulting OID starts with '3' (the typical ISO-missing symptom).
function normalizeOid(oid) {
  if (!oid) return oid;
  let s = String(oid);
  if (s.startsWith('.')) s = s.slice(1);
  // If OID starts with 3.6.1 it's almost certainly missing the leading 1
  // (iso = 1). Full standard prefix is 1.3.6.1.
  if (s.startsWith('3.6.1.')) s = '1.' + s;
  return s;
}

/**
 * Save an uploaded MIB file's content to disk so we can list/reload it later.
 * Returns the file path.
 */
export async function saveMibFile(filename, content) {
  await ensureMibDir();
  // sanitize filename: keep letters/digits/-._, strip anything else
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9_.\-]/g, '_');
  if (!safe) throw new Error('Ungültiger Dateiname');
  const filePath = path.join(MIB_DIR, safe);
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

/**
 * List all uploaded MIB files with their parsed module summaries.
 * Errors in individual files are reported inline, not thrown.
 */
export async function listUploadedMibs() {
  await ensureMibDir();
  const files = await readdir(MIB_DIR);
  const out = [];
  for (const filename of files.filter((f) => !f.startsWith('.'))) {
    const filePath = path.join(MIB_DIR, filename);
    try {
      const { modules } = await parseMibFile(filePath);
      out.push({ filename, modules });
    } catch (err) {
      out.push({ filename, error: err.message, modules: [] });
    }
  }
  return out;
}

export async function deleteMibFile(filename) {
  const safe = path.basename(filename);
  const filePath = path.join(MIB_DIR, safe);
  if (!existsSync(filePath)) return false;
  await unlink(filePath);
  return true;
}
