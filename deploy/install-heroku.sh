#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: TCSASSEMBLER
#

HEROKU_CLIENT_URL="https://s3.amazonaws.com/assets.heroku.com/heroku-client/heroku-client.tgz"
rm -rf heroku
mkdir -p heroku
cd heroku
curl -s $HEROKU_CLIENT_URL | tar xz
mv heroku-client/* .
rmdir heroku-client