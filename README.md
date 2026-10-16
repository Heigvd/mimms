# MIMMS Repository

## Structure
- `_common` folder which contains all the common elements to all scenarios and models
- `basic_scenario` that is a standalone scenario. Use it for development
- `model` an empty model with appropriate (INHERITED & PROTECTED) rights on variables

### _common contents
- Server and client scripts
- CSS
- Themes settings
- Pages

### basic_scenario content
- a gameModel.json that has basic playable content, all variables are set to PRIVATE right to simplify development
- content files (mainly icons and maps data)
- filesmeta.json: a descriptor for each file

### model content
- gameModel.json: empty model variables with appropriate visibility rights
- content files (mainly icons and maps data)
- filesmeta.json: a descriptor for each file

## Patching and updating

### Updating from Wegas to the repository

Before you apply the export, make sure to check out the commit you started from to create or update the game model in Wegas. If you import onto a newer commit, the export can silently overwrite changes made in the repository since then.

Download the zip from Wegas (Gamemodel settings -> "export" tab -> export ZIP).
Then, run `./updateFromZip.sh <EXPORT.zip> [target]`.

`target` is the folder you want to update, namely, `model` or `basic_scenario`

### Updating a basic_scenario in Wegas

1. Run `./createZip.sh` (defaults to basic_scenario)
1. in Wegas, patch a scenario (Gamemodel settings -> "export" tab -> update from ZIP).

### Updating a Model

1. Run `./createZip.sh model`
1. (if creating a new model, go to admin -> create empty react model)
1. Patch the model (Gamemodel settings -> "export" tab -> update from ZIP)
1. If patching a model that has linked scenarios, open the model and click "Propagate" at the top left

### Linking model to basic_scenario

1. Create your model following the steps above (Updating a Model)
2. Run `./createZip.sh -p` to package `basic_scenario` with variable visibilities matching the model
3. in Wegas, create a new scenario derived from the model created at step 1

## Verification scripts
A few helper tools to verify the integrity of the scenarios.
When running `updateFromZip`, all checks run automatically. You can also run them manually.

### yarn build
Runs a `tsc` build

### yarn check-page-scripts
Checks that imports in page scripts have a match in the client scripts. It does not type check the parameters of function calls.

See [checkImports/README.md](checkImports/README.md)

### yarn check-libraries
Checks that the library files on disk in `_common/gameModel/libs/` match the `libraries` descriptors
declared in every `<scenario>/gameModel/gamemodel.json`.

Can be run with `--fix` to fix both `model` and `basic_scenario`

See [checkLibraries/README.md](checkLibraries/README.md)

## Patch scripts
Tools to keep basic_scenario and model coherent, in terms of refs and visibility

### Patch refIds
Used to overwrite the refIds of basic_scenario with the respective refIds of the model. Use if refIds have diverged.

See [patchRefId/README.md](patchRefId/README.md)

### Patch visibility
**Use only through `./createZip.sh -p`**: this applies the model's visibility of each variable to the `basic_scenario`

See [patchVisibility/README.md](patchVisibility/README.md)

See [Linking model to basic_scenario](#linking-model-to-basic_scenario)
