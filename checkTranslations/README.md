# checkTranslations

Checks that `model` carries the same translations as `basic_scenario`.

## Why

Translations live in the `localization` folder of each `gamemodel.json`: one `ObjectDescriptor` per table (tagged
`localization`, e.g. `pretriage-interface`, `mainSim-actions-tasks`), one property per translation key, whose value
is a serialized `TranslatableContent` holding every language.

They get added and edited in `basic_scenario` in Wegas, and the README asks for every change to be reported to
`model` by hand. Nothing checks it was done, so the model ends up with missing or stale texts.

## What it checks

`model` against `basic_scenario`, `basic_scenario` being the source of truth, table by table (matched by name):

- **missing**: keys in `basic_scenario` but not in `model`
- **added**: keys in `model` but not in `basic_scenario`. Those still quoted somewhere in `_common/gameModel`
  (scripts and pages) are listed apart, as **used in code**: they most likely got lost from `basic_scenario`
- **different**: keys whose value differs, shown per language. A value whose texts are equal but whose
  `status` or `version` differ is reported as `(status or version only)`
- tables present in one scenario only

## How to run

```bash
yarn check-translations              # report only, exits 1 if anything is off
yarn check-translations --verbose    # list every entry instead of the first 10
yarn check-translations --fix        # copy the translations to model
```

## Fix mode

`--fix` rewrites the `properties` of every `model` table that differs:

- missing and different keys get the `basic_scenario` value, verbatim
- keys only in `model` are removed, **except those used in code**, which are kept. Add them back to
  `basic_scenario` in Wegas: the check keeps failing until you do
- tables in one scenario only are left alone: create or delete the variable in Wegas, check its visibility and
  update `types/VariablesTypes.d.ts`

Only the `properties` blocks being fixed are rewritten, the way Wegas writes them (keys sorted, `" : "`), the
rest of `gamemodel.json` stays byte for byte identical. Keys a hand edit left out of order in a fixed table get
sorted back, so they show up in the diff as moved. Always review the result with `git diff` before committing.

The "used in code" detection looks for the key as a quoted string anywhere in `_common/gameModel`, regardless of
the table it is read from. A generic key (e.g. `result`) may match an unrelated string and be kept for nothing:
it errs on the side of keeping.

## Output

Grouped by table, one line per language. Differences show the `model` text above the `basic_scenario` one. Without
`--verbose`, texts longer than 90 characters are cut and each section shows its first 10 keys. Colours are used in
a terminal only (set `NO_COLOR` to turn them off).

```
🔍 Comparing the translations of model with basic_scenario (source of truth)

❌ pretriage-interface   23 missing, 1 only in model, 2 different

   ➕ Missing in model, added by --fix
      alert
         EN  alert
         FR  alerte
      ... and 22 more (use --verbose)

   ➖ Only in model, removed by --fix
      explanation-title
         EN  explanations
         FR  explications

   ✏️  Different, model's text replaced by basic_scenario's with --fix
      result
         EN  model           result
             basic_scenario  results
         FR  model           résultat
             basic_scenario  résultats

❌ mainSim-actions-tasks   1 only in model but used in code

   ⚠️  Only in model but used in code, kept by --fix: add it back to basic_scenario in Wegas
      appoint-hierarchy-not-respected
         EN  the order was carried out, but the chain of command was not respected
         FR  l'ordre a été exécuté, mais la voie hiérarchique n'a pas été respectée

✅ 15 other tables all the same in both

Summary: 23 missing in model, 1 only in model, 2 only in model but used in code, 3 different
```
