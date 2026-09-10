# Nadena Games

Zentrales Spieleportal für alle Nadena-Games-Titel mit gemeinsamer **Nadena ID**.

## Ziel

Ein Spieler registriert sich genau einmal auf der Nadena-Games-Webseite. Danach startet er verbundene Nadena-Spiele über dieselbe Identität. Die Spiele behalten ihre eigenen Datenbanken, Spielstände, Käufe und lokalen Sessions. Passwörter werden nicht zwischen Spielen kopiert.

## Zentrale Infrastruktur

Die Nadena ID liegt im bestehenden Supabase-Projekt **Worldprojekt / Orvuno** (`ojhaeccyulyrwoxgeurf`, `eu-west-1`). Es wurde bewusst kein zusätzliches Supabase-Projekt angelegt.

### Tabellen

- `public.nadena_profiles` – zentrales Nadena-Profil pro Auth-Benutzer
- `public.nadena_games` – zentrales Verzeichnis aller Spiele
- `public.nadena_game_links` – Zuordnung Nadena ID zu lokalem Spielkonto
- `private.nadena_sso_codes` – gehashte, kurzlebige Einmal-Codes für SSO

### Aktuelle Spiele

Das Portal liest alle aktiven Spiele dynamisch aus `public.nadena_games`. Aktuell eingetragen:

- `hofhain` → https://www.hofhain.de/
- `futnaro` → https://www.futnaro.de/
- `orvuno` → https://www.orvuno.de/
- `astrawelle` → https://astrawelle.vercel.app/

Neue Spiele sollen künftig nur noch in `nadena_games` aktiviert werden und erscheinen dann automatisch im Portal.

## Portal

Repository: `sonny1311/sonny`
Branch: `master`

Stand 2026-09-10 ist das Portal selbst umgesetzt:

- responsive Nadena-Games-Startseite
- Registrierung und Login über die zentrale Supabase Auth / Nadena ID
- eingeloggter Benutzerstatus
- Nadena-Profil und Anzeigename
- dynamisches Spieleverzeichnis aus `nadena_games`
- Anzeige bestehender Spielverknüpfungen
- Spielstart-Flow mit Nadena SSO, sobald `sso_ready=true`
- Impressum
- Datenschutzerklärung
- Nutzungsbedingungen
- sichere RLS-/Tabellenrechte für die Nadena-Portal-Daten

Dateien:

- `index.html`
- `style.css`
- `app.js`
- `impressum.html`
- `datenschutz.html`
- `nutzungsbedingungen.html`

## SSO-Backend

Im zentralen Supabase-Projekt sind folgende Edge Functions aktiv:

### `nadena-sso-issue`

- verlangt eine gültige Nadena-Session
- akzeptiert nur aktive Spiele mit `sso_ready=true`
- erzeugt kryptografisch sicheren Einmal-Code
- speichert nur SHA-256-Hash des Codes
- Gültigkeit: 90 Sekunden
- bindet Code an Nadena-Benutzer und Zielspiel
- liefert die Start-URL des Zielspiels

### `nadena-sso-exchange`

- ist für den serverseitigen Adapter des Zielspiels gedacht
- prüft Einmal-Code, Zielspiel, Ablaufzeit und Wiederverwendung
- verbraucht den Code atomar
- liefert nach erfolgreicher Prüfung die stabile Nadena-Identität an den Spielserver
- verlangt zusätzlich ein spielbezogenes Server-Secret

Dazu wurden die service-role-only Datenbankfunktionen `nadena_sso_store_code` und `nadena_sso_consume_code` angelegt.

## Noch offen: Adapter in den einzelnen Spielen

Die zentrale Webseite und der SSO-Kern sind vorhanden. **`sso_ready` bleibt für ein Spiel absichtlich `false`, bis dessen eigener Adapter fertig und getestet ist.** Dadurch wird kein halbfertiger Auto-Login für Spieler freigeschaltet.

### Hofhain

- GitHub: `sonny1311/Hofhain`
- Supabase: `ufvjjzsrhmarzaaczruj`
- eigene Supabase-Auth-/Cloudsave-Struktur
- Adapter muss Nadena-Code serverseitig austauschen und eine normale Hofhain-Session herstellen
- bestehende Spieler müssen ihren vorhandenen Hof einmalig verknüpfen können

### Futnaro

- GitHub: `sonny1311/Futnaro`
- Supabase: `rzvddebtcxtysclxrpfm`
- eigenes gehashtes Bearer-Session-System
- benötigt einen eigenen Nadena-Adapter, der nach dem Code-Austausch eine normale Futnaro-Session erzeugt

### Orvuno

- GitHub: `sonny1311/Orvuno`
- Supabase: `ojhaeccyulyrwoxgeurf`
- nutzt dieselbe Supabase-Auth-Basis wie Nadena ID und ist daher der direkteste Adapter

### AstraWelle

- GitHub: `sonny1311/astrawelle`
- Supabase: `xesvfgxcqqhmsrdyfjox`
- eigene Supabase Auth; benötigt lokalen Nadena-Adapter

## Bestehende Spieler

Bestehende Spielstände dürfen nicht verloren gehen. Deshalb gilt pro Spiel:

1. Neuer Nadena-Spieler: lokales Spielkonto automatisch anlegen.
2. Bestehender Spieler: vorhandenes lokales Konto einmalig mit Nadena ID verbinden.
3. Danach: Klick im Nadena-Portal → Einmal-Code → lokaler Adapter → bestehende lokale Session → Spiel startet angemeldet.

`public.nadena_game_links` speichert die dauerhafte Verknüpfung zwischen Nadena ID und lokalem Spielkonto.

## Deployment

Zum Stand 2026-09-10 existiert im verbundenen Vercel-Team noch kein eigenes Projekt für das Repository `sonny1311/sonny`. Die vorhandenen Vercel-Projekte sind Orvuno, Hofhain, Futnaro und AstraWelle. Das Portal muss daher noch mit einem Hosting-/Domain-Projekt verbunden werden, bevor diese Fassung öffentlich live ist.
