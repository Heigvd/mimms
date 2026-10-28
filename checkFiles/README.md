# checkFiles

Checks that every `<scenario>/gameModel/filesmeta.json` matches its `files/` folder, and that `model` carries the
same files and metadata as `basic_scenario`.

## Why

Media files (maps, icons, images) live in each scenario's `gameModel/files/`, and each of them needs an entry in
`filesmeta.json`. `basic_scenario` is where they get added and changed in Wegas, and the README asks for every change
to be reported to `model` by hand. Nothing checks it was done, so the two drift apart:

- a file deleted from `files/` but left in `filesmeta.json` (or the reverse)
- a file added, removed or edited in `basic_scenario` but not in `model`
- metadata (e.g. `mimeType`) edited in one scenario only

## What it checks

1. **Each scenario against its own `files/`**
   - entries in `filesmeta.json` with no file or folder on disk
   - files or folders on disk with no entry
   - `mimeType` must be `application/wfs-directory` for a folder (key ending with `/`), and only for a folder
2. **`model` against `basic_scenario`**, `basic_scenario` being the source of truth
   - entries in one `filesmeta.json` only
   - entries whose fields differ, **`visibility` excepted**: `basic_scenario` is all `PRIVATE` while `model` holds
     the real rights
   - files or folders in one `files/` only
   - files whose content differs

`.DS_Store` files are ignored.

## How to run

```bash
yarn check-files              # report only, exits 1 if anything is off
yarn check-files --verbose    # list every entry instead of the first 10
yarn check-files --fix        # update files and metadata
```

## Fix mode

`--fix` works in two steps.

**1. Each scenario but `model` is made consistent with its own `files/`.** The disk is the source of truth:

- entries with no file are removed
- a file with no entry gets one, with the `mimeType` most used for that extension across all `filesmeta.json`
  (Wegas sets it from the content, e.g. `.geojson` are zipped so `application/zip`), and the `visibility` most used
  by its siblings. A file whose extension appears nowhere else is left to you
- a wrong folder/file `mimeType` is corrected the same way

**2. `model` is made a copy of `basic_scenario`:**

- files missing or different in `model` are copied from `basic_scenario`, extra ones are deleted
- `filesmeta.json` gets `basic_scenario`'s entries and fields, but keeps `model`'s own `visibility`
- a new entry gets the `visibility` most used by its siblings in `model` (`INHERITED` when it has none). These
  are listed at the end: **review them**, the README asks for the visibility of every new file to be evaluated

`filesmeta.json` is written the way Wegas writes it (two space indent, `" : "`, sorted keys, no final newline), so
unchanged entries stay byte for byte identical. Always review the result with `git status` and `git diff` before
committing, new files in `model` are untracked.

## Output

```
🔍 Checking filesmeta.json against gameModel/files/...

Game models: basic_scenario, model
Source of truth: basic_scenario, mirrored by model

✅ basic_scenario: 89 meta entries, all match files/
❌ model: 5 meta entry(ies) without file
   in filesmeta.json but not in files/:
     /patient/scales/
     ...
❌ model vs basic_scenario: 2 meta entry(ies) only in model, 10 meta field difference(s), ...
   meta differences (model -> basic_scenario, visibility ignored):
     /maps/CERN-meyrin/buildings.geojson   mimeType: "application/geo+json" -> "application/zip"
     ...
   files with different content:
     /maps/GVA/bbox.data
     ...
```
