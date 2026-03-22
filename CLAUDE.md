# Projektinstruktionen

## Anrede
Den Benutzer immer mit "Sir" ansprechen.

## Nachfragen bei Unklarheiten
Wenn eine Anfrage nicht zu 100% klar ist, **immer zuerst nachfragen** bevor etwas umgesetzt wird. Keine Annahmen treffen. Lieber eine kurze Rückfrage als eine falsche Umsetzung.

## Sprache
Auf Deutsch kommunizieren, sofern nicht anders gewünscht.

## Screenshots
Wenn der Benutzer sagt "schau dir das Bild an" oder ähnliches, immer den neuesten Screenshot aus `C:\Users\Marcellus\Pictures\Screenshots` laden (WSL-Pfad: `/mnt/c/Users/Marcellus/Pictures/Screenshots/`). Den neuesten Screenshot anhand des Dateinamens (Zeitstempel) ermitteln.

## Styling & Design System
Der Styleguide unter `app/pages/styleguide.vue` ist die einzige Quelle der Wahrheit für alle visuellen Entscheidungen.

**Beim Stylen neuer Komponenten oder Seiten immer:**
- Typografie: `text-3xl font-bold` für Seitentitel (h1), `text-xl font-semibold` für Abschnittstitel (h2), `text-lg font-semibold` für Kartentitel, `text-sm text-gray-500` für Sekundärtext, `text-xs font-semibold uppercase tracking-wider text-gray-400` für Labels
- Layout: `p-6` als Seiten-Padding, `max-w-screen-2xl mx-auto` als Container, `space-y-6` zwischen Hauptsektionen
- Karten: `<UCard>` mit optionalem `#header` und `#footer` Slot
- Buttons: `<UButton>` mit den Varianten `solid`, `outline`, `soft`, `subtle`, `ghost`, `link` — Standard-Aktionen in `primary`, neutrale in `neutral`, Löschen in `error`
- Badges: `<UBadge>` für Status-Anzeigen
- Farben: Primary (blau), Success (grün), Warning (amber), Error (rot), Info (cyan), Neutral (grau)
- Icons: ausschliesslich Lucide-Icons (`i-lucide-*`)
- Zahlen: immer `font-["SUSE_Mono"]` verwenden (Monospace-Font für alle numerischen Werte, Preise, Statistiken etc.)
- Fliesstext / UI-Text: `font-["SUSE"]`
- Überschriften: h1 → `font-instrument italic text-5xl`, h2 → `font-instrument italic text-[2.75rem]` (kein bold/semibold bei beiden)
- Dark Mode: immer `dark:`-Varianten mitdefinieren
- h1 kommt **einmal pro Seite**, h2 kann mehrfach vorkommen (als Abschnittstitel)

## Konsistenz zwischen Sections — Absolutes Muss

Alle Listen-Einträge innerhalb von Cash-Cards (Bargeld, Säule 3A, Lending, Schulden etc.) **müssen immer dasselbe Layout** verwenden: `cash-entry` mit `cash-entry-left` und `cash-entry-right`. Keine abweichenden Wrapper-Klassen oder zusätzliche Zeilen dazwischen. Wenn eine neue Section hinzukommt, immer an einem bestehenden Eintrag (z.B. Frankly in Säule 3A) orientieren und exakt denselben Markup-Stil übernehmen.

## CSS-Qualität — Absolutes Muss

Beim Bearbeiten von CSS-Blöcken mit dem Edit-Tool **immer den gesamten betroffenen Block lesen**, bevor etwas geändert wird. Es ist verboten, CSS-Properties aus einem Block herauszureissen oder eine schliessende `}` zu überschreiben. Das führt zu `Missing opening {`-Fehlern.

**Konkret:**
- Vor jedem CSS-Edit den umgebenden Block vollständig lesen
- Beim Einfügen neuer Regeln (z.B. `:hover`) sicherstellen, dass bestehende Properties des ursprünglichen Blocks vollständig erhalten bleiben
- Nach einem Edit gedanklich prüfen: Sind alle `{` und `}` korrekt geschlossen?
