# KASAI Refactor Plan

Ziel: Die App bleibt lauffaehig, waehrend `index.html` schrittweise kleiner und robuster wird.

## Regeln

- Kleine Schritte, immer mit Syntaxcheck nach jedem Schritt.
- Kritische Bereiche zuerst: Auth, Splash, Navigation, State.
- Keine direkten Top-Level-Bindings mit `document.getElementById(...).addEventListener(...)`.
- Neue Event-Bindings laufen ueber `window.KasaiDOM`.
- Service-Worker-Cache bei neuen Dateien immer versionieren und neue Assets eintragen.

## Zielstruktur

```text
index.html
manifest.json
sw.js

styles/
  base.css
  auth.css
  splash.css
  training.css
  nutrition.css
  habits.css
  settings.css

js/
  core/
    dom.js
    state.js
    supabase.js
    sync.js
  features/
    auth.js
    splash.js
    training.js
    training-plan.js
    nutrition.js
    habits.js
    run.js
    settings.js
```

## Reihenfolge

1. `js/core/dom.js` einfuehren und kritische Button-Bindings absichern.
2. Auth-Code nach `js/features/auth.js` auslagern.
3. Splash-Code nach `js/features/splash.js` auslagern.
4. State/Supabase/Synchronisierung trennen.
5. Feature-Code blockweise auslagern: Training, Nutrition, Habits, Run, Settings.
6. CSS in kleine Dateien teilen, sobald JS stabil getrennt ist.

## Minimaler Test nach jedem Schritt

- `node --check` fuer alle geaenderten JavaScript-Dateien.
- Inline-Skripte aus `index.html` extrahieren und mit `node --check` pruefen.
- Lokale App per HTTP laden.
- Login-Button muss bei leerem Formular eine Fehlermeldung zeigen.
- Service Worker muss die neue Cache-Version verwenden.
