# Nadena Games

Zentrales Spieleportal für alle Nadena-Games-Titel mit einer gemeinsamen **Nadena ID**.

## Ziel

Ein Spieler registriert sich genau **einmal** auf der Nadena-Games-Webseite. Danach soll er alle verbundenen Nadena-Spiele öffnen können, ohne sich dort erneut registrieren oder ein weiteres Passwort anlegen zu müssen.

Ablauf:

1. Spieler registriert sich auf der Nadena-Games-Webseite.
2. Nadena ID bleibt eingeloggt.
3. Spieler wählt ein Spiel aus.
4. Vor dem Start wird gefragt, ob dieses Spiel mit der Nadena ID geöffnet werden soll.
5. Nadena erzeugt einen kurzlebigen, einmal verwendbaren SSO-Code.
6. Das Zielspiel tauscht diesen Code serverseitig gegen sein eigenes lokales Spielkonto / seine lokale Session.
7. Beim ersten Start wird automatisch ein Spielkonto für die Nadena ID angelegt oder ein bestehendes Konto einmalig verknüpft.
8. Danach ist keine weitere Registrierung für dieses Spiel nötig.

Die einzelnen Spiele behalten ihre eigenen Datenbanken und Spielstände. Es werden keine Passwörter zwischen Spielen kopiert.

## Bestehende Infrastruktur

Es wurde **kein neues Supabase-Projekt** angelegt, um zusätzliche monatliche Kosten zu vermeiden.

Die zentrale Nadena-ID-Struktur liegt im bestehenden Supabase-Projekt **Worldprojekt / Orvuno**:

- Project Ref: `ojhaeccyulyrwoxgeurf`
- Region: `eu-west-1`

Grund: Orvuno verwendet bereits Supabase Auth und eignet sich deshalb als zentrale Identitätsschicht. Die Nadena-Tabellen sind logisch von den eigentlichen Orvuno-Spieldaten getrennt.

## Bereits angelegte Nadena-Datenbankstruktur

Migration: `add_nadena_identity_and_sso`

Angelegt wurden:

### `public.nadena_profiles`
Zentrales Nadena-Profil je Supabase-Auth-Benutzer.

Enthält u. a.:
- `user_id`
- `display_name`
- `avatar_url`
- `language_code`
- Zeitstempel

Für neue Supabase-Auth-Benutzer wird automatisch ein Nadena-Profil erzeugt.
Bestehende Auth-Benutzer wurden ebenfalls in `nadena_profiles` übernommen.

### `public.nadena_games`
Zentrales Verzeichnis aller Nadena-Spiele.

Aktuell eingetragen:

- `hofhain` → https://www.hofhain.de/
- `futnaro` → https://www.futnaro.de/
- `orvuno` → https://www.orvuno.de/
- `astrawelle` → https://astrawelle.vercel.app/

Zusätzlich gibt es Felder für Aktivstatus, Reihenfolge und `sso_ready`.

### `public.nadena_game_links`
Zuordnung zwischen Nadena ID und dem jeweiligen lokalen Spielkonto.

Beispiel:

`Nadena User UUID -> hofhain -> Hofhain Player ID`

Damit können vorhandene Spielkonten später einmalig verbunden werden und bestehende Spielstände bleiben erhalten.

### `private.nadena_sso_codes`
Private Tabelle für kurzlebige Einmal-Codes beim Spielstart.

Eigenschaften:
- Code wird nur gehasht gespeichert.
- An Nadena-Benutzer und Zielspiel gebunden.
- Ablaufzeit.
- `used_at` verhindert Wiederverwendung.
- Private Tabelle ist nicht direkt für Browser-Clients zugänglich.

### Sicherheit

Für die Nadena-Tabellen wurde RLS aktiviert.

- Spieler dürfen nur ihr eigenes Nadena-Profil lesen/ändern.
- Spieler dürfen nur ihre eigenen Spielverknüpfungen lesen.
- Aktive Spiele dürfen öffentlich gelesen werden.
- SSO-Codes liegen im privaten Schema und sind für `anon` / `authenticated` direkt gesperrt.

## Aktuelle Spiele / Projekte

### Hofhain
- GitHub: `sonny1311/Hofhain`
- Supabase: `ufvjjzsrhmarzaaczruj`
- Webseite: https://www.hofhain.de/
- Eigene Supabase-Auth-/Cloudsave-Struktur vorhanden.
- Muss als erstes Spiel an Nadena SSO angebunden werden.

### Futnaro
- GitHub: `sonny1311/Futnaro`
- Supabase: `rzvddebtcxtysclxrpfm`
- Webseite: https://www.futnaro.de/
- Verwendet aktuell eigene gehashte Bearer-Sessions statt normaler Supabase-Auth-JWTs.
- Benötigt deshalb einen eigenen Nadena-SSO-Adapter.

### Orvuno
- GitHub: `sonny1311/Orvuno`
- Supabase / zentrale Nadena-ID: `ojhaeccyulyrwoxgeurf`
- Webseite: https://www.orvuno.de/
- Bestehende Supabase-Auth-Anbindung kann für Nadena ID genutzt werden.

### AstraWelle
- GitHub: `sonny1311/astrawelle`
- Supabase: `xesvfgxcqqhmsrdyfjox`
- Aktuelle Webadresse: https://astrawelle.vercel.app/
- Verwendet bereits Supabase Auth.

## Nadena-Games-Webseite

Für das Portal wird das bisher praktisch leere Repository verwendet:

- GitHub: `sonny1311/sonny`
- Branch: `master`

Damit wird die Firmen-/Portal-Webseite nicht mit Orvunos eigentlichem Spielrepository vermischt.

Die erste Portal-Startseite wurde angelegt. Sie enthält aktuell:

- Nadena-Games-Branding
- Claim „Ein Konto. Alle Spiele.“
- Spielekarten für Hofhain, Futnaro, Orvuno und AstraWelle
- Bereich „Nadena ID – Eine Anmeldung für alle Nadena-Spiele“

Dateien im Portal-Repo:

- `index.html`
- `style.css`
- `README.md`

## Noch zu erledigen

### 1. Portal fertigstellen

- richtige Nadena-Domain eintragen, sobald sie feststeht
- Login / Registrierung über zentrale Supabase Auth anbinden
- eingeloggten Nutzer anzeigen
- Spiele dynamisch aus `nadena_games` laden
- Konto-/Profilbereich
- Datenschutz / Impressum / Nutzungsbedingungen
- responsive Desktop-/Tablet-/Mobile-Oberfläche

### 2. Nadena SSO Backend

Benötigt werden mindestens zwei serverseitige Funktionen:

- `nadena-sso-issue`
  - verlangt gültige Nadena-Session
  - nimmt nur registrierte Zielspiele an
  - erzeugt kryptografisch sicheren Einmal-Code
  - speichert nur dessen Hash
  - sehr kurze Gültigkeit, z. B. 60–120 Sekunden
  - liefert Start-URL des Zielspiels

- `nadena-sso-exchange`
  - wird serverseitig vom Zielspiel verwendet
  - nimmt Einmal-Code + `game_slug`
  - prüft Hash, Ablaufzeit, Zielspiel und Wiederverwendung
  - markiert Code atomar als benutzt
  - liefert die stabile `nadena_user_id`

Wichtig: Kein langfristiger Nadena-Access-Token darf in einer Spiel-URL landen.

### 3. Hofhain als erstes Spiel vollständig anbinden

Gewünschter Endzustand:

`Nadena Games -> Hofhain spielen -> Nachfrage -> Einloggen & starten -> Hofhain automatisch eingeloggt`

Dabei:
- vorhandenes Hofhain-Konto auf Wunsch einmalig verbinden
- neuer Nadena-Spieler bekommt automatisch Hofhain-Spielkonto
- Spielstand bleibt in Hofhains eigener Datenbank
- Nadena ID wird in Hofhain dauerhaft als externe Identität hinterlegt

### 4. Futnaro anbinden

Da Futnaro ein eigenes Session-System verwendet, muss nach erfolgreichem Nadena-Code-Austausch eine normale Futnaro-Session erzeugt werden.

### 5. Orvuno anbinden

Orvuno ist wegen gemeinsamer Supabase-Auth-Basis der einfachste weitere Kandidat.

### 6. AstraWelle anbinden

AstraWelle verwendet ebenfalls Supabase Auth und bekommt einen entsprechenden Nadena-ID-Link / SSO-Adapter.

## Bestehende Spieler

Bestehende Spieler dürfen ihren Fortschritt nicht verlieren.

Deshalb muss jedes Spiel eine einmalige Funktion anbieten:

**„Bestehendes Spielkonto mit Nadena ID verbinden“**

Nach erfolgreicher Verknüpfung wird der lokale Account in `nadena_game_links` hinterlegt. Danach startet der Spieler das Spiel immer über seine Nadena ID.

## Architektur-Grundsatz

Nadena Games ist die zentrale Identität und der Spiele-Hub.

Die Spiele bleiben technisch eigenständig:

- eigene Spielstände
- eigene Tabellen
- eigene Wirtschaftssysteme
- eigene Premium-/Store-Systeme
- eigene Sessions nach erfolgreichem SSO-Austausch

Nur die Identität wird zentral verbunden.

## Stand 2026-09-08

- Entscheidung: **kein zusätzliches Supabase-Projekt**.
- Nadena ID nutzt Worldprojekt / Orvuno Supabase.
- Nadena-Datenbankschema ist angelegt.
- vier Spiele sind im zentralen Spieleverzeichnis eingetragen.
- erstes Nadena-Games-Portal liegt im Repo `sonny1311/sonny`.
- endgültige Nadena-Domain wird noch vom Betreiber eingerichtet.
- echter SSO-Spielstart ist als nächster Arbeitsschritt vorgesehen.
