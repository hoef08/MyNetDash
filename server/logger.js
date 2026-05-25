// ─────────────────────────────────────────────────────────────────────────────
// Lightweight level-aware logger
//
// Levels (ascending verbosity):
//   error (0) — only errors
//   warn  (1) — errors + warnings
//   info  (2) — default; adds operational status messages
//   debug (3) — everything, including verbose per-call traces
//
// Call setLogLevel('debug') at any time; takes effect immediately.
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

let current = LEVELS.info; // default

export function setLogLevel(name) {
  const lvl = LEVELS[name];
  if (lvl === undefined) {
    console.warn(`[logger] Unbekannter Log-Level: "${name}" — ignoriert`);
    return;
  }
  current = lvl;
  // Always print this confirmation regardless of level so the operator can
  // verify the setting took effect.
  console.log(`[logger] Log-Level: ${name}`);
}

export function getLogLevel() {
  return Object.keys(LEVELS).find(k => LEVELS[k] === current) || 'info';
}

// Returns a console.log-compatible function that is only active at DEBUG level.
// Useful for passing as a library `logger` option.
export function debugLogger() {
  return current >= LEVELS.debug ? console.log.bind(console) : null;
}

export const log = {
  error: (...a) => { if (current >= LEVELS.error) console.error(...a); },
  warn:  (...a) => { if (current >= LEVELS.warn)  console.warn(...a);  },
  info:  (...a) => { if (current >= LEVELS.info)  console.log(...a);   },
  debug: (...a) => { if (current >= LEVELS.debug) console.log(...a);   },
};
