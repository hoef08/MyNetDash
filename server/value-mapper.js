// =====================================================================
// Value mapper — turns numeric/short codes into human-readable strings.
//
// Used to translate things like "printer status: 3" into "Idle".
// Applies device-level metric mappings (set in the editor) and exposes
// a library of standard SNMP / IETF mappings users can apply.
// =====================================================================

// Library of well-known mappings users can pick from in the editor.
// Each entry: { id, label, description, mapping: { value: text, ... } }
export const STANDARD_MAPPINGS = {
  // Printer MIB (RFC 3805) — hrPrinterStatus
  'printer-status': {
    label: 'Drucker-Status',
    description: 'hrPrinterStatus (RFC 3805)',
    mapping: {
      '1': 'Other',
      '2': 'Unbekannt',
      '3': 'Idle (bereit)',
      '4': 'Druckt',
      '5': 'Aufwärmen',
    },
  },
  // Printer MIB — hrPrinterDetectedErrorState (bit-field, but we approximate
  // common single-bit values; full bit decoding done separately if needed)
  'printer-error': {
    label: 'Drucker-Fehlerzustand',
    description: 'hrPrinterDetectedErrorState (Hex/Dezimal)',
    mapping: {
      '0':  'OK',
      '1':  'Tonerlevel niedrig',
      '2':  'Toner leer',
      '4':  'Tür offen',
      '8':  'Papierstau',
      '16': 'Papier niedrig',
      '32': 'Papier leer',
      '64': 'Output Tray voll',
      '80': 'Service erforderlich',
    },
  },

  // Interface status (IF-MIB) — ifOperStatus
  'if-oper-status': {
    label: 'Interface OperStatus',
    description: 'ifOperStatus (IF-MIB / RFC 2863)',
    mapping: {
      '1': 'up',
      '2': 'down',
      '3': 'testing',
      '4': 'unknown',
      '5': 'dormant',
      '6': 'notPresent',
      '7': 'lowerLayerDown',
    },
  },
  'if-admin-status': {
    label: 'Interface AdminStatus',
    description: 'ifAdminStatus (IF-MIB / RFC 2863)',
    mapping: {
      '1': 'up',
      '2': 'down',
      '3': 'testing',
    },
  },

  // Host Resources MIB — hrSystemDate has none, but hrDeviceStatus does
  'hr-device-status': {
    label: 'Host Device Status',
    description: 'hrDeviceStatus (HOST-RESOURCES-MIB)',
    mapping: {
      '1': 'unknown',
      '2': 'running',
      '3': 'warning',
      '4': 'testing',
      '5': 'down',
    },
  },

  // UPS-MIB upsOutputSource
  'ups-output-source': {
    label: 'UPS Output Source',
    description: 'upsOutputSource (RFC 1628)',
    mapping: {
      '1': 'other',
      '2': 'none',
      '3': 'normal',
      '4': 'bypass',
      '5': 'battery',
      '6': 'booster',
      '7': 'reducer',
    },
  },

  // Marantz/Denon power: not numeric but maps abbreviations to friendly text
  'avr-power': {
    label: 'AVR Power',
    description: 'Denon/Marantz Power-Status',
    mapping: {
      'ON': 'an',
      'STANDBY': 'aus',
      'OFF': 'aus',
    },
  },
  // Marantz/Denon common input names
  'avr-input': {
    label: 'AVR Eingang',
    description: 'Standard-Eingangs-Codes auf lange Namen',
    mapping: {
      'CD': 'CD',
      'TUNER': 'Tuner',
      'BD': 'Blu-ray',
      'DVD': 'DVD',
      'GAME': 'Spielekonsole',
      'AUX1': 'AUX 1',
      'AUX2': 'AUX 2',
      'TV': 'TV',
      'SAT/CBL': 'Sat / Kabel',
      'MPLAY': 'Media Player',
      'NET': 'Network',
      'BT': 'Bluetooth',
      'PHONO': 'Phono',
    },
  },

  // Hue dimmer-switch button events (last 4 digits encode button + action)
  'hue-button': {
    label: 'Hue Dimmer-Switch',
    description: 'Hue buttonevent codes',
    mapping: {
      '1000': 'On (initial press)',
      '1001': 'On (gedrückt halten)',
      '1002': 'On (kurz)',
      '1003': 'On (lang)',
      '2000': 'Hoch (initial press)',
      '2001': 'Hoch (gedrückt)',
      '2002': 'Hoch (kurz)',
      '2003': 'Hoch (lang)',
      '3000': 'Runter (initial press)',
      '3001': 'Runter (gedrückt)',
      '3002': 'Runter (kurz)',
      '3003': 'Runter (lang)',
      '4000': 'Off (initial press)',
      '4001': 'Off (gedrückt)',
      '4002': 'Off (kurz)',
      '4003': 'Off (lang)',
    },
  },
};

export function getStandardMappings() {
  return Object.entries(STANDARD_MAPPINGS).map(([id, m]) => ({ id, ...m }));
}

// ---------- Apply mappings to a check result ----------

/**
 * Given a check result and the device's metricMappings, replace the value of
 * each matching metric with the mapped text. Unmapped values are kept as-is
 * but appended with the raw code in parentheses for transparency:
 *   "Idle (3)"
 *
 * @param {Object} result    — check result (mutated in place)
 * @param {Object} mappings  — { metricKey: { '1':'OK','2':'Warning' } }
 */
export function applyMetricMappings(result, mappings) {
  if (!result || !Array.isArray(result.metrics)) return result;
  if (!mappings || typeof mappings !== 'object') return result;

  for (const m of result.metrics) {
    const map = mappings[m.key];
    if (!map || typeof map !== 'object') continue;
    if (m.value == null) continue;

    const lookup = String(m.value);
    const text = map[lookup];
    if (text != null) {
      // Keep the raw value alongside in 'rawValue' so notifications / charts
      // can still trigger on the numeric value if needed.
      m.rawValue = m.value;
      m.value = text;
      m.format = 'text';
    }
  }
  return result;
}
