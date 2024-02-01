#!/bin/bash

VERBOSE=false
CURRENT_BRANCH=$(git branch --show-current)

function show_help {
    echo Usage $0 ZIP_FILE [BRANCH_NAME]
    echo "  ZIP_FILE : path to exported gameModel"
    echo "  Default BRANCH_NAME is $(git branch --show-current)"
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
ZIP_FILE=$1
ARG_BRANCH=$2

BRANCH=${ARG_BRANCH:-${CURRENT_BRANCH}}

$VERBOSE && echo "Update ${BRANCH} from ${ZIP_FILE}"


# make sure the given zip file exists
if [ -z "${ZIP_FILE}" ]; then
    show_help;
    exit 1;
fi

# make sure the given zip file exists
if [ ! -f "${ZIP_FILE}" ]; then
    printError "$ZIP_FILE does not exist";
    exit 1;
fi

ZIP_INFO=$(zipinfo -1 ${ZIP_FILE} 2> /dev/null | grep -e "^/\?gameModel/")

if [ -z "${ZIP_INFO}" ]; then
    printError "${ZIP_FILE} is not a valid gameModel export";
    exit 1;
fi


GIT_STATUS_SHORT=$(git status --short gameModel)

if [ ! -z "${GIT_STATUS_SHORT}" ]; then
    git status
    printError "Pending changes in repository !";
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

TMP_DIR=$(mktemp -d ./gameModel.XXXXXX)

mv ./gameModel $TMP_DIR

unzip -qq $ZIP_FILE "gameModel/**"

if [ $? -ne 0 ]; then
    mv $TMP_DIR/gameModel .
    rmdir $TMP_DIR;
    printError "Unzip failed: restore previous gameModel";
    exit 1;
fi

rm -R $TMP_DIR;
echo "Done"
echo
echo "Please review changes"

