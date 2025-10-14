# Sorbisch leicht — React Native Handoff Plan (Standalone)

This document is a complete, implementation-ready handoff for a coding AI to build **Sorbisch leicht**, a bilingual Sorbian↔German language-learning app on **iOS and Android** using **React Native + TypeScript**. It specifies purpose, scope, features, UX, data model, architecture, offline/audio behavior, testing, CI/CD, and acceptance criteria.

---

## 1) Product Overview

**Purpose:** Teach Sorbian through vocabulary and phrases with professional audio, lightweight exercises, and friendly progress tracking. The app must be **offline-first**, **audio-centric**, and **fast**. Content is local + on-demand assets, so learners can practice anywhere.

**Platforms:** iOS (15+), Android (8+), single codebase (React Native, Expo Managed preferred).

**Languages:** German (DE), Sorbian (SB). The UI language can follow device language; learning content shows both languages with a primary/secondary preference for phrase mode.

**Monetization:** Not specified. Assume free with no login for v1.

---

## 2) Target Users & Goals

* **Beginners**: quick start, simple flows, audio-first.
* **Returning learners**: resume last topic, master items to completion.
* **Audio-focused learners**: continuous playback for phrases; seek/jump.

**Top goals:**

1. Start learning immediately (no account).
2. Reliable, clear audio for each item.
3. Track progress and suggest the right next step ("Smart Next").
4. Work fully offline after initial asset downloads.

---

## 3) Feature Set (Functional Requirements)

### 3.1 Home

* Overall progress card (percentage + mastered topics count).
* “Smart Next” CTA: continue the most relevant next action.
* Recent Activity list (last 3 actions with deep links).
* Beginner card (if fresh profile) → Start with first vocabulary topic.

### 3.2 Vocabulary Learning

1. **Topic Selection**

   * Grid/list of topics with bilingual names, icon, progress ring.
   * Tap → Topic Overview (optional) → Learning flow.

2. **Hearing/Reading**

   * Paged carousel (one item per page) with image, DE/SB text.
   * Tap to play Sorbian audio; optional auto-advance after playback.
   * Progress indicator (n of N). Next → Assigning.

3. **Assigning (Matching)**

   * Match German ↔ Sorbian pairs (tap-to-match or drag).
   * Immediate feedback, per-item correctness tracked.
   * Next → Writing when sufficient items completed.

4. **Writing**

   * Free-text input for Sorbian; validate against canonical + variants.
   * Accent-insensitive matching; whitespace tolerant.
   * Completion summary (score, weak items, suggested next step).

### 3.3 Phrases Learning

* Topic Selection list with progress.
* Topic screen with two playback modes:

  * **Single Mode**: tap any phrase to play (DE or SB per setting).
  * **Auto Mode**: continuous playback through list; seek bar; highlight current phrase; pause/resume; background-safe.
* Language preference toggle (DE primary or SB primary) persisted.
* Info dialogs: pronunciation or cultural notes per topic.

### 3.4 “Sorbian in 100 Seconds”

* 5 themed audio segments with optional images; transport controls; seek; quick-jump buttons.

### 3.5 Search

* Global search (offline) across vocabulary and phrases.
* Full-text search (FTS) with result ranking; quick play for audio from results.

### 3.6 Settings

* Phrases primary language (DE or SB).
* Download policy: Wi‑Fi only | Always | Manual.
* Manage downloads: show cached size; clear cache (confirm).
* Reset progress (confirm).
* Theme: System | Light | Dark.
* Legal (licenses, privacy).

### 3.7 About

* App version, credits, contact info, acknowledgements.

---

## 4) Non-Functional Requirements

* **Offline-first**: After first open, all learning works offline; assets are downloaded per-topic.
* **Performance**: Cold start < 2.5s on mid/low Android; smooth 60fps scrolling.
* **Audio Reliability**: No stutters; correct focus/ducking behavior; proper cleanup.
* **Accessibility**: Screen reader labels, large hit targets, dynamic type.
* **Privacy**: No account required; analytics anonymized/opt-out; no PII.
* **Resilience**: Robust to missing asset files; graceful fallbacks.

---

## 5) Architecture & Tech Choices

* **React Native + TypeScript** (Expo Managed).
* **Navigation:** React Navigation (Stack + Tabs as needed).
* **State:** Redux Toolkit for app state; MMKV for preferences; RTK Query or lightweight data-service layer.
* **Audio:** `react-native-track-player` (queues, background support, seek).
* **Storage:** SQLite via `expo-sqlite` for content, progress, search index; MMKV for prefs.
* **FS/Downloads:** Expo FileSystem for asset cache (audio/images). SHA-256 file naming.
* **Search:** SQLite FTS5 table for offline search.
* **i18n:** `i18next` or `react-intl`.
* **Analytics:** Firebase Analytics; crashes via Sentry.
* **Testing:** Jest + RNTL + Detox.
* **CI/CD:** GitHub Actions + Expo EAS Build/Update.

---

## 6) Project Structure

```
apps/mobile/
  app/                 # (Expo router or custom navigator)
  src/
    app/               # navigation setup & route config
    components/        # reusable shared components
    screens/           # screen-level components
    features/
      home/
      vocabulary/
      phrases/
      hundredSeconds/
      search/
      settings/
      about/
      audio/
      progress/
      content/
    store/             # Redux store, slices, selectors
    services/
      db/              # SQLite access, migrations, DAOs
      fs/              # downloads, hashing, cache helpers
      analytics/
      notifications/
    theme/             # tokens, typography
    i18n/
  assets/
  scripts/             # migration + seeding tools
```

---

## 7) Data Model (TypeScript Interfaces)

```ts
export type TopicType = "vocabulary" | "phrases" | "hundredSeconds";

export interface Topic {
  id: string;             // stable slug, e.g. "phrases-topic-01"
  type: TopicType;
  nameGerman: string;
  nameSorbian: string;
  icon?: string;          // logical asset name or URL
  audioIntroSorbian?: string;
  order: number;
}

export interface VocabItem {
  id: string;             // e.g. "voc-01-01"
  topicId: string;
  textGerman: string;
  textSorbian: string;
  img?: string;           // logical name or URL
  audioSorbian?: string;  // logical name or URL
  ignoreAssign?: boolean;
  ignoreWrite?: boolean;
}

export interface PhraseItem {
  id: string;             // e.g. "phr-01-01"
  topicId: string;
  germanText: string;
  sorbianText: string;
  germanAudio?: string;
  sorbianAudio?: string;
  type?: "normal" | "separator";
}

export interface HundredSecItem {
  id: string;             // "hs-01"
  name: string;           // e.g. "Begrüßung"
  audio: string;          // logical audio name
  image?: string;
}

export type EntityType = "vocab" | "phrase" | "topic" | "hundred";

export interface Progress {
  entityId: string;
  entityType: EntityType;
  attempts: number;
  correct: number;
  lastSeenAt: number;     // epoch ms
}
```

---

## 8) SQLite Schema (DDL)

```sql
-- Topics
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('vocabulary','phrases','hundredSeconds')),
  name_german TEXT NOT NULL,
  name_sorbian TEXT NOT NULL,
  icon TEXT,
  audio_intro_sorbian TEXT,
  ord INTEGER NOT NULL
);

-- Vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  de TEXT NOT NULL,
  sb TEXT NOT NULL,
  img TEXT,
  audio TEXT,
  ignore_assign INTEGER DEFAULT 0,
  ignore_write INTEGER DEFAULT 0
);

-- Phrases
CREATE TABLE IF NOT EXISTS phrases (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  de TEXT NOT NULL,
  sb TEXT NOT NULL,
  audio_de TEXT,
  audio_sb TEXT,
  item_type TEXT DEFAULT 'normal'
);

-- Hundred Seconds
CREATE TABLE IF NOT EXISTS hundred_seconds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  audio TEXT NOT NULL,
  image TEXT
);

-- Progress
CREATE TABLE IF NOT EXISTS progress (
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY(entity_id, entity_type)
);

-- Actions for Smart Next & history
CREATE TABLE IF NOT EXISTS actions (
  ts INTEGER NOT NULL,
  kind TEXT NOT NULL,
  entity_id TEXT,
  meta_json TEXT
);

-- Unified FTS5 index for search
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  entity_id, entity_type, topic_id, content, tokenize = 'porter'
);
```

**Search indexing strategy:**

* For vocabulary: `content = de || ' ' || sb`.
* For phrases: `content = de || ' ' || sb`.
* Insert entity rows with their `topic_id` for scoped searches.

---

## 9) Content Packaging & Migration (from legacy XML)

**Goal:** Convert legacy XML into JSON + SQLite + asset manifest for offline use.

**Steps:**

1. **Parse XML** using a Node/TS script (`scripts/convert-xml.ts`).

   * Map to the TypeScript interfaces above.
   * Validate fields; normalize whitespace; generate stable `id`s.
2. **Asset Manifest**: produce `manifest.json` mapping logical names → SHA-256 filenames; compute file size & mime.
3. **Seed DB** via `scripts/seed-sqlite.ts` (using `better-sqlite3` in Node):

   * Create schema; insert topics, vocabulary, phrases, hundred seconds; build FTS index.
4. **Bundle strategy:**

   * Ship prebuilt SQLite DB with metadata and first-lesson assets in the app bundle.
   * Large audio/images remain downloadable on-demand.
5. **Runtime download manager:**

   * On opening a topic, fetch required audio/images if missing.
   * Track per-file status and checksum; save under hashed names.
6. **Updates:**

   * Remote `content-manifest.json` with version + file hashes. Compare and download diffs.

---

## 10) Audio System Design

* Library: `react-native-track-player`.
* **Queues**:

  * Phrases Auto Mode: build a queue from current topic items in preferred primary language.
  * Single Mode: transient queue with single item; repeat disabled.
  * Hundred Seconds: queue 5 segments; image sync by playback position events.
* **Controls**: play, pause, seek, skipNext/Prev, setRate (future).
* **Lifecycle**: manage audio focus, ducking, headphone unplug, phone calls.
* **Caching**: before enqueue, ensure local file path exists; if not, download then enqueue.
* **UI bindings**: `useAudioPlayback()` hook reads player state and exposes commands.

---

## 11) Progress & “Smart Next”

**Progress rules**

* Each vocab item has up to **2 exercises** (Assign, Write). Track attempts/correct counts per exercise (identified by `entity_id` convention like `voc-01-01#assign`).
* Mastery threshold per item: `correct/attempts ≥ 0.8` over last N attempts (tuneable, default N=5).
* Topic completion: all items in topic reach mastery for their targeted exercises.

**Smart Next algorithm (pseudocode)**

```text
if has unfinished session context -> resume it
else if last activity type == phrases -> open same topic at next phrase
else if last activity type == vocabulary -> continue current topic at weakest item
else -> suggest first vocabulary topic, Hearing/Reading step

Weakest item selection:
  compute mastery score = (correct+ε)/(attempts+κ) with recency decay
  pick items below threshold; if none, next topic or phrases
```

**Actions logged**: `start_topic`, `complete_item`, `play_audio`, `enter_auto_mode`, `finish_topic`, with timestamps.

---

## 12) UI/UX Design System

**Tokens (example):**

```json
{
  "colors": {
    "bg": "#0F1115",
    "card": "#171923",
    "primary": "#6E9CFD",
    "success": "#22C55E",
    "error": "#EF4444",
    "text": "#E5E7EB",
    "muted": "#9CA3AF"
  },
  "radius": { "sm": 8, "md": 12, "lg": 16, "xl": 20 },
  "spacing": { "xs": 8, "sm": 12, "md": 16, "lg": 24, "xl": 32 },
  "shadow": { "card": { "elevation": 4, "opacity": 0.2 } }
}
```

**Component inventory:**

* `AppBar`, `Screen`, `Card`, `ProgressRing`, `TopicTile`, `AudioBar` (play/pause/seek/time), `PagedItem`, `MatchBoard`, `TextInputAnswer`, `Toast`, `Dialog`, `ListItem`, `Toggle`, `CTAButton`.

**Interactions:**

* Large tap targets (≥ 44pt).
* Haptic feedback on correct/incorrect.
* Smooth page transitions (Reanimated), visible focus for a11y.

**Screens (wireframe level):**

* **Home:** header, progress card, Smart Next button, recent list.
* **Vocab Read:** image top, texts center, audio button bottom, pager dots.
* **Assign:** two columns of chips/cards; connect pairs; feedback overlay.
* **Write:** prompt text + input + submit; inline result; next/skip.
* **Phrases:** list of phrases; play icons; Auto Mode bar pinned bottom with seek.
* **Hundred Seconds:** hero image, track list buttons, full audio controls.
* **Search:** search bar + segmented filter; results list with quick play.
* **Settings:** sections for Language, Downloads, Data, Appearance, Legal.

**Accessibility:** Label all audio controls, announce playback state, provide text alternatives for images.

---

## 13) Navigation Map

```
RootStack
├─ Home
├─ LearnStack
│  ├─ VocabTopics → VocabRead → VocabAssign → VocabWrite → TopicComplete
│  ├─ PhraseTopics → PhraseTopic (List/Auto)
│  └─ HundredSeconds
├─ Search
├─ Settings
└─ About
```

Deep links: `sorbisch://topic/:id`, `sorbisch://vocab/:id`, `sorbisch://phrase/:id`.

---

## 14) Downloads & Offline Strategy

* **On first launch:** ensure prebuilt DB is copied to app data dir.
* **Per-topic downloads:** before learning, enqueue audio/image files for topic; show compact progress indicator.
* **Policies:** enforce Wi‑Fi-only if selected; allow manual download from Topic screen.
* **Cache storage:** `/data/audio/<hash>.mp3`, `/data/img/<hash>.jpg`; map via manifest.
* **Integrity:** verify SHA-256 on first completion; mark valid.
* **Eviction:** LRU strategy when exceeding size cap; surfaces total size in Settings.

---

## 15) Error Handling & Edge Cases

* Missing asset: show warning banner; allow retry; continue without audio.
* Playback errors: stop, reset queue, show toast; log to Sentry.
* DB migration failure: backup old DB, attempt fresh seed; preserve progress if possible.
* Low storage: prompt to free space; pause downloads.

---

## 16) Localization (i18n)

* UI strings in `i18n/*` with German/English (as needed).
* Learning content remains bilingual (DE/SB) from DB; do not translate.
* RTL not required for v1.

---

## 17) Telemetry (Optional, privacy-friendly)

* Events: `app_open`, `topic_open`, `item_play`, `assign_submit`, `write_submit`, `topic_complete`, `search_query`.
* Include only anonymous device/session IDs; honor “limit ad tracking” and in-app opt-out.

---

## 18) Testing Strategy

* **Unit:** reducers/selectors; validators (accent-insensitive compare); Smart Next scoring.
* **Component:** RNTL for screens and key components; mock TrackPlayer + SQLite.
* **Integration:** flows for Vocab (Read→Assign→Write), Phrases Auto, Search.
* **E2E:** Detox: install → onboarding → complete first topic → verify progress.
* **Performance:** profile startup; avoid JS thread stalls; image preloading.
* **Accessibility:** a11y snapshots; VoiceOver/TalkBack navigability.

---

## 19) CI/CD & Releases

* **GitHub Actions**: lint/typecheck/test on PR; build preview via **EAS**.
* **EAS Build**: produce iOS/Android artifacts;
* **EAS Update**: OTA JS updates for hotfixes (no native changes).
* **Sourcemaps:** upload to Sentry.
* **Stores:** App Store & Play Store metadata; privacy labels; screenshots.

---

## 20) Acceptance Criteria (v1)

* Start to first audio playback ≤ 3 taps.
* Fully offline operation for already-opened topics.
* Phrases Auto Mode with seek + highlight works reliably.
* Vocabulary flow completes with accurate scoring and persistence.
* Search returns relevant results offline; tapping plays audio.
* Settings persist, including language preference and download policy.
* Accessibility: all interactive elements screen-reader labelled.

---

## 21) Milestones & Deliverables

1. **Foundation**: app scaffold, navigation, theme, store; DB + migrations; content service; home skeleton.
2. **Audio & Downloads**: TrackPlayer service; download manager; asset manifest integration.
3. **Vocabulary**: topic selection; read; assign; write; progress; completion screen.
4. **Phrases**: topic selection; list mode; auto mode with seek/highlight.
5. **Hundred Seconds**: 5-segment player with image sync.
6. **Search**: FTS index + UI; quick play.
7. **Settings & About**: prefs, downloads, reset, legal.
8. **QA & Polish**: tests, performance, accessibility, analytics, store prep.

---

## 22) Implementation Notes & APIs

**Audio Service API (example):**

```ts
interface AudioService {
  init(): Promise<void>;
  setQueue(items: { id: string; title: string; url: string }[], startIndex?: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  getState(): Promise<{
    isPlaying: boolean; position: number; duration: number; index: number;
  }>;
}
```

**Download Manager API:**

```ts
interface DownloadManager {
  ensureAssets(assets: string[]): Promise<{ ok: string[]; missing: string[]; failed: string[] }>;
  getLocalPath(logicalName: string): Promise<string | null>; // resolves via manifest & hash
}
```

**Progress API (Redux slice):**

```ts
recordAttempt(entityId: string, entityType: EntityType, correct: boolean)
selectTopicProgress(topicId: string): { completed: number; total: number; pct: number }
```

**Smart Next Selector:**

```ts
selectSmartNext(state): { route: string; params?: any; reason: string }
```

---

## 23) Example Mock Data

```json
{
  "topics": [
    {"id":"vocab-01","type":"vocabulary","nameGerman":"Begrüßung und Verabschiedung","nameSorbian":"Postrowjenje a rozžohnowanje","order":1,"icon":"lektion1.png"}
  ],
  "vocabulary": [
    {"id":"voc-01-01","topicId":"vocab-01","textGerman":"Guten Morgen!","textSorbian":"Dobre ranje!","img":"Fotolia_46575927_S.jpg","audioSorbian":"voc_snd_01_01s.mp3"}
  ],
  "phrases": [
    {"id":"phr-01-01","topicId":"phrases-01","germanText":"A a","sorbianText":"a","germanAudio":"snd_/","sorbianAudio":"snd_/","type":"normal"}
  ],
  "hundredSeconds": [
    {"id":"hs-01","name":"Begrüßung","audio":"hundredsec1.mp3","image":"hs1.jpg"}
  ]
}
```

---

## 24) Coding Standards

* TypeScript strict mode; ESLint + Prettier; module boundaries by feature.
* Avoid business logic in components; use selectors/services.
* No blocking operations on UI thread; downloads in background tasks.
* Component props typed; no `any`.

---

## 25) Handoff Checklist

* [ ] Prebuilt SQLite with seed content & FTS index.
* [ ] Asset manifest with hashes + sizes.
* [ ] TrackPlayer service wired to UI hooks.
* [ ] Download manager with integrity checks.
* [ ] Vocabulary (Read/Assign/Write) flows complete.
* [ ] Phrases (Single/Auto) with seek & highlight complete.
* [ ] Hundred Seconds player complete.
* [ ] Search offline working.
* [ ] Settings persist & affect behavior (language, downloads, theme).
* [ ] Accessibility pass; E2E Detox suite green.
* [ ] EAS build scripts & store metadata ready.

---

## 26) Content Delivery, Updates, and App Variants (DE/EN × Upper/Lower Sorbian)

### 26.1 Goals

* **Easy updates** to content (topics, audio, images) without new app releases.
* **Simple development** flow (edit locally, test instantly, no CDN required).
* **Multiple variants** (Upper/Lower Sorbian × DE/EN) delivered either by:

  1. **Runtime selection** (single app with a selector + downloadable packs), or
  2. **Hardcoded variant builds** (each build locked to one pack).
* Flip between (1) and (2) with minimal code changes (ideally config-only).

### 26.2 Definitions

* **Content Pack**: A versioned bundle containing: topics DB rows, audio/image assets, and indexes. Examples:

  * `hsb-de` (Upper Sorbian↔German)
  * `dsb-de` (Lower Sorbian↔German)
  * `hsb-en` (Upper Sorbian↔English)
* Each pack ships with a **Pack Manifest** (JSON) and a signed **Asset Manifest** mapping logical names → hash filenames.

### 26.3 Pack Manifest (pack.json)

```json
{
  "packId": "hsb-de",
  "displayName": "Obersorbisch ↔ Deutsch",
  "languagePrimary": "hsb",
  "languageSecondary": "de",
  "schemaVersion": 1,
  "contentVersion": "2025.10.14-3",
  "requiresAppVersion": ">=1.0.0",
  "db": { "path": "packs/hsb-de/v2025_10_14_3/content.db", "sha256": "..." },
  "assets": {
    "manifestUrl": "https://cdn.example.com/packs/hsb-de/v2025_10_14_3/manifest.json",
    "baseUrl": "https://cdn.example.com/"
  },
  "sizeBytes": 187345678,
  "notes": "Minor fixes to audio for topic 3"
}
```

### 26.4 Asset Manifest (manifest.json)

```json
{
  "version": "2025.10.14-3",
  "files": {
    "voc_snd_01_01s.mp3": { "hash": "3f1a...", "path": "audio/3f/1a/3f1a...mp3", "bytes": 23456 },
    "hs1.jpg": { "hash": "77b2...", "path": "img/77/b2/77b2...jpg", "bytes": 90123 }
  },
  "signatures": { "algo": "ed25519", "sig": "base64..." }
}
```

### 26.5 CDN Layout (recommended)

```
cdn/
  packs/
    hsb-de/
      v2025_10_14_3/
        pack.json
        manifest.json
        content.db     # (optional; or shipped in app and patched)
        audio/...      # hashed
        img/...        # hashed
    dsb-de/
      v2025_09_29_1/...
    hsb-en/
      v2025_10_01_2/...
index.json              # list of available packs + latest versions
```

**`index.json`** (for runtime browsing):

```json
{
  "packs": [
    { "packId": "hsb-de", "latest": "2025.10.14-3", "displayName": "Obersorbisch ↔ Deutsch" },
    { "packId": "dsb-de", "latest": "2025.09.29-1", "displayName": "Niedersorbisch ↔ Deutsch" },
    { "packId": "hsb-en", "latest": "2025.10.01-2", "displayName": "Upper Sorbian ↔ English" }
  ]
}
```

### 26.6 App Runtime Modes (switchable)

**Mode A — Single App with Pack Selector (default)**

* On first launch, show a **Pack Selection** screen that fetches `index.json`.
* User chooses a pack → app downloads `pack.json`, verifies `requiresAppVersion`, downloads/activates `content.db` and assets **on-demand**.
* Users can later switch packs in Settings → “Content Packs”.

**Mode B — Hardcoded Variant Build**

* Build-time config sets `PACK_ID=hsb-de` (e.g., via `.env`, app.json, or EAS profile).
* App skips selection screen and **auto-activates** `PACK_ID`.
* Pack switching UI hidden; only updates for that pack are offered.

**Implementation Switch**

* Centralized `Config`:

```ts
export const Config = {
  MODE: __DEV__ ? "selector" : process.env.PACK_MODE ?? "selector", // "selector" | "fixed"
  FIXED_PACK_ID: process.env.PACK_ID, // e.g., "hsb-de"
  CDN_INDEX_URL: process.env.CDN_INDEX_URL,
};
```

* Navigation guard at bootstrap:

```ts
if (Config.MODE === "fixed" && Config.FIXED_PACK_ID) { activatePack(Config.FIXED_PACK_ID); }
else { navigate("PackSelection"); }
```

### 26.7 Development Experience (no-server, instant iteration)

* **Local Dev Server (optional)**: `scripts/dev-content-server.ts` serves `/index.json`, `/packs/*/pack.json`, and static assets from the repo.
* **File Sources:**

  * If `DEV_CONTENT_DIR` is set, the app loads packs directly from the local file scheme (`FileSystem.documentDirectory`) or from `http://localhost:PORT` when running in simulator.
  * Fallback to CDN in production.
* **Hot Iterate:** edit JSON/DB and assets → refresh app; no store upload required.
* **Validator CLI:** `scripts/validate-pack.ts` checks schema, missing files, and referential integrity.

### 26.8 Database Strategy per Pack

* Option 1 (simple): Each pack includes its own **content.db** prebuilt with topics/items/FTS rows. Switching packs replaces the active DB file + clears caches.
* Option 2 (shared DB): Single DB with packId column; on switch, we change `active_pack_id` and invalidate search index. (More complex migrations.)

**Recommendation:** Start with **Option 1** (simple replaceable DB). Keep user **progress** in a **separate DB** (`progress.db`) keyed by `packId` to avoid collisions.

### 26.9 Switching Packs at Runtime

* Show installed packs with version + size.
* On switch: pause audio, save state, deactivate current pack, activate new pack, rebuild in-memory indices, and navigate to Home.
* Prompt about progress scope: explain that progress is per-pack (`hsb-de` progress doesn’t transfer to `dsb-de`).

### 26.10 Update Workflow

* On app start (and daily), check `pack.json` for the active pack; compare `contentVersion` with remote `index.json`.
* If newer:

  1. Download new `pack.json`.
  2. If `requiresAppVersion` unmet → notify user to update app.
  3. Download `content.db` (if changed) and **lazy** download assets when needed.
  4. Verify signatures/hashes; activate new pack; keep old pack as rollback until first successful session.

### 26.11 Security & Integrity

* Sign `manifest.json` (ed25519) and embed public key in app.
* Verify SHA-256 per file on first download; keep a `verified=1` flag.
* Use HTTPS; support pinned cert (optional).

### 26.12 Storage & Caching

* Assets stored by **hash path**; reference via logical name → hash lookup.
* LRU eviction with max cache size, configurable per pack.
* “Manage Downloads” shows per-pack usage; enable “Download whole pack” for offline trips.

### 26.13 UX: Pack Selection Screen (Mode A)

* List from `index.json` with `displayName`, language badges, size estimate.
* On tap: show details (version, changes), then “Download & Activate”.
* Allow cancel/resume; background progress with a small banner.

### 26.14 Build Profiles (EAS / Gradle Flavors / Xcode Schemes)

* **EAS profiles**: `preview-selector`, `release-selector`, `release-hsb-de`, `release-dsb-de`, `release-hsb-en`.
* `release-*-fixed` profiles set `PACK_MODE=fixed` and `PACK_ID` accordingly.
* App name / icon can remain shared, or use per-flavor overrides if publishing separate store listings.

### 26.15 Minimal APIs to Implement

**PackRegistry**

```ts
listRemotePacks(): Promise<PackSummary[]> // reads index.json
getPackManifest(packId: string, version?: string): Promise<PackManifest>
```

**PackManager**

```ts
installPack(packId: string, version?: string): Promise<void>
activatePack(packId: string): Promise<void>
switchPack(packId: string): Promise<void>
checkForUpdates(activePackId: string): Promise<UpdateInfo | null>
```

**AssetResolver**

```ts
resolve(logicalName: string): Promise<string /* local file path */>
ensureAll(logicalNames: string[]): Promise<void>
```

**ProgressStore**

```ts
// progress.db, keyed by packId
ecordAttempt(packId: string, entityId: string, entityType: EntityType, correct: boolean): void
```

### 26.16 Fallback When Offline on First Launch

* Ship a tiny **starter pack** (e.g., `hsb-de-lite`) embedded in the app so the user can start instantly.
* When online, prompt to upgrade to the full pack.

### 26.17 Incomplete Content Packs (Module Capability Matrix)

**Requirement:** Some packs ship only certain modules. Specifically, **Vocabulary** and **Hundred Seconds** are **only** available in Upper Sorbian variants (e.g., `hsb-de`, `hsb-en`). Lower Sorbian (`dsb-*`) may contain **Phrases only**.

#### 26.17.1 Pack Manifest — Declare Module Availability

Add a `modules` field to `pack.json`:

```json
{
  "packId": "dsb-de",
  "modules": {
    "vocabulary": false,
    "phrases": true,
    "hundredSeconds": false
  }
}
```

*Defaults*: if omitted, treat as `false` (explicit is better).

#### 26.17.2 App Behavior

* **Navigation guards**: hide cards/entries for unavailable modules. If deep-linked, show a friendly "This content isn’t included in your pack" dialog with options to:

  * Switch to a pack that has it (if selector mode), or
  * Dismiss (if fixed mode).
* **Home screen**: only render progress cards and Smart Next suggestions for available modules.
* **Search**: scope results to available modules; don’t index missing ones.
* **Settings → Content Packs**: show module badges per installed pack.
* **Topic selection screens**: If a module becomes unavailable after pack switch, gracefully redirect to Home and clear related queues/state.

#### 26.17.3 Database & Progress

* **DB**: Topics table already typed (`vocabulary`, `phrases`, `hundredSeconds`). Packs simply **omit** rows for missing modules.
* **Progress DB**: Partition by `packId`. Missing modules imply no progress rows; selectors must handle empty sets.

#### 26.17.4 Smart Next Logic

* Filter candidate activities by `modules[mod] === true` for the active pack.
* If no eligible tasks remain across available modules → show completion celebration and suggest reviewing mastered content or switching packs (selector mode only).

#### 26.17.5 UX Copy

* Selector: "This pack includes: • Phrases  • Vocabulary  • 100 Seconds" (dim unavailable items).
* Guard dialog: "This content isn’t part of **{displayName}**. Switch to a pack that includes it?"

#### 26.17.6 Acceptance Criteria (additions)

* In a `dsb-de` pack (phrases-only), Home and Navigation must not expose Vocabulary or Hundred Seconds.
* Smart Next never proposes unavailable modules.
* Search returns zero results for unavailable modules and does not crash.
* Switching from `hsb-de` (all modules) to `dsb-de` cleans up audio queues and UI without errors.

---

**End of handoff.**
