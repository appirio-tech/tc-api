#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: TCSASSEMBLER
#

# Deploy application in the CI server
./deploy/development.sh &
sleep 2

# Run Dredd against the CI server using our blueprint definition
./node_modules/dredd/bin/dredd dredd.md http://localhost:8080
exit $?
