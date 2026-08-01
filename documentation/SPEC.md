# Tabscape — Product & Technical Specification

**Version:** 1.0
**Status:** Original planning document — kept as-is for historical context
**Target Timeline:** 2–3 days to MVP

> **This is the original v1.0 spec, frozen at the point development started.**
> It's still the best record of the product's original goals, architecture
> reasoning, and risk analysis (§10 in particular is worth reading), but the
> actual implementation has since deliberately diverged from it in several
> places — a real-time positioning/sizing grid instead of free placement, a
> settings-drawer-based widget gallery instead of a standalone "+", two
> extra widgets beyond the original 4-widget catalog, a product rename from
> "Tabscape" (used throughout this document, unchanged below) to **AuraTab**
> — each decided explicitly during the build, not silently. **One goal was
> dropped outright, not just diverged from:** this spec treats fully-offline
> (NFR-3/NFR-5, §11) as a hard requirement; as of 2026-07-31 it no longer is
> ("we are not aiming to be offline tab," in the user's own words) — a
> couple of widgets now call small public APIs for real data. See
> `CLAUDE.md`'s "Network calls" entry for exactly which ones and why. For
> the current state of the project, start with **`README.md`** at the repo
> root; for the specific rules/patterns a contributor (human or AI) should
> follow when touching this code, see **`CLAUDE.md`**. Don't treat this file
> as up to date on its own.

---

## 1. Executive Summary

Tabscape is a Chrome new tab replacement extension where widgets are arranged using an interaction model directly inspired by the iOS home screen: long-press to enter "jiggle mode," drag widgets freely, resize them, add new ones from a gallery, and remove them — all through direct manipulation, with no settings forms or configuration modals. The canvas sits on top of a small set of curated, lightweight animated backdrops, plus user-uploaded photo/video backgrounds.

**Positioning statement:** *"Your new tab, rearranged like your home screen."*

**Primary differentiator:** No existing new-tab extension (Bonjourr, Tabliss, Infinity, Momentum, New Tab Widgets) implements true direct-manipulation widget editing. All of them use settings-panel-based configuration. This is the product's core wedge.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- Ship a working MVP in 2–3 days.
- Make the widget-editing interaction feel physically convincing (spring-based motion, not linear/instant snapping).
- Keep the widget catalog small and deliberately curated (4 widgets at launch).
- Ship with zero required accounts, zero required network calls, fully local by default.
- Produce a result that is portfolio- and demo-video-ready.

### 2.2 Non-Goals (v1)
- Not building a general-purpose dashboard or productivity suite.
- Not matching competitors on widget catalog size.
- Not building account creation, cloud sync, or cross-device state.
- Not implementing true iOS-style push/reflow collision handling at launch (see §5.4).

---

## 3. Target User & Use Case

**Primary audience:** General-purpose, aesthetically-minded Chrome users (minimalist/design-conscious segment), not a specific professional niche.

**Core use case:** User installs the extension, arranges 2–5 widgets to their liking in under a minute using drag/resize, and thereafter opens new tabs dozens of times a day passively enjoying the arrangement and the animated background.

**Job to be done:** "Make my new tab feel like *mine*, effortlessly, the same way I've already customized my phone's home screen."

---

## 4. Functional Requirements

### 4.1 Edit Mode ("Jiggle Mode")

| ID | Requirement |
|------|-------------|
| FR-1 | User can enter edit mode via long-press (≈500ms) on any widget or empty canvas area. |
| FR-2 | On entering edit mode, all widgets animate into a continuous subtle "wobble" (rotation oscillation), with per-widget randomized phase offset so widgets are not synchronized. |
| FR-3 | While in edit mode, every widget displays a remove control (× badge, top-left or top-right corner). |
| FR-4 | While in edit mode, a persistent "Done" control is visible to allow explicit exit. |
| FR-5 | Tapping/clicking outside any widget (on empty canvas) while in edit mode exits edit mode. |
| FR-6 | Edit mode must also be enterable via a non-long-press affordance (e.g., a small pencil/edit icon) for accessibility and trackpad-only users who may not reliably trigger a long-press. |

### 4.2 Widget Manipulation

| ID | Requirement |
|------|-------------|
| FR-7 | In edit mode, user can drag any widget to any position on the canvas. |
| FR-8 | Drag motion uses spring/inertia-based follow (widget lags slightly behind pointer, settles with a spring on release) rather than 1:1 instant positioning. |
| FR-9 | On drag release, widget soft-snaps to the nearest grid position if within a defined snap threshold; otherwise remains in its free position. |
| FR-10 | User can resize a widget by dragging a corner handle, visible only in edit mode. |
| FR-11 | Resizing updates widget content layout live (no placeholder/blank state during resize). |
| FR-12 | User can remove a widget by tapping its × badge; removal is immediate, no confirmation dialog required for v1. |
| FR-13 | User can add a widget via a persistent "+" control, which opens a widget gallery. |
| FR-14 | Selecting a widget type from the gallery places it on the canvas at a default position/size, pre-populated with real (not placeholder) content. |

### 4.3 Widgets (v1 Catalog — 4 total)

| Widget | Behavior |
|---|---|
| Clock | Displays current time; updates live; 12/24hr toggle in a minimal widget-level setting. |
| Search bar | Submits query to user's default search engine (or a configurable one); focus-to-expand interaction. |
| Quick Links / Shortcuts | User-defined list of shortcut tiles (favicon + label), added/edited inline. |
| Notes | Freeform single text area, persisted locally, no formatting toolbar in v1. |

No additional widgets in v1. Widget gallery UI should be built to accept future additions without architectural rework (see §6.3).

### 4.4 Backgrounds

**Design approach:** To ship a large, aesthetically varied background catalog within the timeline, backgrounds are built as a small number of **engines** (distinct animation systems), each exposing multiple **presets** (palette, speed, density, and parameter variations). Users perceive this as "numerous distinct backgrounds"; the codebase only maintains a handful of actual render loops. This keeps both build time and performance-testing surface area small while satisfying the goal of a large, appealing catalog. This generative system remains the **default, always-available, fully offline** background source (see NFR-3).

In addition to the generative engines, v1 ships **local media backgrounds**: the user can upload their own photo or video file from their device, and a small set of bundled default media backgrounds ships with the extension for anyone who doesn't want to supply their own. No external provider, no network call, no backend of any kind is involved — this replaces the previously-considered Unsplash/Pixabay-style provider integration entirely for v1.

| ID | Requirement |
|------|-------------|
| FR-15 | At least 4 distinct background **engines** ship at launch (e.g., gradient flow field, drifting particles, soft aurora/mesh gradient, geometric drift). Each built with CSS/Canvas (not video). |
| FR-15a | Each engine ships with a minimum of 4 curated **presets** (palette + parameter variations), yielding a target of 16–20+ selectable backgrounds at launch from the 4 underlying engines. |
| FR-15b | Presets are defined as data (color palettes, speed/density/scale parameters) layered onto a shared engine, not as separate code paths — adding a preset post-launch should require no engine changes. |
| FR-16 | User can browse and select an active background from a visual gallery-style picker (thumbnail previews, not a dropdown list) — not part of edit mode. Generative engines and photo search are presented as separate tabs/sections within this picker. |
| FR-17 | Background respects `prefers-reduced-motion` — falls back to a static frame if set, per engine. |
| FR-18 | Background rendering must not block or degrade widget-layer interaction performance (see NFR-2). Performance is validated **per engine** (4 total), not per preset, since presets share an engine's render cost profile. |
| FR-19 | User can upload a local photo or video file as the active background via a file picker within the background gallery. |
| FR-20 | Accepted formats are limited to what Chrome can reliably render: images (JPG, PNG, WebP, GIF) and video (MP4/H.264, WebM). "Any format" is not literally supported — arbitrary containers (e.g., MKV, AVI, MOV with unsupported codecs) are rejected with a clear inline message explaining why, rather than a silent failure or broken playback. |
| FR-21 | Uploaded media persists locally across sessions (see §6.6 for storage approach) so the user does not need to re-select the file every time a new tab opens. |
| FR-22 | A file size ceiling is enforced (exact threshold to be tuned during implementation, e.g., in the tens of megabytes) to protect against pathological performance cases; a file exceeding it is rejected with a clear explanation, not silently blocked or degraded. |
| FR-23 | v1 ships with 2–3 bundled default media backgrounds (a mix of photo and/or short looping video) selectable from the same gallery, requiring no upload from the user. |
| FR-24 | Uploaded or bundled video backgrounds autoplay muted and loop continuously; playback pauses when the new tab is not the visible/active tab (via the Page Visibility API) to conserve CPU and battery. |
| FR-25 | Removing or replacing an uploaded background deletes its stored data (see §6.6), preventing unbounded local storage growth over time. |

### 4.5 Persistence

| ID | Requirement |
|------|-------------|
| FR-26 | Widget layout (type, position, size, content) persists locally across browser sessions. |
| FR-27 | Selected background (generative engine+preset, bundled default asset, or user-uploaded media reference) persists locally across sessions. |
| FR-28 | First-run experience (zero widgets placed) must present a non-empty, intentional default layout — not a blank page. |

### 4.6 Explicitly Out of Scope for v1

- True grid reflow / push-displacement collision handling (widgets may freely overlap in v1; see §5.4 for rationale and v1.x follow-up).
- Provider-based photo/video search (Unsplash, Pixabay, Pexels, Coverr, or any external media API) — evaluated and deliberately replaced with local file upload plus bundled defaults for v1 (see §4.4). No network calls or backend are needed for backgrounds as a result. May be revisited as a v1.x addition alongside, not instead of, local upload.
- Any account system, authentication, or cloud sync.
- Third-party integrations (weather APIs, Gmail, calendar, RSS).
- Custom CSS injection or theming beyond background selection.
- Multiple pages/workspaces (swipeable home screens) — planned for a later release.

---

## 5. Non-Functional Requirements

### NFR-1: Load Performance
New tab must render an interactive, populated page in **under 150ms** from tab open, with no flash of unstyled content and no visible blank frame. This is a hard requirement — new tab pages are judged on first paint more than any other metric.

### NFR-2: Interaction Performance
All drag, resize, and wobble animations must sustain **60fps** on mid-range hardware, including while a background animation is actively rendering. Frame budget must be profiled explicitly, not assumed. Animations must use GPU-compositable properties (`transform`, `opacity`) exclusively — no properties that trigger layout reflow (`top`, `left`, `width`, `height` during active drag) should be animated per-frame. **Caveat for user-uploaded video backgrounds:** unlike the curated generative engines, an arbitrary uploaded file's decode cost cannot be fully controlled or pre-validated — this is treated as a best-effort target for uploaded video, not a guarantee, and is mitigated (not eliminated) by the file-size ceiling (FR-22) and pausing playback when the tab is hidden (FR-24).

### NFR-3: Privacy
No network calls of any kind are required for any v1 functionality — the generative background engines, local media upload, the bundled default backgrounds, all 4 widgets, and full widget editing work entirely offline. No account creation. No telemetry beyond what is strictly necessary and disclosed. All user data (layout, notes content, links, and uploaded media) stored locally only, on-device.

### NFR-4: Resource Footprint
Extension bundle size and background memory usage should remain minimal — this is a new tab page opened dozens of times per day; any perceptible memory bloat or battery drain is disqualifying for user retention and for Chrome Web Store review sentiment. This applies directly to the bundled default media backgrounds (FR-23): any bundled video clips should be short, loop-friendly, and aggressively compressed, since they ship inside the extension package itself and directly inflate install size.

### NFR-5: Reliability
No dependency on external services for baseline function — the extension works fully offline in every v1 configuration, with no exceptions or opt-in network features.

### NFR-6: Accessibility
- `prefers-reduced-motion` must be respected for both background animation and wobble/spring interactions (fallback to reduced or no motion).
- Edit mode must be enterable without relying solely on a timed long-press gesture (see FR-6).
- Sufficient contrast between widget content and any active background.

### NFR-7: Browser Compatibility
Target Chrome (Manifest V3) as the primary and only platform for v1. No commitment to Firefox/Edge/Safari parity at this stage.

---

## 6. Architecture

### 6.1 High-Level Structure

```
┌─────────────────────────────────────────────┐
│              New Tab Page (SPA)              │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │     Background Layer (Canvas/CSS)     │    │
│  │     - independent render loop         │    │
│  │     - GPU-composited, own layer       │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │        Widget Canvas Layer            │    │
│  │   - Widget instances (positioned)     │    │
│  │   - Edit-mode state machine           │    │
│  │   - Drag/resize/spring-physics engine │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  ┌─────────────────────────────────────┐    │
│  │      Chrome/UI Layer (controls)       │    │
│  │  - Background picker                  │    │
│  │  - Widget gallery ("+" panel)          │    │
│  │  - Edit-mode "Done" affordance         │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐      ┌──────────────────────┐
        │  Local Storage Layer     │      │  IndexedDB             │
        │  (chrome.storage.local)  │      │  - uploaded background │
        │  - widget layout state   │      │    media (blobs)       │
        │  - widget content data   │      │  - see §6.6             │
        │  - selected background   │      └──────────────────────┘
        │  - user preferences      │
        └─────────────────────────┘
```

### 6.2 State Management

- **Single source of truth** for layout state: an in-memory store (see §7 stack) hydrated from `chrome.storage.local` on load, and written back on every layout mutation (debounced to avoid excessive writes during active drag).
- **Edit-mode state** (boolean + which widget, if any, is actively being dragged/resized) kept separate from persisted layout state — this is ephemeral UI state, not saved data.
- Writes to storage should be debounced (e.g., 300–500ms after drag/resize end) rather than firing on every animation frame.

### 6.3 Widget System Design

Widgets should be implemented as a **registry pattern** from day one, even with only 4 widgets, to avoid rework when the catalog expands:

```
WidgetDefinition {
  type: string                // unique id, e.g. "clock"
  displayName: string
  defaultSize: { w, h }
  minSize: { w, h }
  maxSize: { w, h }
  render(container, state, onStateChange): void
  serialize(state): JSON
  deserialize(json): state
}
```

Each widget owns its own render/serialize logic; the canvas layer only handles position, size, and edit-mode chrome (wobble, remove badge, resize handle) — it should have no knowledge of widget-specific content.

### 6.4 Drag/Physics Engine

- A dedicated module handles: pointer tracking, spring interpolation (position lag/catch-up), scale-up-on-grab, shadow elevation, snap-on-release threshold detection.
- This module should be decoupled from any specific widget type — it operates purely on generic "draggable box" primitives (id, x, y, w, h).
- Recommend leveraging an existing spring-physics library (see §7) rather than hand-rolling spring math, given the 2–3 day timeline.

### 6.5 Background Rendering

- Each background **engine** is a self-contained module implementing a common interface (`start(preset)`, `stop()`, `respectsReducedMotion()`), where `preset` is a plain data object (palette array, speed, density, scale, etc.) that parameterizes the same render loop.
- **Presets** are stored as a simple catalog of data objects per engine (e.g., `gradientFlowPresets.ts` exporting an array of palette/parameter combinations) — no separate rendering code per preset. This is what allows a 16-20+ item background gallery to be built from ~4 actual render loops.
- Runs on its own compositing layer (e.g., a `<canvas>` with `will-change: transform` or CSS animations on a dedicated layer) so its render loop cannot block or be blocked by widget drag calculations.
- Background gallery UI reads the engine+preset catalog to render thumbnails; thumbnails can be pre-rendered static snapshots or a short live loop, whichever is cheaper to generate — pre-rendered snapshots are recommended for v1 to avoid 16-20 simultaneous live canvases in the picker view.

### 6.6 Local Media Backgrounds

**What it is:** User-uploaded photo/video backgrounds and the bundled default set, both handled entirely client-side — no network calls, no external service, no backend of any kind.

- **Upload flow:** a standard file picker (`<input type="file">`) in the background gallery. On selection, the file's MIME type/container is validated client-side against the accepted set (FR-20) before anything else happens; rejected files surface a clear inline message naming what is and isn't supported, rather than failing silently or attempting playback and breaking.
- **Storage:** uploaded media is stored as a `Blob` in **IndexedDB**, not `chrome.storage.local` — `chrome.storage.local` has a small effective quota and is a poor fit for binary media of any real size, while IndexedDB is built for this and has a much larger practical ceiling. A lightweight wrapper library (e.g. `idb`) is recommended over hand-rolling raw IndexedDB calls to keep this simple. Only a reference/key to the stored blob is kept in the main layout state (§8) — the blob itself never round-trips through `chrome.storage.local`.
- **Manifest permission:** request the `unlimitedStorage` permission to reduce the risk of the browser evicting stored media under storage pressure, since uploaded video in particular can be large enough to bump against default IndexedDB quota heuristics.
- **Rendering:** at render time, the stored blob is retrieved from IndexedDB and converted to a `URL.createObjectURL()` reference for the `<img>`/`<video>` element — object URLs are not persisted directly, they're regenerated each session from the persisted blob.
- **Bundled defaults (FR-23):** shipped as static assets inside the extension package itself, referenced directly with no upload or IndexedDB involvement — these are the zero-effort, always-available options for anyone who doesn't want to supply their own media.
- **Video playback behavior (FR-24):** muted, `loop`, `autoplay`, `playsinline`; combined with the Page Visibility API to pause the video element when the new tab is not the active/visible tab, protecting battery life during long idle periods with the tab open in the background.
- **Cleanup (FR-25):** removing or replacing a background deletes the corresponding IndexedDB entry immediately, rather than leaving orphaned blobs to accumulate indefinitely.
- **No processing/transcoding:** v1 does not attempt to compress, resize, or transcode uploaded media — it is accepted as-is (subject to the format and size checks above) and played directly. Transcoding is real complexity that isn't warranted for an MVP; it's a candidate for a future version if oversized/unoptimized uploads prove to be a common problem in practice.

---

## 7. Technology Stack (Proposed)

| Layer | Choice | Rationale |
|---|---|---|
| Extension framework | Manifest V3, `chrome_url_overrides.newtab` | Required for the new-tab-override capability. |
| UI framework | React (or Preact for smaller bundle) | Widget registry/component model maps naturally to widget-per-component; large ecosystem for drag interactions. |
| Animation/physics | Framer Motion (if React) or a lightweight spring library (e.g., `@react-spring/web`) | Avoids hand-rolling spring/inertia math under time pressure; both support gesture-driven drag well. |
| Background rendering | Native Canvas 2D API or lightweight CSS/SVG animation | Avoid heavier WebGL libraries unless a specific background design requires it — keep bundle size and GPU cost low. |
| State/storage | `chrome.storage.local` API, wrapped in a small store (e.g., Zustand or plain pub-sub) | No need for a heavy state library; `chrome.storage.local` gives persistence, a thin store gives reactivity. |
| Photo/video backgrounds | Local file upload + bundled defaults, no external provider | Sidesteps every provider ToS/CORS/rate-limit/cost issue evaluated earlier (Unsplash, Pexels, Pixabay, Coverr) entirely — nothing to integrate, nothing to pay for, nothing that can be rate-limited. |
| Uploaded media storage | IndexedDB (via a lightweight wrapper, e.g. `idb`) | Built for binary blob storage with a much larger practical quota than `chrome.storage.local`; see §6.6. |
| Build tooling | Vite (with `@crxjs/vite-plugin` or similar MV3-aware plugin) | Fast local dev loop, good MV3 extension support. |
| Language | TypeScript | Widget registry pattern and serialization benefit strongly from type safety given multiple widget types sharing an interface. |

**Explicitly avoided for v1:** heavy state-management frameworks (Redux, etc.) — unnecessary overhead for this scope; WebGL/Three.js — reserve for a future background upgrade only if a design genuinely requires it; any backend or external service — not needed, the entire experience including custom backgrounds is fully local; video/image transcoding or compression libraries — uploaded media is accepted as-is subject to format/size validation, not processed (see §6.6).

---

## 8. Data Model

```
LayoutState {
  widgets: WidgetInstance[]
  selectedBackground: {
    source: "engine" | "bundled" | "upload"
    engine?: string        // when source is "engine"
    presetId?: string      // when source is "engine"
    assetId?: string       // when source is "bundled"
    mediaKey?: string      // IndexedDB key, when source is "upload"
  }
  preferences: {
    reducedMotion: "auto" | "on" | "off"
    clockFormat: "12h" | "24h"
    searchEngine: string
  }
}

WidgetInstance {
  id: string              // unique instance id
  type: string            // references WidgetDefinition.type
  position: { x: number, y: number }
  size: { w: number, h: number }
  data: JSON               // widget-specific content (e.g., notes text, links list)
}
```

Stored as a single serialized object under one `chrome.storage.local` key (e.g., `tabscape_layout_v1`) to keep reads/writes simple and atomic. Versioned key naming (`_v1`) is intentional — anticipate a future migration when widget schema changes.

---

## 9. Milestones

### Day 1 — Core Interaction Engine
- Edit-mode state machine (enter/exit, long-press + explicit toggle)
- Wobble animation with per-widget phase offset
- Drag with spring-follow physics
- Grid-snap-on-release
- Resize handles with live reflow
- **Exit criteria:** a single placeholder widget can be dragged, resized, and feels physically convincing — this is the go/no-go checkpoint for the whole timeline.

### Day 2 — Widgets, Gallery, Background Engines
- Implement all 4 widgets against the registry interface
- Widget gallery ("+") UI, add/remove flow end to end
- Build background engine #1, profile combined performance (background + drag simultaneously) — validate NFR-2 early, before investing in the remaining engines
- Build remaining 3 background engines, each with an initial preset
- **Exit criteria:** all 4 engines run cleanly alongside active widget dragging with no dropped frames — this gates whether preset expansion (Day 3) is worth doing.

### Day 3 — Presets, Local Media Backgrounds, Persistence, Polish, Ship
- Expand each engine to 4+ presets (palette/parameter data only — no new render logic)
- Background gallery picker UI with pre-rendered thumbnails (see §6.5)
- Local media upload flow (§6.6): file picker, format validation (FR-20), size ceiling check (FR-22), IndexedDB storage wiring, object URL rendering, cleanup-on-removal (FR-25)
- Video playback behavior: muted/loop/autoplay, Page Visibility API pause-when-hidden (FR-24)
- Source and integrate 2-3 bundled default backgrounds (FR-23) — keep any bundled video short and well-compressed given NFR-4
- `chrome.storage.local` wiring, debounced writes, load/hydrate on start
- First-run default layout (FR-28)
- `prefers-reduced-motion` handling
- Performance/profiling pass against NFR-1 and NFR-2, including a real uploaded video file, not just the bundled defaults
- Chrome Web Store listing assets: screenshots (mid-jiggle-mode hero shot, background gallery grid), demo clip, store description
- Submission

**Note:** removing the Unsplash/proxy integration nets a genuine timeline benefit — no external service to deploy, configure, or apply for elevated access with. This time is better spent on the upload flow and on the profiling pass against real (not just curated) uploaded media, since that's where this feature's actual risk lives.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Spring physics feel "off" (too stiff, too floaty) | High — this is the core differentiator | Budget explicit iteration time on Day 1, not just implementation time; test against real iOS reference feel, not formulas alone. |
| Background animation competes with drag physics for frame budget | High — causes jank, which undermines the entire "feels native" pitch | Profile on Day 2 as soon as first background + drag coexist; keep background on its own compositing layer; use `transform`/`opacity` only during drag. |
| Scope creep into full grid-reflow (push/displacement) | Medium — could consume remaining timeline | Explicitly deferred per §4.6; only revisit post-launch once core loop is validated. |
| Long-press gesture unreliable on trackpad/desktop | Medium — accessibility and usability | FR-6 mandates an explicit edit-mode toggle as a fallback, not solely a gesture. |
| Chrome Web Store review flags for permissions | Low-Medium | Keep manifest permissions minimal — no host permissions beyond what's strictly needed for the search widget's query submission. |
| Preset expansion quietly turns into per-background custom code, re-inflating scope | Medium — undermines the entire point of the engine/preset split | Enforce discipline: a preset must only ever be a data object (palette, speed, density, scale). If a "background idea" can't be expressed as parameters on an existing engine, it becomes a candidate for a 5th engine post-launch, not a Day 2/3 addition. |
| Arbitrary user-uploaded video has unpredictable decode cost, risking an NFR-2 violation on some users' files even though bundled defaults and generative engines are fine | Medium-High — a user's own upload could make their new tab janky in a way that's hard to fully prevent | Enforce the file-size ceiling (FR-22); pause playback when the tab is hidden (FR-24) to at least bound worst-case sustained cost; treat 60fps for uploaded video as a best-effort target (see NFR-2 caveat), not a hard guarantee the way it is for the curated generative engines. |
| "Any format" expectation mismatch — users assume arbitrary video/image files will work, when browsers only reliably support a defined codec set | Low-Medium — confusing failed uploads read as bugs if not explained | FR-20 mandates clear, specific inline messaging on rejection (naming what is/isn't supported), not a generic "upload failed" error. |
| IndexedDB storage growth or eviction under browser storage pressure, especially with larger video uploads | Low-Medium — a background could silently disappear if the browser reclaims storage | Request the `unlimitedStorage` manifest permission (§6.6) to reduce eviction risk; FR-25's cleanup-on-removal prevents unbounded accumulation from replaced backgrounds adding to the pressure unnecessarily. |
| Bundled default video backgrounds inflate extension package size, working against NFR-4 | Low-Medium — larger install size affects both load characteristics and Chrome Web Store review perception | Keep any bundled video short and aggressively compressed; if this proves difficult to do well, default to photo-only bundled assets for v1 and treat bundled video as a v1.x nice-to-have rather than force it in. |
---

## 11. Success Criteria for MVP

- A first-time user can, without instruction, discover edit mode, add a widget, move it, resize it, and exit edit mode within roughly one minute of first opening a new tab.
- Drag/resize/wobble interactions sustain 60fps on a mid-range laptop with a background actively animating.
- New tab renders interactively in under 150ms.
- Zero network calls required for any part of the experience — including custom backgrounds — and zero account creation.
