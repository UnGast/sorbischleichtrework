# Content Pack Format

Documented for database-backed packs built by `scripts/build-mock-pack.ts` and `scripts/convert-legacy-content.ts`.

## Directory Layout

```
<packRoot>/
  pack.json
  content.db
  audio/*
  images/*
  icons/*
  hundred/*
  resources/* (optional)
```

Bundled packs are zipped with the pack root as the top-level directory (see `zipDirectory`). Dev builds can mirror the directory into `content/dev/<packId>`.

## Manifest (`pack.json`)

```
{
  "packId": "legacy-pack",
  "displayName": "Legacy Pack",
  "contentVersion": "1.0.0",
  "modules": {
    "vocabulary": true,
    "phrases": true,
    "hundredSeconds": true
  },
  "contentFile": "content.db"
}
```

Modules informs the app which learning flows are available for this pack.

## SQLite Schema (`content.db`)

### topics
- `id TEXT PRIMARY KEY`
- `type TEXT` (`'vocabulary' | 'phrases' | 'hundredSeconds'`)
- `name_german TEXT`
- `name_sorbian TEXT`
- `icon TEXT NULL` (relative path such as `icons/lektion1.png`)
- `audio_intro_sorbian TEXT NULL` (relative asset path)
- `ord INTEGER`

### vocabulary
- `id TEXT PRIMARY KEY`
- `topic_id TEXT REFERENCES topics(id)`
- `de TEXT`
- `sb TEXT`
- `img TEXT NULL` (relative asset path)
- `audio TEXT NULL`
- `ignore_assign INTEGER`
- `ignore_write INTEGER`

### phrases
- `id TEXT PRIMARY KEY`
- `topic_id TEXT REFERENCES topics(id)`
- `de TEXT`
- `sb TEXT`
- `audio_de TEXT NULL`
- `audio_sb TEXT NULL`
- `item_type TEXT` (e.g., `normal`, `separator`)
- `info_text TEXT NULL`

### hundred_seconds
- `id TEXT PRIMARY KEY`
- `name TEXT`
- `audio TEXT`
- `image TEXT NULL`

### assets
- `logical_name TEXT PRIMARY KEY` (original legacy identifier)
- `relative_path TEXT NOT NULL` (path relative to pack root)
- `bytes INTEGER`

All foreign keys are enabled (`PRAGMA foreign_keys=ON`). After insertion the converter runs `