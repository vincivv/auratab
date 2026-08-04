# AuraTab

Chrome MV3 new-tab-override extension. iOS-home-screen-style direct manipulation
of widgets (long-press → jiggle mode → drag/resize/remove) over a curated set of
generative animated backgrounds plus local photo/video upload.

**Full spec:** `documentation/SPEC.md` — read it before making architectural changes.
**Progress tracking:** `MILESTONES.md` — update after every work session, don't let it drift.

**Product name (revised 2026-07-30):** "AuraTab" — matches the repo/package
name now (`auratab`), replacing the earlier deliberately-different name
"Tabscape" the project started with (see spec's title/body, still
"Tabscape" throughout — that document is frozen historical context, not
renamed retroactively). A few internal, never-user-visible identifiers still
literally contain "tabscape" (the `chrome.storage.local` key, mainly) and
were left alone on purpose rather than renamed — see the comment at
`src/store/persistence.ts`'s `STORAGE_KEY` for why.

## Locked-in decisions (do not re-litigate without discussion)

These were flagged as judgment calls during planning and approved by the user.
Treat them as settled unless the user reopens them.

- **UI framework:** React + TypeScript (not Preact). Chosen for ecosystem
  compatibility with the drag/spring libraries under a 2–3 day timeline.
- **Drag/physics:** `@react-spring/web` + `@use-gesture/react`. Chosen over
  Framer Motion for finer control over the spring feel — see spec §10, the
  single highest risk in this project is the drag/resize interaction *feeling*
  physically convincing, not just functioning.
- **State/storage:** Zustand for the in-memory layout store, `chrome.storage.local`
  for persistence (debounced 300–500ms after drag/resize end, never per-frame),
  IndexedDB via `idb` for uploaded background blobs. See spec §6.2, §6.6, §8.
- **Build tooling:** Vite + `@crxjs/vite-plugin`, npm as package manager.
- **Grid system (revised 2026-07-29):** superseded the original 8px soft-
  snap-threshold approach with a real discrete cell grid — see "Grid pivot"
  under Architecture rules below for the full picture. `src/canvas/
  gridConfig.ts` is still the single source of truth for grid math; don't
  hardcode `DOT_SIZE` or cell math elsewhere.
- **Upload size ceilings:** ~25MB images, ~50MB video (spec explicitly deferred
  the exact number — FR-22). Defined in `src/backgrounds/media/uploadValidation.ts`.
  **Only the image half is built (2026-08-03)** — see "Background picker"
  below; the 50MB video figure is still just the reserved number for when
  video upload lands, not yet enforced by real code.
- **Search widget:** submits to a hardcoded search URL template (default Google),
  with a simple in-widget engine picker — deliberately *not* using
  `chrome.search.query`/the `search` permission, to keep the manifest permission
  surface minimal per the Chrome Web Store review risk called out in spec §10.
- **Widget gallery UI (revised 2026-07-26):** originally planned as a
  standalone "+" control opening a modal. Per user direction, this moved
  inside a unified Settings panel (`src/settings/SettingsPanel.tsx`) as its
  "Widgets" tab; the top-right corner control is now a settings icon instead
  of the edit pencil. FR-6's explicit (non-long-press) entry into edit mode
  still exists — it's the "Edit widgets" action inside Settings' General tab
  — so that accessibility requirement isn't lost, just relocated.
- **Background palettes:** no brand reference was provided, so palette/parameter
  choices for the 4 engines are made freely during Day 2/3 — flag anything that
  reads as an intentional brand direction rather than a placeholder choice.
- **State store (resolved 2026-07-26):** widget list and preferences now live
  in a Zustand store (`src/store/layoutStore.ts`), hydrated from and
  persisted to `chrome.storage.local` by `src/store/persistence.ts`. This
  landed together, as planned — see "Persistence" under Architecture rules.

## Architecture rules (from spec §6, don't violate)

- **Widget registry pattern** (`src/widgets/registry.ts`): the canvas layer
  (`src/canvas/`) must have zero knowledge of widget-specific content. It only
  ever handles position/size/edit-mode chrome. Each widget owns its own
  render/serialize/deserialize. Current catalog (6, not spec's original 4 —
  see spec's status note): Clock, Search, Quick Links, Notes, To-Do List,
  Weather — one folder each under `src/widgets/`.
- **Drag physics module** (`src/canvas/useDragPhysics.ts`, `DraggableBox.tsx`)
  operates purely on generic `{ id, x, y, w, h }` primitives — no widget or
  background awareness. This is what lets `DraggableBox` be built and
  feel-tested on Day 1 before any real widget exists.
- **Background engine interface** (`src/backgrounds/types.ts`): every engine
  implements `start(preset)` / `stop()` / `respectsReducedMotion()`. Presets
  are *data only* (palette, speed, density, scale) layered onto a shared
  render loop — never a separate code path per preset. If a background idea
  can't be expressed as parameters on an existing engine, it's a candidate for
  a 5th engine post-v1, not a Day 2/3 special case (spec §10 risk register).
- **Animation perf (NFR-2):** during active drag, animate only `transform`/
  `opacity` — never `top`/`left`/`width`/`height` per frame. Background layer
  runs on its own compositing layer so it can't block widget interaction.
- **Network calls (stance revised 2026-07-31):** the spec's original rule was
  "no network calls anywhere in v1" (NFR-3/NFR-5) — kept as the *default*
  assumption for any new change (if you're adding a fetch/XHR/host
  permission, that's a real decision, not an implementation detail, so stop
  and flag it before writing it). But **"fully offline" is no longer a hard
  product goal** — user's own words: "we are not aiming to be offline tab."
  So the rule going forward isn't "never," it's "each network-calling
  feature gets decided explicitly, one at a time, and documented here" —
  same process as before, just without the assumption that the answer will
  usually be no. Two such features exist so far:
  - **Weather widget** (`src/widgets/weather/`, added 2026-07-28) — calls
    the Open-Meteo API (free, no key, CORS-enabled for direct browser
    fetch) to geocode a user-entered city and fetch current conditions.
    Opt-in: does nothing over the network until the user adds the widget
    *and* types a city.
  - **Quick Links favicons** (`src/widgets/links/LinksWidget.tsx`, added
    2026-07-31) — real site icons via Google's public favicon endpoint
    (`https://www.google.com/s2/favicons?domain=...&sz=64`, no key, no
    backend), replacing the earlier initial-letter-only avatar. Falls back
    to the initial-letter tile on load failure (offline, endpoint down, or
    an unparseable URL) via the `<img>`'s `onError`, so it degrades rather
    than showing a broken image icon. Fires for every link tile on every
    render where a domain is present — unlike Weather, this isn't gated
    behind an explicit per-use action, so it's a more continuous/passive
    call pattern; flagged to the user as a real privacy trade-off (every
    saved link's domain gets sent to Google on each new tab) before
    building, and they chose to proceed anyway.
  Both required no manifest changes — MV3's default `extension_pages` CSP
  doesn't restrict `connect-src`, so fetch/`<img src>` to an external
  CORS-friendly host works from a normal extension page without a
  `host_permissions` entry. Keep documenting new ones here the same way.
- **Persistence** (spec §6.2, §8): `useLayoutStore` (Zustand,
  `src/store/layoutStore.ts`) is the single source of truth for
  `widgets`/`preferences`. `src/store/persistence.ts` hydrates it from
  `chrome.storage.local` once on mount (key `tabscape_layout_v2`, versioned
  per spec §8 — bumped from `_v1`, see "Grid pivot" below) and writes back
  on every change, debounced 400ms. Edit-mode and settings-open state are
  deliberately NOT in this store — they're ephemeral UI state and stay as
  local `useState` in `App.tsx`, never persisted. An empty `widgets` array
  in storage is a real, meaningful saved state (user removed everything) and
  must win over the FR-28 seeded default — that default only applies when
  nothing has ever been saved.
- **Grid pivot (2026-07-29):** widget layout moved from free pixel
  positioning (soft-snapped to an 8px grid on release) to a real discrete
  cell grid — `WidgetInstance.position` is now `{col, row}` and `.size` is
  `{w, h}`, all in whole grid cells, not pixels (see `widgets/types.ts`).
  This is a deliberate pivot, not a bug fix — explicitly discussed with the
  user first (see MILESTONES.md 2026-07-29). Key pieces:
  - `src/canvas/gridConfig.ts` — `DOT_SIZE` (80px/cell), `pxToCell`/
    `cellToPx`, `getGridDimensions(viewportW, viewportH)`.
  - `src/canvas/gridCollision.ts` — `resolveGridCollisions`, a vertical-only
    collision resolver. This is the "grid reflow / push-displacement" feature
    spec §5.4 and §10 explicitly deferred as higher-risk/post-launch scope —
    built now anyway per explicit user direction. Down is tried first
    (simpler, bounded, predictable — never sideways or to "nearest empty
    spot"); **revised 2026-08-03** to fall back to pushing up above the
    widget causing the overlap when there's no room below, since widgets
    dragged near the bottom of the viewport had nowhere to go and were left
    visibly overlapping — down is still preferred whenever it fits. Only if
    *neither* direction has room is the push skipped and the overlap left in
    place, since the canvas doesn't scroll.
  - **`DraggableBox`/`useDragPhysics` stayed pixel-based internally** — the
    continuous drag/resize *feel* is unchanged (this is deliberate: that feel
    was the Day 1 validated risk, not something to touch casually). All
    cell-rounding + collision resolution happens one layer up, in `App.tsx`,
    which converts cell↔pixel at the render/commit boundary. Per-widget
    min/max size (from each widget's own definition) is now threaded into
    `DraggableBox` as props — incidentally fixes a latent bug where resize
    previously clamped against one shared global min/max for every widget
    type instead of each definition's own bounds.
  - Storage key bumped `_v1` → `_v2`; no migration written, old pixel-based
    saves are simply abandoned. Acceptable for dev-stage data, per spec §8's
    own versioning rationale.
- **Chromeless widgets (2026-07-30):** `WidgetDefinition.chromeless?: boolean`
  — set on Clock and Search. Renders with no glass card (no background/
  border/shadow, see `DraggableBox.tsx`), floating directly on the canvas.
  Still fully draggable/resizable/removable/wobbling like any other widget;
  only the visual chrome is skipped. If adding a future widget that's meant
  to feel like bare canvas content rather than a card (a HUD-style element,
  not a data card), this is the flag to set — no other wiring needed.
- **Starter/default layout (2026-07-30):** `createDefaultWidgets()` in
  `src/store/layoutStore.ts` builds a real multi-widget starter arrangement
  (Clock + Search centered near the top, Todo/Links/Notes centered in a row
  below), not a single placeholder — used both for FR-28's true-first-run
  default and for the "Reset to default layout" action in Settings' General
  tab (`resetToDefault` store action). Recomputed fresh from the current
  viewport's column count each time, not a fixed constant, so centering
  stays correct across screen sizes. Several exact position/size values in
  there (e.g. clock/search using `maxSize` instead of `defaultSize`, per-
  widget `colOffset`s on the bottom row) are hand-tuned per user feedback
  through several iterations — treat them as deliberate, not arbitrary,
  before changing them again.
- **Background picker (2026-08-03):** a new "Background" tab in Settings
  (`src/settings/BackgroundTab.tsx`, third nav item alongside General/
  Widgets) — a **first, simpler pass**, not the spec's real generative
  animated engines (§4.4/§6.5), which are still unbuilt and remain the
  biggest gap between the spec's vision and what's on screen (see README).
  Two ways to set the background, both writing to
  `preferences.background: BackgroundSelection` (`{type:'preset', id}` or
  `{type:'custom'}`, `src/backgrounds/types.ts`):
  - **Presets** — a curated, static list of CSS gradients
    (`src/backgrounds/presets.ts`), palette choices made freely per the
    "Background palettes" decision above. `'aurora'` is byte-identical to
    `.canvas`'s original hardcoded gradient and is `DEFAULT_PREFERENCES`'s
    default, so existing users see zero visual change until they open the
    new tab.
  - **Custom image upload** — validated (`src/backgrounds/media/
    uploadValidation.ts`, the ~25MB ceiling from "Upload size ceilings"
    above) then stored as a `Blob` in IndexedDB via `idb`
    (`src/backgrounds/media/backgroundMediaStore.ts`) — single fixed key,
    "one active custom background," not a saved-uploads gallery; uploading
    again replaces it. `preferences.background` only stores the `{type:
    'custom'}` tag (chrome.storage.local isn't meant for large blobs); the
    actual bytes never touch it, matching the spec §6.2/§6.6/§8 storage
    split this was already planned around.
  `src/backgrounds/useBackgroundStyle.ts` resolves either shape into real
  CSS for `.canvas` — presets are a synchronous lookup, custom needs an
  async IndexedDB read (returns `{}`, falling through to `.canvas`'s
  hardcoded CSS fallback, while that resolves, so there's no flash of
  black). Video upload is out of scope for this pass — file input only
  accepts `image/*`; the 50MB video ceiling stays a reserved-but-unenforced
  number until that's built.

## Day 1 exit criteria (the whole timeline's go/no-go gate)

A single placeholder widget can be dragged, resized, and feels physically
convincing. This is validated by feel (real interaction, tuned against iOS
reference behavior), not by tests passing. Nothing in Day 2 (widget registry,
gallery, background engines) starts until this is confirmed. See spec §9, §10.

## Commands

- `npm run dev` — Vite dev server with HMR (crxjs-aware)
- `npm run build` — production build to `dist/`; load `dist/` as an unpacked
  extension via `chrome://extensions` → Developer mode → Load unpacked
- `npm run typecheck` — `tsc -b --noEmit`
