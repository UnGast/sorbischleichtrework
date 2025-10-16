# Sorbisch leicht Database Strategy

## Overview

- **Content packs** ship as prebuilt, read-only SQLite snapshots (`content.db`). Each pack version includes the full schema + data needed for that pack. Updates deliver an entirely new snapshot; the app activates the latest verified file and deletes the old one after a successful switch.
- **Progress data** lives in a separate, writable SQLite database (`progress.db`). It persists per-user state (attempts, correctness, activity log, topic completion) and is keyed by `packId` so progress stays scoped to the currently active pack.

## Content Pack Snapshot Flow

- Build pipeline emits `packs/<packId>/<version>/content.db`, `manifest.json`, and media assets.
- At runtime, downloading an update keeps both old and new `content.db` files until the new snapshot is verified, then drops the old one.
- No delta migrations run on-device; the snapshot already reflects the target schema/content (simplifies verification and rollback).

## Progress Database

- `progress.db` schema mirrors the handoff plan (`progress`, `actions`, etc.) and adds a `pack_id` column where needed.
- Stored under app data (e.g., `FileSystem.documentDirectory/progress/progress.db`). Shared across pack switches, but rows are filtered by active `packId`.
- Migrated separately from content packs so user data survives pack updates or rollbacks.

## Rationale

- Separating read-only content from mutable progress prevents accidental data loss during pack swaps and keeps migrations independent.
- Versioned snapshots make integrity checks (hash/signature) and rollbacks trivial.
- `progress.db` enables cross-pack analytics (e.g., time spent) while avoiding schema clashes with pack-specific tables.

## Next Steps

- Implement `progress.db` initialization + migrations alongside a persistence layer in the app.
- Update content-pack activation to copy/verify `content.db` snapshots and clean up superseded versions.

