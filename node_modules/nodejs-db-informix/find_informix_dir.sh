#!/bin/sh

####
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Author: TCASSEMBLER
# Version: 1.0
#
# Try to find INFORMIXDIR in the order of list. Used for binding.gyp
####

if [ x != x${INFORMIXDIR} ]; then
    echo ${INFORMIXDIR}
    exit 0
fi

informixdir_list="../../thirdparty/ibm/informix /opt/IBM/informix /opt/informix"

for dir in $informixdir_list; do
    if [ -d ${dir} ] && [ -d ${dir}/incl ] && [ -d ${dir}/incl/dmi ] &&
        [ -d ${dir}/incl/esql ] && [ -d ${dir}/incl/c++ ]; then
        echo $(cd ${dir} && pwd)
        exit 0
    fi
done;
exit 1
