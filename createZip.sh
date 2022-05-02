#!/bin/bash

VERBOSE=false
CURRENT_BRANCH=$(git branch --show-current)
DATE=$(date +%Y-%m-%d_%Hh%M)


function show_help {
    echo Usage ./$0 [BRANCH_NAME]
    echo   Default BRANCH_NAME is $(git branch --show-current)
}

function printError() {
    echo;
    echo "Abort";
    if [ ! -z "$1" ]; then
        echo $1;
    fi
}


## Parse options

# A POSIX variable
OPTIND=1         # Reset in case getopts has been used previously in the shell.
 
while getopts "h?v" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    v) VERBOSE=true
        ;;
    esac
done

## Read arguments
shift $(($OPTIND - 1))
ARG_BRANCH=$1

BRANCH=${ARG_BRANCH:-${CURRENT_BRANCH}}

ZIP_FILE=gameModel_${BRANCH}_${DATE}.zip

$VERBOSE && echo "Create ZIP from branch '${BRANCH}'"

# make sure the given zip file does not exist
if [ -f "${ZIP_FILE}" ]; then
    printError "$ZIP_FILE already exists";
    exit 1;
fi

GIT_STATUS_SHORT=$(git status --short gameModel)

if [ ! -z "${GIT_STATUS_SHORT}" ]; then
    git status
    printError "Pending changes in repository ! Please commit or revert all changes";
    exit 1;
fi

if [ ! "${BRANCH}" == "${CURRENT_BRANCH}" ]; then
    if [ ${VERBOSE} ]; then
        git switch $BRANCH;
    else
        git switch -q $BRANCH;
    fi

    if [ $? -ne 0 ]; then
        printError "Branch ${BRANCH} does not exist";
        exit 1;
    fi
fi

$VERBOSE && echo Process

zip -qq -r $ZIP_FILE gameModel

if [ $? -ne 0 ]; then
    printError "Failed to create ZIP file";
    exit 1;
fi

echo "Done"
echo
echo "Zip file is ${ZIP_FILE}"

