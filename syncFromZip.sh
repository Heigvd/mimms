#!/bin/bash

# Same job as updateFromZip.sh, but updates the gameModel files in place.
#
# updateFromZip.sh moves the whole gameModel folders away and recreates them from
# the zip, so every file gets a new inode on every run, even the ones whose content
# did not change. Editors that track open buffers by inode (Zed) lose their
# reference to every open tab.
#
# Here the zip is extracted to a scratch folder outside of the repository and
# rsync'ed over the working tree: only the files whose content really changed are
# written, and they keep their inode.

VERBOSE=false
SKIP_GIT_STATUS_RESTRICTION=false
DEFAULT_SCENARIO=basic_scenario
COMMON_FOLDER=_common
FLAG_LATEST=false

function show_help {
    echo Usage "$0" ZIP_FILE "[SCENARIO_NAME]"
    echo "  ZIP_FILE : path to zipped gameModel"
    echo "  SCENARIO_NAME : name of the folder containing the scenario to patch (default is $DEFAULT_SCENARIO)"
    echo "  -l : rename the used zip to 'latest_<name>.zip' after a successful update"
}

function printError() {
    echo;
    echo "Abort";
    if [ -n "$1" ]; then
        echo "$1";
    fi
}

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.

## Parse options
while getopts "h?vFl" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    v) VERBOSE=true
        ;;
    F) SKIP_GIT_STATUS_RESTRICTION=true
        ;;
    l) FLAG_LATEST=true
        ;;
    esac
done

## Read arguments
shift $((OPTIND - 1))
ZIP_FILE=$1
SCENARIO_NAME=$2

if [ -z "$SCENARIO_NAME" ]; then
    SCENARIO_NAME="$DEFAULT_SCENARIO"
fi

# make sure the zip is filled
if [ -z "${ZIP_FILE}" ]; then
    show_help;
    exit 1;
fi

# make sure the given zip file exists
if [ ! -f "${ZIP_FILE}" ]; then
    printError "$ZIP_FILE does not exist";
    exit 1;
fi

# work with an absolute path, the zip is read from an other working directory
ZIP_FILE="$(cd "$(dirname "$ZIP_FILE")" && pwd)/$(basename "$ZIP_FILE")"

# make sure the given zip contains a gameModel folder
ZIP_INFO=$(zipinfo -1 "${ZIP_FILE}" 2> /dev/null | grep -e "^/\?gameModel/")
if [ -z "${ZIP_INFO}" ]; then
    printError "${ZIP_FILE} is not a valid gameModel export";
    exit 1;
fi

# check no git pending changes
if ! $SKIP_GIT_STATUS_RESTRICTION
then
    GIT_STATUS_SHORT_COMMON=$(git status --short $COMMON_FOLDER/gameModel)
    if [ -n "${GIT_STATUS_SHORT_COMMON}" ]; then
        git status $COMMON_FOLDER/gameModel
        printError "Pending changes in $COMMON_FOLDER/gameModel repository !";
        exit 1;
    fi

    GIT_STATUS_SHORT_SCENARIO=$(git status --short $SCENARIO_NAME/gameModel)
    if [ -n "${GIT_STATUS_SHORT_SCENARIO}" ]; then
        git status $SCENARIO_NAME/gameModel
        printError "Pending changes in $SCENARIO_NAME/gameModel repository !";
        exit 1;
    fi
fi

echo "Update $SCENARIO_NAME from ${ZIP_FILE}"

# Extract outside of the repository, so that the working tree is only touched
# once we know the archive is usable.
TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/gameModel.XXXXXX")
if [ ! -d "$TMP_DIR" ]; then
    printError "Could not create a temporary folder";
    exit 1;
fi
trap '[ -d "$TMP_DIR" ] && rm -rf -- "$TMP_DIR"' EXIT

$VERBOSE && echo "unzip $ZIP_FILE to $TMP_DIR"
if ! unzip -qq "$ZIP_FILE" "gameModel/**" -d "$TMP_DIR"; then
    printError "Unzip failed: working tree left untouched";
    exit 1;
fi

for REQUIRED in libs pages; do
    if [ ! -d "$TMP_DIR/gameModel/$REQUIRED" ]; then
        printError "$ZIP_FILE contains no gameModel/$REQUIRED: working tree left untouched";
        exit 1;
    fi
done

#  -c          compare by checksum, not by timestamp (zip mtimes always differ)
#  --inplace   write into the existing file rather than to a temp file + rename
#  --delete    drop the files that are gone from the export
RSYNC_OPTS=(-rlc --inplace --delete)

function syncGameModel() {
    local SRC=$1
    local DST=$2
    shift 2
    mkdir -p "$DST"
    if $VERBOSE; then
        # --itemize-changes also lists the untouched files (their timestamp always
        # differs from the zip one), only report the ones really written
        rsync "${RSYNC_OPTS[@]}" --itemize-changes "$@" "$SRC/" "$DST/" | grep -v '^\.'
        return "${PIPESTATUS[0]}"
    fi
    rsync "${RSYNC_OPTS[@]}" "$@" "$SRC/" "$DST/"
}

SYNC_STATUS=0

$VERBOSE && echo "Update libs + pages in $COMMON_FOLDER/gameModel"
syncGameModel "$TMP_DIR/gameModel/libs" "./$COMMON_FOLDER/gameModel/libs" || SYNC_STATUS=1
syncGameModel "$TMP_DIR/gameModel/pages" "./$COMMON_FOLDER/gameModel/pages" || SYNC_STATUS=1

$VERBOSE && echo "Update $SCENARIO_NAME/gameModel"
syncGameModel "$TMP_DIR/gameModel" "./$SCENARIO_NAME/gameModel" --exclude=/libs --exclude=/pages || SYNC_STATUS=1

if [ "$SYNC_STATUS" -ne 0 ]; then
    printError "Update failed, the working tree may be partially updated.
Restore it with: git checkout -- $COMMON_FOLDER/gameModel $SCENARIO_NAME/gameModel";
    exit 1;
fi

# Flags the zip file used as "latest_*"
if $FLAG_LATEST; then
    ZIP_DIR=$(cd "$(dirname "$ZIP_FILE")" && pwd)
    STEM=$(basename "$ZIP_FILE" .zip)
    STEM=${STEM#latest_}
    LATEST="$ZIP_DIR/latest_${STEM}.zip"

    if [ "$ZIP_DIR/$(basename "$ZIP_FILE")" != "$LATEST" ]; then
        [ -e "$LATEST" ] && rm -f "$LATEST"
        mv "$ZIP_FILE" "$LATEST"
        echo "Flagged $(basename "$ZIP_FILE") as $(basename "$LATEST")"
    fi
fi

echo
echo "Prettier formatting"
yarn format --loglevel warn

echo
echo "Compiling TypeScript"
yarn build

if [ $? -gt 0 ]; then
    echo
    echo "Compilation error(s), please fix";
    echo
fi

echo
echo "Checking page script imports"
yarn check-page-scripts

if [ $? -gt 0 ]; then
    echo
    echo "Compilation error(s), please fix";
    echo
fi

echo
echo "Checking library descriptors"
yarn check-libraries

if [ $? -gt 0 ]; then
    echo
    echo "Descriptor mismatch(es), run 'yarn check-libraries --fix'";
    echo
fi

echo
echo "Done"
echo "Please review changes"
