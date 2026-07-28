# checkLibraries

Checks that the library files on disk in `_common/gameModel/libs/` match the `libraries` descriptors
declared in every `<scenario>/gameModel/gamemodel.json`.

## Why

A Wegas game model is split in two in this repo: the script and style bodies live on disk under
`_common/gameModel/libs/` (a single shared copy), while each scenario keeps a list of descriptors in its own
`gamemodel.json`. Those descriptors always have `"content": ""` — `createZip.sh` puts descriptor and file back
together when building the archive.

Nothing keeps the two sides in sync. `updateFromZip.sh` moves `libs/` up into `_common/` without ever looking at
`libraries`, so adding, renaming or deleting a file leaves the descriptors stale. The damage only shows up after
an import into Wegas:

- a file with **no descriptor** is silently dropped
- a descriptor with **no file** is imported as an empty library

## What it checks

For every `<scenario>/gameModel/gamemodel.json`, using the mapping
`libs/<libraryType>/<contentKey><ext>` ⟷ `{ libraryType, contentKey }`:

| library type     | folder              | extension |
| ---------------- | ------------------- | --------- |
| `ClientScript`   | `ClientScript/`     | `.ts`     |
| `ServerScript`   | `ServerScript/`     | `.js`     |
| `CSS`            | `CSS/`              | `.css`    |
| `Theme`          | `Theme/`            | `.json`   |
| `SelectedThemes` | `SelectedThemes/`   | `.json`   |

1. **Missing descriptors** — a file on disk that no descriptor points at
2. **Orphan descriptors** — a descriptor whose file no longer exists
3. **Duplicates** — two descriptors sharing the same `libraryType` + `contentKey`
4. **Inlined content** — `content` must stay `""`, otherwise the embedded copy shadows the file on disk
5. **Sort order** — the array must be sorted by `libraryType` then `contentKey`, both case insensitive, the way
   Wegas writes it, so diffs stay small
6. **Unknown library types**, and files whose extension does not match their folder (Wegas ignores those)

A missing descriptor and an orphan descriptor that share a file name are reported as a **move**.

## How to run

```bash
yarn check-libraries              # report only, exits 1 if anything is off
yarn check-libraries --verbose    # list every entry instead of the first 10
yarn check-libraries --fix        # update the descriptors to match the disk
```

## Fix mode

`--fix` treats the files on disk as the source of truth and rewrites the `libraries` array:

- existing descriptors are kept untouched, `refId` and `visibility` included
- a **move** keeps the original `refId` and `visibility`, so Wegas does not lose the entity identity
- a **new** descriptor gets `content: ""`, `version: null`, the `contentType` for its library type, a `visibility`
  copied from the most common one for that library type in that same file, and a generated
  `GameModelContent:#<n>:<suffix>` refId (the same not-yet-persisted form Wegas writes itself). The suffix is
  derived from the content key, so re-running `--fix`, or two people fixing the same file, produce the same result
- orphan descriptors are removed

Only the `libraries` block is rewritten, as text. The rest of the file is left byte for byte identical, which
matters because these exports are not always strictly valid JSON — `model` carries a
trailing comma that a full re-serialize would silently "fix", producing a 7500 line diff.

Always review the result with `git diff` before committing.

## Output

```
🔍 Checking gameModel libraries against _common/gameModel/libs/...

Files on disk: ClientScript 237, ServerScript 7, CSS 53, Theme 2, SelectedThemes 1
Game models: basic_scenario, model

✅ basic_scenario: 300 descriptors, all consistent
❌ model: 1 file(s) without descriptor
   on disk but no descriptor:
     ClientScript/game/common/actions/resourceActions

📊 Summary:
   Game models checked: 3
   Game models with problems: 1
```
