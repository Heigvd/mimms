# MIMMS Overview
Major Incident Medical Management System serious game for Wegas React


# Structure
- `_common` folder, which contains all the elements common to all scenarios and models
- `basic_scenario`, which is a standalone scenario. Use it for development
- `model`: an empty model with appropriate (INHERITED & PROTECTED) rights on variables

## _common contents
- Server and client scripts
- CSS
- Themes settings
- Pages

## basic_scenario content
- a gameModel.json that has basic playable content; all variables are set to PRIVATE rights to simplify development
- content files (mainly icons and maps data)
- filesmeta.json: a descriptor for each file

## model content
- gameModel.json: empty model variables with appropriate visibility rights
- content files (mainly icons and maps data)
- filesmeta.json: a descriptor for each file

# Workflow
## Development
Use the `basic_scenario` for development. Most development will take place in the `_common` directory, except Wegas variables and media files, which will modify the `basic_scenario` when updating from Wegas.

## PR
When done, report the relevant changes done in `basic_scenario` to the model folder

### Wegas variables updates
New variable declarations should be reported to the model.Check their visibility value and their default content.

Deleted variables should also be deleted from the model.

In both deletion and creation cases update the `types/VariablesTypes.d.ts`, which is used for compilation.

Report the changes in the translations or other relevant variables.

### Files
New and deleted files must be reflected in the model, including their file metadata, and their required visibility must be evaluated.

## Releases
Releases should be done from the `dev` or `main` branch.
Double check that the model works fine by doing a full deployment on `wegas-dev`.

- Tag the commit `git tag vX.Y.Z -m "short comment"`
- Create an empty model and patch it, name it after the version `vX.Y.Z`
- Link it to a `basic_scenario`
- Do some player and scenarist testing

If everything goes well, and the release is validated for production.
- confirm with the team and clients that the new release can be patched on existing scenarios
- patch the model on prod and propagate
- test a little more :)

## Patching and updating

### Updating from Wegas to the repository

Before you apply the export, make sure to check out the commit you started from to create or update the game model/scenario in Wegas. If you apply the export onto a newer commit, it can silently overwrite changes made in the repository since then.

Download the zip from Wegas (Gamemodel settings -> "export" tab -> export ZIP).
Then, run `./updateFromZip.sh <EXPORT.zip> [target]`.

`target` is the folder you want to update: either `model` or `basic_scenario`. It defaults to `basic_scenario`.

### Patch a scenario in Wegas

Use when developing and testing features

1. Run `./createZip.sh` (defaults to `basic_scenario`)
1. In Wegas, patch a scenario (Gamemodel settings -> "export" tab -> update from ZIP).

### Patch a Model in Wegas

Use when testing the model

1. Run `./createZip.sh model`
1. (If creating a new model, go to admin -> create an empty React model)
1. Patch the model (Gamemodel settings -> "export" tab -> update from ZIP)
1. If patching a model that has linked scenarios, open the model and click "Propagate" at the top left

Note: you cannot duplicate an existing model and patch it (newly generated refIds will conflict). You can either start from an empty model, or patch an existing (non-duplicated) one.

### Linking a model to basic_scenario

Use when doing a full test model + scenario

1. Create your model following the steps above (Patch a Model in Wegas)
2. Run `./createZip.sh -p` to package `basic_scenario` with variable visibilities matching the model
3. In Wegas, create a new scenario derived from your model

In the last step you should not see any variable visibility change. If you do, something is wrong.

## Verification scripts
A few helper tools to verify the integrity of the scenarios.
When running `updateFromZip`, all checks run automatically. You can also run them manually.

### yarn build
Runs a `tsc` build

### yarn check-page-scripts
Checks that imports in page scripts have a match in the client scripts. This does not type check the parameters of function calls.

See [checkImports/README.md](checkImports/README.md)

### yarn check-libraries
Checks that the library files on disk in `_common/gameModel/libs/` match the `libraries` descriptors
declared in every `<scenario>/gameModel/gameModel.json`.

Can be run with `--fix` to fix both `model` and `basic_scenario`

See [checkLibraries/README.md](checkLibraries/README.md)

## Patch scripts
Tools to keep basic_scenario and model coherent, in terms of refs and visibility

### Patch refIds
Used to overwrite the refIds of basic_scenario with the respective refIds of the model. Use it if refIds have diverged.

See [patchRefId/README.md](patchRefId/README.md)

### Patch visibility
**Use only through `./createZip.sh -p`**: this applies the model's visibility of each variable to the `basic_scenario` when building a zip

See [patchVisibility/README.md](patchVisibility/README.md)

See [Linking a model to basic_scenario](#linking-a-model-to-basic_scenario)
