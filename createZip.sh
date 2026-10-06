#!/bin/bash

VERBOSE=false
PATCH_VISIBILITY=false
DESTINATION_FOLDER=".."
DEFAULT_SCENARIO=basic_scenario
COMMON_FOLDER=_common
MODEL_FOLDER=model

# the branch name ends up in a file name, slashes would turn it into a path
CURRENT_BRANCH=$(git branch --show-current | tr '/' '-')

function show_help {
    echo Usage "$0" [-hvp] SCENARIO_NAME
    echo "SCENARIO_NAME : name of the folder to create zip from, scenario or model"
    echo "  -p : patch the visibility of every object in gamemodel.json and every entry"
    echo "       in filesmeta.json to match the visibility of the equivalent object in"
    echo "       $MODEL_FOLDER/gameModel/gamemodel.json and $MODEL_FOLDER/gameModel/filesmeta.json"
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
while getopts "h?vp" opt; do
    case "$opt" in
    v) VERBOSE=true
        ;;
    p) PATCH_VISIBILITY=true
        ;;
    h|\?)
        show_help
        exit 0
        ;;
    esac
done

## Read arguments
shift $((OPTIND - 1))
SCENARIO_NAME=$1

# check no git pending changes
#if ! $SKIP_GIT_STATUS_RESTRICTION
#then
#    GIT_STATUS_SHORT_COMMON=$(git status --short $COMMON_FOLDER/gameModel)
#    if [ ! -z "${GIT_STATUS_SHORT_COMMON}" ]; then
#        git status $COMMON_FOLDER/gameModel
#        printError "Pending changes in $COMMON_FOLDER/gameModel repository !";
#        exit 1;
#    fi
#
#    GIT_STATUS_SHORT_SCENARIO=$(git status --short $SCENARIO_NAME/gameModel)
#    if [ ! -z "${GIT_STATUS_SHORT_SCENARIO}" ]; then
#        git status $SCENARIO_NAME/gameModel
#        printError "Pending changes in $SCENARIO_NAME/gameModel repository !";
#        exit 1;
#    fi
#fi

if [ -z "$SCENARIO_NAME" ]; then
    SCENARIO_NAME="$DEFAULT_SCENARIO"
fi

if [ ! -d "$SCENARIO_NAME" ]; then
    printError "$SCENARIO_NAME is not a known scenario folder";
    exit 1;
fi

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PATCH_VISIBILITY_SCRIPT="${SCRIPT_DIR}/patchVisibility/patchVisibility.js"

if $PATCH_VISIBILITY; then
    if ! command -v node >/dev/null 2>&1; then
        printError "-p requires node, which was not found in PATH";
        exit 1;
    fi
    if [ ! -f "${MODEL_FOLDER}/gameModel/gamemodel.json" ]; then
        printError "-p requires ${MODEL_FOLDER}/gameModel/gamemodel.json, which does not exist";
        exit 1;
    fi
fi

if [ "$SCENARIO_NAME" = "$DEFAULT_SCENARIO" ]; then
    NAME=gameModel_${CURRENT_BRANCH}_$(date +%Y-%m-%d_%Hh%M)
else
    NAME=${SCENARIO_NAME}_gameModel_${CURRENT_BRANCH}_$(date +%Y-%m-%d_%Hh%M)
fi

# make sure the given folder does not exist
if [ -d "${NAME}" ]; then
    printError "$NAME already exists";
    exit 1;
fi
if [ -f "${NAME}.zip" ]; then
    echo "${NAME}.zip will be replaced"
fi

$VERBOSE && echo "Create $NAME folder"
mkdir -p "${NAME}"/gameModel

$VERBOSE && echo "Copy data"
cp -r "${SCENARIO_NAME}"/gameModel/* "${NAME}"/gameModel
cp -r "${COMMON_FOLDER}"/gameModel/* "${NAME}"/gameModel

if $PATCH_VISIBILITY; then
    $VERBOSE && echo "Patch visibility from ${MODEL_FOLDER}/gameModel"
    NODE_ARGS=("${NAME}/gameModel")
    $VERBOSE && NODE_ARGS+=("--verbose")
    node "$PATCH_VISIBILITY_SCRIPT" "${NODE_ARGS[@]}" || exit 1
fi

$VERBOSE && echo "Create zip"
(cd "${NAME}" || exit
zip -q -r "${NAME}".zip gameModel -x '*.DS_Store'
mv "${NAME}".zip "${DESTINATION_FOLDER}"
)

$VERBOSE && echo "Clean temporary folder"
rm -R "${NAME}"

echo "Done"
echo
echo "Zip file is ${NAME}.zip"
