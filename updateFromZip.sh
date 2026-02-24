#!/bin/bash

VERBOSE=false
SKIP_GIT_STATUS_RESTRICTION=false
DEFAULT_SCENARIO=basic_scenario
COMMON_FOLDER=_common

function show_help {
    echo Usage "$0" ZIP_FILE "[SCENARIO_NAME]"
    echo "  ZIP_FILE : path to zipped gameModel"
    echo "  SCENARIO_NAME : name of the folder containing the scenario to patch (default is $DEFAULT_SCENARIO)"
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
while getopts "h?vF" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    v) VERBOSE=true
        ;;
    F) SKIP_GIT_STATUS_RESTRICTION=true
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

$VERBOSE && echo "Save gameModel data to temporary folders"

TMP_DIR_COMMON=$(mktemp -d ./$COMMON_FOLDER/gameModel.XXXXXX)
TMP_DIR_SCENARIO_SPECIFIC=$(mktemp -d ./$SCENARIO_NAME/gameModel.XXXXXX)

mv ./$COMMON_FOLDER/gameModel "$TMP_DIR_COMMON"
mv ./$SCENARIO_NAME/gameModel "$TMP_DIR_SCENARIO_SPECIFIC"

$VERBOSE && echo "unzip $ZIP_FILE"
(cd $SCENARIO_NAME ||exit
if unzip -qq "$ZIP_FILE" "gameModel/**"
then
    (cd gameModel || exit
        $VERBOSE && echo "Move data libs + pages to $COMMON_FOLDER/gameModel"
        mkdir -p ../../$COMMON_FOLDER/gameModel/libs
        mv ./libs ../../$COMMON_FOLDER/gameModel
#        ln -s ../../$COMMON_FOLDER/gameModel/libs libs
        mkdir -p ../../$COMMON_FOLDER/gameModel/pages
        mv ./pages ../../$COMMON_FOLDER/gameModel
#        ln -s ../../$COMMON_FOLDER/gameModel/pages pages
    )
else
    mv "$TMP_DIR_COMMON"/gameModel .
    mv "$TMP_DIR_SCENARIO_SPECIFIC"/gameModel .
    rmdir "$TMP_DIR_COMMON";
    rmdir "$TMP_DIR_SCENARIO_SPECIFIC";
    printError "Unzip failed: restore previous gameModel";
    exit 1;
fi
)

rm -R "$TMP_DIR_COMMON";
rm -R "$TMP_DIR_SCENARIO_SPECIFIC";

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
echo "Done"
echo "Please review changes"
