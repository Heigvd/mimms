#!/bin/bash

VERBOSE=false
DESTINATION_FOLDER=".."
DEFAULT_SCENARIO=basic_scenario
COMMON_FOLDER=_common

function show_help {
    echo Usage "$0" [-hv] SCENARIO_NAME
    echo "SCENARIO_NAME : name of the folder to create zip from, scenario or model"
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
while getopts "h?v" opt; do
    case "$opt" in
    v) VERBOSE=true
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

NAME=gameModel_${SCENARIO_NAME}_$(date +%Y-%m-%d_%Hh%M)

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
