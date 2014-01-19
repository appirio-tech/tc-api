#!/bin/bash
####
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Author: EasyHard, pvmagacho
# Version: 1.1
#
# This file is for heroku app's enviroment setup.
#
# Changes in 1.1 : added JDBC connection pool environment variables
#
####

. ./deploy/development.sh 

## JDBC connection pool environment variables - set for all databases
export MINPOOL=1
export MAXPOOL=10
export MAXSIZE=15
export IDLETIMEOUT=3600
export TIMEOUT=6000

node ./node_modules/.bin/actionHero start
