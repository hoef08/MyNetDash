# NET.MONITOR

Leichtgewichtiges Network-Monitoring-Dashboard für dein Heimnetz. Läuft als
Docker-Container auf Raspberry Pi (ARM64/ARMv7) oder jedem Docker-Host.

- 🖥️  Dashboard im Browser (dark terminal aesthetic, **umschaltbar auf Hell**)
- 🎨  **Theme-Wechsel**: Dunkel, Hell oder Auto (folgt dem System)
- 🌐  HTTP / HTTPS / TCP-Checks
- 📡  SNMP v1/v2c/v3 mit frei konfigurierbaren OIDs pro Gerät
- 📞  **FRITZ!Box-Integration** — TR-064/UPnP für Online-Status,
      Bandbreite, WLAN-Clients, externe IP, Verbindungs-Uptime und mehr
- 🎵  **Denon/Marantz AVR-Integration** — Power, Eingang, Lautstärke,
      Sound-Mode, Zone 2 etc. via HTTP/XML-API
- 💡  **Philips Hue-Integration** — Bridge-Status, Lampen, Sensoren,
      Schalter und Gruppen einzeln auswählbar
- 🌐  **Salt Fiber Box-Integration** — Modell, Firmware, IPv4/IPv6 und
      optische Telemetrie (RX/TX-Power, Temperatur, Bias-Strom)
- 🔊  **Amazon Echo / Alexa-Integration** — Online-Status, Wiedergabe-Infos,
      Lautstärke, Nicht stören und mehr; sicheres Login via eingebetteten Proxy
- 🎮  **NVIDIA Shield-Integration** — CPU, RAM, Temperatur und aktive App
      via ADB über TCP/IP
- 🔠  **Wert-Mappings** — übersetze numerische Codes (z.B. Drucker-Status `3`)
      in lesbaren Text (`Idle`)
- 📄  **MIB-Datei-Upload** — `.mib`-Files hochladen, Metriken direkt aus dem
      MIB in die Kachel übernehmen
- 🎛️  MIB-Presets (Linux UCD, Synology, Printer MIB, Host-Resources…)
- 🔍  Live SNMP-Walk im Editor
- 📈  Historische Graphen für Latenz und jede numerische SNMP-Metrik
- 🔔  Benachrichtigungen (Discord, Telegram, ntfy.sh, Webhook)
  mit **pro-Gerät-Regeln** und Schwellwert-basierten Alarmen
- ⏰  **Server-interner Scheduler** — Checks und Notifications laufen
  unabhängig davon, ob das Dashboard im Browser offen ist
- ↕️  **Drag & Drop** zum Umsortieren der Gerät-Kacheln
- 📋  **Konfigurierbarer Log-Level** — error / warn / info / debug, über die UI
      einstellbar, sofort wirksam ohne Neustart
- 💾  Persistente Config, History & MIBs in Docker-Volume
- 🐳  Multi-arch Docker-Image (amd64, arm64, arm/v7)

---

## Schnellstart auf dem Raspberry Pi

```bash
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# einmal aus- und wieder einloggen
```

```bash
scp net-monitor.tar.gz pi@<pi-ip>:~
ssh pi@<pi-ip>
tar -xzf net-monitor.tar.gz
cd net-monitor
ls -la public server Dockerfile package.json    # Sanity-Check
docker compose up -d --build
```

Aufrufen: `http://<PI-IP>:3000`

---

## Theme wechseln

Oben im Header ist ein **Theme-Icon** (Mond/Sonne/Halbmond) direkt neben den
anderen Buttons — klicken wechselt zyklisch zwischen **Dunkel**, **Hell** und
**Auto**. Alternativ in **Einstellungen → Erscheinungsbild** mit einem
3-Way-Switch wählen.

- **Dunkel**: NOC-Terminal-Look (Default)
- **Hell**: klare helle Flächen mit guter Lesbarkeit, speziell für taghelle
  Umgebungen
- **Auto**: folgt der System-Einstellung deines OS bzw. Browsers
  (`prefers-color-scheme`), inkl. automatischem Wechsel wenn das System z.B.
  abends umschaltet

Die Einstellung wird im `localStorage` des Browsers gespeichert — also pro
Gerät/Browser separat, ohne Server-Round-Trip. Theme wird synchron vor dem
ersten Paint gesetzt, d.h. kein "Flash of wrong theme" beim Laden.

---

## Log-Level

In **Einstellungen → Log-Level** (neben Intervall und Timeout) lässt sich die
Ausführlichkeit der Server-Logs einstellen:

| Level          | Was wird geloggt                                                |
| -------------- | --------------------------------------------------------------- |
| Nur Fehler     | Kritische Fehler (Storage, Flush, Notifier)                     |
| Warnungen      | Fehler + Warnungen (API-Timeouts, fehlende Geräte, …)           |
| Standard       | + Betriebsmeldungen: Scheduler, Auth-Login, Cookie-Refresh      |
| Ausführlich    | + Jeder API-Aufruf inkl. alexa-remote2-Proxy-Ausgaben           |

Der Level wird in `db.json` gespeichert, beim Start sofort angewendet und
bei jedem Speichern der Einstellungen ohne Container-Neustart übernommen.

---

## MIB-Dateien verwenden

Fast jeder Hersteller liefert `.mib`-Dateien für seine Netzwerkgeräte mit —
z.B. APC USV, HP/Aruba Switches, Cisco Router, Synology NAS, Drucker. Statt
die OIDs aus der Dokumentation abzuschreiben, lädst du die MIB-Datei hoch und
wählst die gewünschten Metriken aus einem Dropdown aus.

### So geht's

1. **Einstellungen → MIB-Dateien → "+ MIB-Datei hochladen"** (Drag&Drop funktioniert
   auch über das versteckte File-Input).
2. Datei auswählen (`.mib`, `.txt`, `.my` — alles was ASN.1-MIB-Syntax enthält).
3. Der Parser extrahiert automatisch:
   - **Modulnamen** (z.B. `SYNOLOGY-SYSTEM-MIB`)
   - **Alle skalaren OIDs** mit Namen, OID, Beschreibung und Typ
   - **Format-Mapping**: `TimeTicks` → uptime, `Counter32`/`Gauge32` → int,
     `DisplayString` → text etc.
4. Im **Device-Editor** (SNMP-Gerät bearbeiten) erscheint das Dropdown
   **"MIB-Metrik einfügen…"** mit allen importierten OIDs — auswählen →
   "Hinzufügen" → fertig.

### Format-Erkennung

| MIB-Syntax                                       | Anzeige-Format    |
| ------------------------------------------------ | ----------------- |
| `TimeTicks`, `TimeStamp`                         | `uptime` (`3d 14h`) |
| `Counter32`, `Counter64`, `Gauge32`, `Integer32` | `int`             |
| `DisplayString`, `OCTET STRING`, `IpAddress`     | `text`            |
| sonstige                                         | `text` (Fallback) |

Du kannst das Format pro Metrik im Device-Editor nachträglich ändern — z.B.
einen `Counter32`-Wert, der in Bytes gezählt wird, auf `bytes` stellen, damit
auto-skaliert in MB/GB angezeigt wird.

### Einschränkungen

- **IMPORT-Abhängigkeiten**: Wenn dein MIB `IMPORTS xxx FROM YYY-MIB` macht
  und du YYY-MIB nicht auch hochlädst, werden OIDs unterhalb unbekannter
  Parents nicht aufgelöst. Lösung: auch die abhängigen MIBs (oder zumindest
  die Basis-MIBs) hochladen.
- **Nur skalare OIDs** werden automatisch als Metriken angeboten. Table-OIDs
  (z.B. ifTable) ignorieren wir — die musst du ggf. über SNMP-Walk und
  "Custom OID" einbinden, weil du für Tables einen konkreten Row-Index brauchst.
- **Dateigröße**: max. 4 MB pro Datei.

### MIBs finden

- **Synology**: https://global.download.synology.com/download/Document/Software/DeveloperGuide/Firmware/DSM/All/enu/Synology_DiskStation_MIB_Guide.pdf enthält Links
- **HP/Aruba/Cisco**: Jeweils auf der Support-Seite des Geräts
- **APC**: `PowerNet-MIB` — sehr verbreitet für USVs
- **Allgemein**: https://mibs.observium.org/ sammelt viele Hersteller-MIBs

---

## SNMP-Metriken pro Gerät konfigurieren

Drei Wege im Device-Editor (Check-Methode = SNMP):

1. **Preset einfügen** — vordefinierte Bundles für Linux UCD, Synology,
   Printer MIB, Host-Resources, Interface-Stats, System-Base.
2. **MIB-Metrik einfügen** — aus hochgeladenen MIB-Dateien (siehe oben).
3. **SNMP-Walk** — live abfragen, was dein Gerät antwortet, und direkt übernehmen.
4. **+ Eigene** — manuelle OID.

---

## Gerät löschen

- **Desktop**: Mülleimer-Icon oben rechts auf der Kachel beim Drüberfahren
- **Immer auffindbar**: Stift-Icon → **Bearbeiten** → unten links **Löschen**

---

## SNMP auf Zielgeräten aktivieren

Linux (Pi / Ubuntu / Debian):
```bash
sudo apt install -y snmpd
sudo sed -i 's/^agentaddress.*/agentaddress 0.0.0.0:161/' /etc/snmp/snmpd.conf
sudo tee -a /etc/snmp/snmpd.conf >/dev/null <<'EOF'
rocommunity public default -V systemonly
view systemonly included .1.3.6.1.2.1.1
view systemonly included .1.3.6.1.2.1.25.1
view systemonly included .1.3.6.1.4.1.2021
EOF
sudo systemctl restart snmpd
```

**Synology DSM**: Systemsteuerung → Terminal & SNMP → v2c, Community `public`.
**FRITZ!Box**: kein SNMP, aber eigene Check-Methode → siehe nächster Abschnitt.

---

## FRITZ!Box-Integration

Die FRITZ!Box bietet kein SNMP, aber eine eigene Schnittstelle namens **TR-064**
(SOAP/UPnP). NET.MONITOR hat dafür einen eigenen Check-Typ "FRITZ!Box" mit
vorgefertigten Metriken.

**Voraussetzung:** In der FRITZ!Box unter
**Heimnetz → Netzwerk → Netzwerkeinstellungen** folgendes aktivieren:
- ☑ "Zugriff für Anwendungen zulassen"
- ☑ "Statusinformationen über UPnP übertragen"

### Verfügbare Metriken

**Ohne Login** (basis-funktional, einfachster Einstieg):
- Verbindungsstatus (Connected/Disconnected)
- Externe IP
- Verbindungs-Uptime
- Aktuelle Down/Upload-Rate (MBit/s)
- Total empfangene/gesendete Bytes
- Maximale DSL-Sync-Rate

**Mit Benutzer + Passwort** (zusätzlich):
- Modell, Firmware-Version, Seriennummer
- Box-Uptime
- WLAN aktiv (2.4 GHz / 5 GHz / Gast)
- Anzahl WLAN-Clients pro Band
- Gesamtanzahl Geräte im Netz

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: FRITZ!Box**
2. Optional Benutzer/Passwort eingeben (für Login-pflichtige Metriken)
3. **Preset** wählen (z.B. "FRITZ!Box Basis") → die typischen Metriken werden
   automatisch ausgewählt
4. Optional einzelne Metriken via Checkbox ergänzen/entfernen
5. **"Verbindung testen"** klicken — zeigt sofort die Live-Werte
6. Speichern

### Benutzer in der FRITZ!Box anlegen (für Login-pflichtige Metriken)

In der FRITZ!Box:
1. **System → FRITZ!Box-Benutzer → Benutzer**
2. **Benutzer hinzufügen**, z.B. Name `monitor`
3. Passwort vergeben
4. Alle Häkchen rausnehmen außer **"FRITZ!Box-Einstellungen"** (read-only reicht)
5. Speichern → in NET.MONITOR diese Anmeldedaten eintragen

---

## Denon / Marantz AVR-Integration

Funktioniert mit allen netzwerkfähigen Denon- und Marantz-AVRs (Cinema-Reihe,
AVR-X, NR/SR-Modelle). Liest den Receiver-Status read-only über die
HTTP/XML-API.

**Voraussetzung:** Im AVR-Menü unter
**Netzwerk → Netzwerksteuerung** auf **"Immer Ein"** stellen — sonst antwortet
der Receiver im Standby nicht.

### Verfügbare Metriken

**Hauptzone:** Power (ON/STANDBY), aktiver Eingang (MPLAY, BD, TV…),
Lautstärke in dB, Mute, Sound-Mode (Stereo, Movie, Music…).

**Zone 2** (falls genutzt): Power, Eingang, Lautstärke, Mute.

**Geräteinfo:** Modell, Marke, Firmware-Version.

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: Denon / Marantz AVR**
2. **Port** kannst du leer lassen (Default 8080) — neuere Modelle (2016+)
   nutzen 8080, ältere Port 80. Wenn der konfigurierte Port nicht antwortet,
   probiert NET.MONITOR automatisch den anderen.
3. **Preset** wählen (z.B. "AVR Basis (Hauptzone)")
4. Optional einzelne Metriken via Checkbox ergänzen
5. **"Verbindung testen"** klicken — Live-Werte erscheinen sofort
6. Speichern

Tipp: Eine Notification-Regel `power == "ON"` zu setzen ist eine schicke Art,
sich benachrichtigen zu lassen wenn jemand den Receiver einschaltet. Oder
Lautstärke-Verläufe als History-Graph mitschneiden lassen.

---

## Philips Hue-Integration

Funktioniert mit allen Hue-Bridges über die lokale **API v1**.
Liest read-only: Bridge-Status, Lampen, Sensoren, Schalter, Gruppen.

**Voraussetzung:** API-Token (Username) auf der Hue Bridge angelegt. Falls
du noch keinen hast:

```bash
# 1. Bridge-Knopf drücken
# 2. Innerhalb 30 Sekunden:
curl -X POST http://<bridge-ip>/api \
  -d '{"devicetype":"net-monitor#mein-pi"}'
# → liefert: [{"success":{"username":"abcdefg1234567..."}}]
```

### Verfügbare Metriken

**Übersicht** (immer verfügbar — Werte aus dem ganzen System):
- Bridge-Name, Modell, Software-Version, API-Version, ZigBee-Kanal
- Update verfügbar (ja/nein)
- Lampen gesamt / erreichbar / an / nicht erreichbar
- Sensoren gesamt, mit niedriger Batterie
- Schalter gesamt
- Gruppen gesamt, mit Licht an

**Einzelne Geräte** (nach Auswahl per "Geräte erkennen"-Button):
- **Lampen**: an/aus, erreichbar, Helligkeit (%)
- **Bewegungsmelder**: Bewegung erkannt, Batterie, letzter Trigger
- **Temperatursensoren**: Temperatur in °C, Batterie
- **Helligkeitssensoren**: Lux-Wert, dunkel ja/nein
- **Schalter** (Dimmer/Tap): Batterie, letzter Knopf-Druck
- **Gruppen/Räume**: Anzahl Lampen, Licht an, alle an

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: Philips Hue Bridge**
2. **API-Token** und Host der Bridge eintragen, Port 80 als Default
3. **Preset** wählen (z.B. "Hue Übersicht") → typische Bridge-Metriken sind ausgewählt
4. Optional: **"Geräte erkennen"** klicken → die Bridge wird abgefragt und alle
   Lampen, Sensoren, Schalter, Gruppen erscheinen gruppiert. Per Klick anwählen,
   was du überwachen willst.
5. **"Verbindung testen"** zeigt sofort Live-Werte
6. Speichern

### Schöne Use-Cases

- **Notification "Sensor mit niedriger Batterie ≥ 1"** → Erinnerung, Batterien zu wechseln
- **Notification "Lampen nicht erreichbar > 0"** → Warnung wenn ZigBee-Probleme auftreten
- **History-Graph "Lampen an"** → siehst über die Zeit, wie das Haus aktiv ist
- **Notification "Update verfügbar = ja"** → wirst informiert wenn die Bridge ein Update hat

---

## Salt Fiber Box-Integration

Liest read-only über die JSON-API `/api/device` Status, Netzwerk und
**optische Telemetrie** der Salt Fiber Box (W7, X6 und ältere Modelle).
Kein Login erforderlich für diesen Endpunkt.

**Wichtig:** Die Box nutzt HTTPS mit selbst-signiertem Zertifikat.
Cert-Validierung wird für diesen Endpunkt deaktiviert (sicher im LAN-Kontext).

### Verfügbare Metriken (16)

**Geräte-Info:**
- Modell, Firmware-Version, Hardware-Version, Boot-Code, Seriennummer
- OLT Vendor-ID und OLT-Version

**Netzwerk:**
- IPv4-Adresse + DNS
- IPv6-Adresse + DNS

**Optische Telemetrie (für PON-Diagnose):**
- **Temperatur** (°C) — Modul-Temperatur
- **Spannung** (V) — Versorgungsspannung
- **Bias-Strom** (mA) — Laser-Bias
- **RX-Leistung** (dBm) — Empfangs-Pegel, sollte zwischen -27 und -8 dBm
- **TX-Leistung** (dBm) — Sende-Pegel, normalerweise 0 bis +9 dBm

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: Salt Fiber Box**
2. Host eintragen (z.B. `192.168.1.1`), Port leer lassen (Default 443)
3. HTTPS-Checkbox angehakt lassen
4. **Preset "Salt Optical-Telemetrie"** anwenden → wichtige PON-Werte sind ausgewählt
5. **"Verbindung testen"** → Live-Werte erscheinen
6. Speichern

### Sinnvolle Notification-Regeln

Die optischen Werte sind perfekt für Threshold-Notifications, weil sie als
echte Zahlen geliefert werden:

- **`rxPower < -25`** → Glasfaser-Empfang verschlechtert sich (Vorwarnung
  bevor die Verbindung ausfällt)
- **`temperature > 70`** → Box wird zu warm, Lüftung prüfen
- **`txPower > 9` oder `txPower < 0`** → Laser-Modul außerhalb spec
- **`biasCurrent > 50`** → Laser altert (höherer Strom für gleiche Leistung)

---

## Amazon Echo / Alexa-Integration

Überwacht Amazon Echo-Lautsprecher über die **alexa-remote2**-Bibliothek, die
die offiziellen Alexa-Web-APIs verwendet. Das Login erfolgt einmalig über einen
eingebetteten Proxy direkt im Browser — kein manuelles Cookie-Extrahieren nötig.

**Was überwacht wird:** Online-Status des Geräts, aktuelle Wiedergabe-Infos,
Lautstärke und mehr. Der Amazon-Account bleibt dauerhaft eingeloggt dank
OAuth-Token-Refresh (kein manuelles Re-Login nach wenigen Tagen).

### Verfügbare Metriken (10)

| Key        | Bezeichnung         | Format  | Beschreibung                            |
| ---------- | ------------------- | ------- | --------------------------------------- |
| `state`    | Wiedergabestatus    | text    | PLAYING, PAUSED, IDLE                   |
| `volume`   | Lautstärke          | int     | 0–100                                   |
| `muted`    | Stummgeschaltet     | bool    | ja/nein                                 |
| `title`    | Aktueller Titel     | text    | Songtitel oder Radio-Station            |
| `artist`   | Interpret/Station   | text    | Künstlername oder Sender                |
| `album`    | Album               | text    | Album-Name                              |
| `provider` | Dienst              | text    | Spotify, Amazon Music, TuneIn, …        |
| `shuffle`  | Zufallswiedergabe   | bool    | ja/nein                                 |
| `repeat`   | Wiederholen         | bool    | ja/nein                                 |
| `dnd`      | Nicht stören        | bool    | Do-Not-Disturb aktiv                    |

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: Amazon Echo**
2. **Amazon-Region** wählen (de, com, co.uk, fr, it, es, ca, com.au, co.jp)
3. **Proxy-Port** leer lassen (Default 3001) — wird nur während des Logins genutzt
4. Optional: **Seriennummer** eines bestimmten Echo-Geräts eintragen (falls
   mehrere Echos im Account — sonst nimmt NET.MONITOR den ersten Echo im Account)
5. **"Amazon Login starten"** klicken:
   - Ein Link zur Amazon-Login-Seite erscheint — diesen im Browser öffnen
   - Ganz normal bei Amazon anmelden (inkl. 2FA falls aktiv)
   - Nach erfolgreichem Login zeigt NET.MONITOR die gefundenen Echo-Geräte
   - Seriennummer des gewünschten Geräts auswählen oder manuell eintragen
6. **Metriken** per Preset oder einzeln auswählen
7. **"Verbindung testen"** → Live-Werte erscheinen
8. Speichern

### Login-Technologie

NET.MONITOR startet während des Logins einen kurzlebigen lokalen Proxy-Server
(Default Port 3001). Der Browser verbindet sich über diesen Proxy mit Amazon
— dadurch kann die Library die Session-Cookies sicher abgreifen, ohne
dass du sie manuell aus den Browser-Dev-Tools kopieren musst.

Der gespeicherte Session-Token enthält das vollständige `cookieData`-Objekt
inkl. OAuth-Tokens (`macDms`, `adp_token`). Diese ermöglichen der
alexa-remote2-Bibliothek, die Session **automatisch zu erneuern** — du musst
dich nicht regelmäßig neu anmelden.

### Mehrere Echos im selben Account

Falls du mehrere Echo-Geräte hast, lege pro Echo ein eigenes Gerät im
Dashboard an und trage jeweils die Seriennummer ein. Den Amazon-Login musst
du nur einmal durchführen — beim zweiten Gerät kannst du das gespeicherte
Cookie wiederverwenden (es erscheint automatisch im Formular).

### Voraussetzungen für den Login-Proxy

Der Browser, der den Amazon-Login durchführt, muss den Proxy-Port des
NET.MONITOR-Containers erreichen können:

- **Pi mit `network_mode: host`** (Standard): Proxy läuft direkt auf der
  Pi-IP, einfach den angezeigten Link öffnen.
- **Pi mit Bridge-Netzwerk**: Port 3001 in `docker-compose.yml` mappen
  (`- "3001:3001"`).

---

## NVIDIA Shield-Integration

Überwacht NVIDIA Shield TV-Player über **ADB über TCP/IP** (Android Debug Bridge).
Das Dashboard liest CPU-Auslastung, RAM, Temperatur und die aktuell aktive App
direkt aus dem Android-System.

**Voraussetzungen auf der Shield:**

1. Auf der Shield: **Einstellungen → Geräteeinstellungen → Info → Build**
   (7× tippen) um Entwickleroptionen freizuschalten
2. **Entwickleroptionen → USB-Debugging → EIN**
3. **Entwickleroptionen → Netzwerk-Debugging → EIN** (aktiviert Port 5555)

### Erstmalige Autorisierung (RSA-Fingerabdruck)

Beim ersten Verbindungsversuch zeigt die Shield einen Dialog:
**"RSA-Fingerabdruck für diesen Computer erlauben?"** — **Erlauben** antippen.

Falls der Dialog nicht erscheint (Shield im Standby):
- Shield aufwecken und auf den Startbildschirm navigieren
- Dann erst den Verbindungstest im Dashboard starten

Der RSA-Schlüssel wird im Docker-Volume `./data/adb` gespeichert
(`~/.android/adbkey`) — nach einmaliger Bestätigung ist keine erneute
Autorisierung nötig, auch nach Container-Neustarts nicht.

### Verfügbare Metriken

| Key    | Bezeichnung      | Format  | Beschreibung                                 |
| ------ | ---------------- | ------- | -------------------------------------------- |
| `cpu`  | CPU-Auslastung   | percent | Inkrementell aus `/proc/stat`                |
| `ram`  | RAM-Auslastung   | percent | MemTotal/MemAvailable aus `/proc/meminfo`    |
| `temp` | Temperatur       | celsius | Maximum über alle Thermal-Zones              |
| `app`  | Aktive App       | text    | Package-Name der vordersten App (z.B. `com.netflix.ninja`) |

> **Hinweis:** CPU-Auslastung ist immer `null` beim ersten Poll-Zyklus, da
> sie den Delta zwischen zwei Messungen berechnet.

### Einrichtung im Dashboard

1. Gerät hinzufügen → **Check-Methode: NVIDIA Shield (ADB)**
2. **Host** = IP-Adresse der Shield (z.B. `192.168.0.25`)
3. **Port** leer lassen (Default 5555)
4. **Preset** wählen:
   - "Basis (CPU + RAM)"
   - "Vollständig (CPU + RAM + Temp + App)"
5. **"Verbindung testen"** — beim ersten Mal erscheint der RSA-Dialog auf der Shield
6. Speichern

### ADB-Schlüssel-Persistenz (Docker)

Die `docker-compose.yml` enthält bereits das nötige Volume:

```yaml
volumes:
  - ./data/adb:/home/node/.android
```

So wird der RSA-Schlüssel bei Rebuilds nicht gelöscht. Das Verzeichnis wird
beim Container-Start automatisch angelegt.

---

## Wert-Übersetzungen (Mappings)

Viele Geräte liefern numerische Status-Codes statt lesbarem Text — z.B. ein
Drucker mit `printerStatus = 3`. Mit Mappings übersetzt du das automatisch:

| Wert | Text |
|------|------|
| 1 | Andere |
| 2 | Unbekannt |
| 3 | Idle (bereit) |
| 4 | Druckt |
| 5 | Aufwärmen |

### Wo konfigurieren

Im Edit-Dialog jedes Geräts gibt es eine Sektion **"Wert-Übersetzungen
(Mappings)"**. Pro Mapping definierst du:

1. **Metric-Key** — der Schlüssel der Metrik, deren Werte gemappt werden
   sollen (z.B. `printerStatus`)
2. **Wert-Paare** — `Wert → Text`, beliebig viele
3. **Standard-Mapping** auswählen — füllt die Wert-Paare aus einer
   Bibliothek mit häufigen SNMP-Status-Codes

### Mitgelieferte Standard-Mappings

- `printer-status` — Drucker-Status (RFC 3805)
- `printer-error` — Drucker-Fehlerzustand
- `if-oper-status` / `if-admin-status` — Interface-Status (IF-MIB)
- `hr-device-status` — Host-Resources Device-Status
- `ups-output-source` — UPS Output-Source
- `avr-power` — Denon/Marantz Power (`ON` / `STANDBY`)
- `avr-input` — AVR Eingangs-Codes (`MPLAY` → `Media Player`)
- `hue-button` — Hue Dimmer-Switch Button-Events

### Wie es im Hintergrund funktioniert

Nach jedem Check wird die Metrik durch die Lookup-Tabelle geschoben. Ist der
Wert in der Tabelle, wird er ersetzt — und das `format` der Metrik auf `text`
gesetzt, damit das UI den String anzeigt. Der Original-Wert bleibt als
`rawValue` erhalten, sodass Notification-Regeln und History-Graphen weiterhin
auf dem numerischen Wert arbeiten können.

Funktioniert für **alle** Check-Typen — SNMP, FRITZ!Box, AVR, Hue.

---

## Pro-Gerät-Benachrichtigungsregeln

Jedes Gerät kann eigene Notification-Regeln haben (Edit-Dialog → unten
"Benachrichtigungsregeln"). So kannst du z.B. konfigurieren:
- NAS-Offline → sofort an Telegram (Cooldown 5 min)
- Pi-Temperatur > 70 °C für 5 Minuten → an Discord
- Drucker-Toner < 10 % → an ntfy mit niedriger Priorität
- Router → keine Regel = wird gar nicht notifiziert

**Drei Event-Typen** stehen zur Verfügung:

| Event              | Wann es feuert                                            |
| ------------------ | --------------------------------------------------------- |
| `device.offline`   | Gerät war erreichbar, ist es jetzt nicht mehr             |
| `device.online`    | Gerät war offline, ist jetzt wieder erreichbar (Recovery) |
| `metric.threshold` | Eine Metrik über-/unterschreitet einen Schwellwert        |

Bei `metric.threshold` wählst du:
- die **Metrik** aus den auf der Kachel konfigurierten OIDs (nur numerische
  Formate werden angeboten: percent, int, float, celsius, bytes, kbytes)
- den **Vergleichsoperator** (`>`, `>=`, `<`, `<=`, `==`, `!=`)
- den **Schwellwert**
- optional eine **Mindestdauer** in Sekunden (z.B. 300 = "nur wenn die Bedingung
  ≥ 5 Minuten anhält"). Wird genau einmal getriggert und erst wieder, wenn die
  Bedingung zwischendurch zurückgegangen ist und erneut einsetzt.

Der **Cooldown** pro Regel verhindert Benachrichtigungs-Spam — selbst wenn die
Bedingung dauerhaft besteht, kommt eine erneute Benachrichtigung erst nach
Ablauf des Cooldowns.

**Fallback**: Hat ein Gerät keine Regeln, gilt das globale Verhalten — jeder
Online/Offline-Wechsel wird an alle aktiven Channels gemeldet.

---

## Ordnerstruktur

```
net-monitor/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server/
│   ├── index.js           # Express + API + Scheduler
│   ├── logger.js          # Level-aware Logger (error/warn/info/debug)
│   ├── storage.js         # JSON-Persistenz (db.json)
│   ├── history.js         # Zeitreihen (history.json)
│   ├── notifier.js        # Benachrichtigungen (Discord, Telegram, ntfy, Webhook)
│   ├── value-mapper.js    # Wert-Übersetzungen (Mappings)
│   ├── snmp-check.js      # SNMP-Check + Walk + Presets
│   ├── mib-parser.js      # MIB-Datei-Parser (ASN.1)
│   ├── http-check.js      # HTTP + TCP
│   ├── fritzbox-check.js  # FRITZ!Box via TR-064/UPnP
│   ├── avr-check.js       # Denon/Marantz AVR via HTTP/XML
│   ├── hue-check.js       # Philips Hue Bridge via API v1
│   ├── salt-check.js      # Salt Fiber Box via JSON-API
│   ├── alexa-check.js     # Amazon Echo via alexa-remote2
│   └── shield-check.js    # NVIDIA Shield via ADB über TCP/IP
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── data/                  # wird automatisch angelegt
    ├── db.json
    ├── history.json
    ├── adb/               # ADB RSA-Schlüssel (Shield-Autorisierung)
    └── mibs/              # hochgeladene MIB-Dateien
```

---

## API-Übersicht

| Methode  | Pfad                              | Beschreibung                                  |
| -------: | --------------------------------- | --------------------------------------------- |
| GET      | `/api/health`                     | Health-Check                                  |
| GET/PUT  | `/api/settings`                   | Einstellungen (inkl. logLevel)                |
| GET/POST | `/api/devices`                    | Geräteliste / anlegen                         |
| PUT      | `/api/devices/reorder`            | Reihenfolge per Drag&Drop speichern           |
| PUT/DEL  | `/api/devices/:id`                | Gerät aktualisieren / löschen                 |
| GET      | `/api/check/:id`                  | Ein Gerät sofort prüfen                       |
| GET      | `/api/check-all`                  | Gecachten Status aller aktiven Geräte abrufen |
| GET      | `/api/history?limit=60`           | Zeitreihen aller Geräte                       |
| GET      | `/api/history/:id`                | Volle Zeitreihe + Stats eines Geräts          |
| POST     | `/api/import`                     | Komplett-Import (devices + settings)          |
| GET      | `/api/snmp/presets`               | SNMP-Presets                                  |
| POST     | `/api/snmp/get`                   | Ad-hoc SNMP-GET                               |
| POST     | `/api/snmp/walk`                  | SNMP-Walk                                     |
| GET      | `/api/mibs`                       | Liste hochgeladener MIB-Dateien               |
| POST     | `/api/mibs`                       | MIB-Datei hochladen `{filename, content}`     |
| DELETE   | `/api/mibs/:filename`             | MIB-Datei entfernen                           |
| GET      | `/api/mappings/standards`         | Standard-Wert-Mapping-Bibliothek              |
| GET      | `/api/fritz/presets`              | FRITZ!Box-Presets                             |
| GET      | `/api/fritz/catalog`              | FRITZ!Box-Metrikkatalog                       |
| POST     | `/api/fritz/test`                 | FRITZ!Box-Verbindung testen                   |
| GET      | `/api/avr/presets`                | AVR-Presets                                   |
| GET      | `/api/avr/catalog`                | AVR-Metrikkatalog                             |
| POST     | `/api/avr/test`                   | AVR-Verbindung testen                         |
| GET      | `/api/hue/presets`                | Hue-Presets                                   |
| GET      | `/api/hue/summary-catalog`        | Hue-Übersichts-Metrikkatalog                  |
| POST     | `/api/hue/discover`               | Hue-Bridge abfragen (Lampen, Sensoren…)       |
| POST     | `/api/hue/test`                   | Hue-Verbindung testen                         |
| GET      | `/api/salt/presets`               | Salt-Presets                                  |
| GET      | `/api/salt/catalog`               | Salt-Metrikkatalog                            |
| POST     | `/api/salt/test`                  | Salt-Verbindung testen                        |
| GET      | `/api/echo/presets`               | Echo-Presets                                  |
| GET      | `/api/echo/catalog`               | Echo-Metrikkatalog                            |
| POST     | `/api/echo/auth-start`            | Alexa-Login-Proxy starten                     |
| GET      | `/api/echo/auth-poll/:sessionId`  | Login-Ergebnis abfragen (Polling)             |
| GET      | `/api/echo/last-auth`             | Zuletzt gespeichertes Cookie abrufen          |
| POST     | `/api/echo/test`                  | Echo-Verbindung testen                        |
| GET      | `/api/shield/presets`             | Shield-Presets                                |
| GET      | `/api/shield/catalog`             | Shield-Metrikkatalog                          |
| POST     | `/api/shield/test`                | Shield-ADB-Verbindung testen                  |
| POST     | `/api/notifications/test`         | Test-Notification senden                      |

Beispiel MIB-Upload per curl:
```bash
curl -X POST http://localhost:3000/api/mibs \
  -H 'Content-Type: application/json' \
  -d "{\"filename\":\"MY-MIB.mib\",\"content\":$(jq -Rs . MY-MIB.mib)}"
```

---

## Troubleshooting

**`COPY --chown=node:node public ./public: "/public": not found`**
Tarball ganz entpacken:
```bash
tar -xzf net-monitor.tar.gz && cd net-monitor
ls -la   # public/ + server/ + Dockerfile + package.json
docker compose up -d --build
```

**MIB-Upload "Keine gültigen MIB-Module"** — Datei enthält keine Modul-Definition
oder wichtige IMPORTS fehlen. Versuche, alle abhängigen MIBs (und die des
Herstellers) zusammen hochzuladen.

**MIB-Metriken liefern "offline"** — Zielgerät antwortet nicht auf die OIDs.
Im SNMP-Walk prüfen, ob das Gerät die OID tatsächlich unterstützt. Viele
Hersteller-MIBs enthalten Proprietäre OIDs, die je nach Firmware-Version
anders funktionieren.

**SNMP-Walk liefert nichts** — Community falsch, Port ≠ 161, oder Firewall.

**Echo: "Nicht angemeldet — Amazon Login erforderlich"** — der gespeicherte
Cookie ist abgelaufen oder fehlt. Im Edit-Dialog des Geräts erneut
"Amazon Login starten" klicken.

**Echo: Login-Link öffnet sich, aber Amazon zeigt Fehlerseite** — die
`proxyOwnIp` stimmt nicht. Im Feld "Server-Host" die IP des Raspberry Pi
eintragen (z.B. `192.168.0.10`), nicht `localhost`.

**Echo: Session läuft nach wenigen Tagen ab** — stelle sicher, dass du nach
dem Login den Cookie im JSON-Format gespeichert hast. Neu einloggen nach einem
Update auf die aktuelle Version reicht aus — danach erneuert sich die Session
automatisch.

**Shield: "RSA-Fingerabdruck bestätigen" — aber kein Dialog erscheint** —
Shield aufwecken, auf Startbildschirm navigieren (nicht nur aus Standby holen)
und dann Verbindungstest starten. Bei hartnäckigen Problemen:
Entwickleroptionen → "Alle USB-Debugging-Autorisierungen widerrufen" → neu
verbinden.

**Shield: "failed to authenticate"** — der RSA-Schlüssel in `./data/adb/`
passt nicht mehr zur Shield. Verzeichnis leeren (`rm -f data/adb/adbkey*`),
Container neu starten, und erneut den RSA-Dialog auf der Shield bestätigen.

**Shield: Metriken leer, aber "online"** — ADB-Verbindung besteht, aber
Shell-Befehle schlagen fehl. Log-Level auf "Ausführlich" stellen und
`docker logs net-monitor` auf Fehlermeldungen prüfen.

**Dashboard lädt nicht** — Port 3000 belegt? Compose-Datei anpassen.

**ARM/v7 (Pi 3)** funktioniert. Erster Build dauert länger.
