#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
#

export TC_DB_HOST=50.17.156.219
export TC_DB_PORT=2021
export TC_DB_USER=informix
export TC_DB_PASSWORD=1nf0rm1x
export TC_API_HOST=api.topcoder.com

. .profile

node ./node_modules/.bin/actionHero start