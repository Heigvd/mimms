#!/bin/bash

CURRENT=$1; shift
NEW=$1; shift

OPT=$1; shift;


if [ -z "$CURRENT" ]; then
    echo please provide args
    exit -1;
fi


if [ -z "$NEW" ]; then
    echo please provide args
    exit -1;
fi


ESC_CURRENT=`echo $CURRENT | sed -e "s|/|\\\\\/|g"`
ESC_NEW=`echo $NEW | sed -e "s|/|\\\\\/|g"`


echo move $CURRENT to $NEW
echo Escaped: $ESC_CURRENT to $ESC_NEW

# OCCURENCES=`grep -o -P "import (.*?) from ('|\\\\\")\./${CURRENT}('|\\\\\")" -l * | xargs`

OCCURENCES=`grep -o -P "import (.*?) from ('|\\\\\\\\\")\\.\\/${ESC_CURRENT}('|\\\\\\\\\")" gameModel/pages/* -l | xargs`

if [ -z "$OCCURENCES" ]; then
    echo No occurence found
    exit -1;
fi

echo OCCURENCES: ${OCCURENCES}



perl -p${OPT} -e "s/import (.*?) from ('|\\\\\")\.\/${ESC_CURRENT}('|\\\\\")/import \1 from '.\/${ESC_NEW}'/" ${OCCURENCES} | grep ${ESC_NEW}

