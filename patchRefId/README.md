# patchRefId

Checks that every `refId` in `basic_scenario/gameModel/gamemodel.json`
matches the equivalent object in `model/gameModel/gamemodel.json`, and can
patch the ones that don't.

`refId` is meant to be a stable cross-reference, but when a variable (or
library, language, enum item, ...) is added independently to `model/` and to
`basic_scenario/` instead of being created once and copied over, Wegas
assigns it a different `refId` in each export even though it's logically the
same object. This drifts the two files apart and breaks anything that
expects a shared `refId` to mean "the same thing" in both.

## How it matches objects

Same approach as [`patchVisibility`](../patchVisibility/README.md): `refId`
itself can't be used to find the equivalent object (that's the whole
problem), so objects are identified by `@class` plus whichever of `name`
(variable descriptors, enum items), `contentKey` (libraries) or `code`
(languages) they carry.

Most `refId`-bearing objects - instances, translatable contents,
translations, properties - have none of those fields. They're matched
positionally instead, as children of an already-identified ancestor (e.g. a
descriptor's `defaultInstance` or `label`), which is also how `translations`
(a `{lang: Translation}` map) falls out for free. An object with no stable
identity of its own and no identified ancestor is left untouched; run with
`--verbose` to list these.

## How to run

```bash
# Verify only - lists mismatches, exits 1 if any are found, 0 otherwise.
node patchRefId/patchRefId.js [--verbose]

# Patch basic_scenario/gameModel/gamemodel.json in place.
node patchRefId/patchRefId.js --fix
```

`--fix` rewrites only the exact `"refId" : "<value>"` occurrences that
changed, leaving the rest of the file byte-for-byte untouched - this keeps
the diff limited to the actual `refId` changes instead of reformatting the
whole file.
