# Nadena Games

Zentrales Spieleportal für die Spielwelten von **Nadena Games**. Die Spiele bleiben eigenständig und besitzen ihre eigenen Spielstände und Systeme; die gemeinsame Nadena ID bildet die Basis für die schrittweise technische Verknüpfung.

## Offizielle Websites

- [Nadena Games](https://www.nadena-games.de/)
- [Hofhain – Bauernhofspiel](https://www.hofhain.de/)
- [ORVUNO – Wirtschaftssimulation](https://www.orvuno.de/)
- [FUTNARO – Online Fußballmanager](https://www.futnaro.de/)
- [AstraWelle – Weltraum-Aufbauspiel](https://www.astrawelle.de/)

## Offizielle Ratgeber

- [Nadena Games Browsergame-Ratgeber](https://www.nadena-games.de/browsergame-ratgeber.html)
- [Hofhain Bauernhofspiel-Tipps](https://www.hofhain.de/bauernhofspiel-tipps.html)
- [Hofhain Tierhaltung & Futter](https://www.hofhain.de/tierhaltung-futter.html)
- [ORVUNO Wirtschaftssimulation-Tipps](https://www.orvuno.de/wirtschaftssimulation-tipps.html)
- [ORVUNO Produktion & Logistik](https://www.orvuno.de/produktion-logistik.html)
- [FUTNARO Fußballmanager-Tipps](https://www.futnaro.de/fussballmanager-tipps.html)
- [FUTNARO Taktik & Aufstellung](https://www.futnaro.de/taktik-aufstellung.html)
- [AstraWelle Strategie-Ratgeber](https://www.astrawelle.de/ratgeber/)
- [AstraWelle Kolonien & Energie](https://www.astrawelle.de/kolonien-energie/)

## Portal

Das Portal stellt die vier Spielwelten vor, bietet Registrierung und Anmeldung für die Nadena ID und dient als gemeinsamer Publisher-Hub. Die direkte SSO-Verknüpfung der einzelnen Spiele wird schrittweise erweitert; vorhandene Spielstände und spielinterne Käufe bleiben im jeweiligen Spiel erhalten.

Wichtige Dateien:

- `index.html`
- `style.css`
- `app.js`
- `browsergame-ratgeber.html`
- `sitemap.xml`
- `robots.txt`
- `impressum.html`
- `datenschutz.html`
- `nutzungsbedingungen.html`

## Nadena ID / SSO

Der zentrale SSO-Kern ist vorbereitet. Ein Spiel wird erst dann für direkten Auto-Login freigeschaltet, wenn sein eigener Adapter fertig implementiert und getestet ist. Es wird kein halbfertiger SSO-Flow für Spieler aktiviert.

Für bestehende Spieler gilt weiterhin: vorhandene lokale Konten und Fortschritte dürfen nicht ersetzt oder zurückgesetzt werden. Eine spätere Verknüpfung muss den vorhandenen Spielstand übernehmen.
