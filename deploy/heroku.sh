#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
#

GIT_CLEAN='n'
GIT_COMMIT='n'
HEROKU_CREATE='n'
HEROKU_PUSH='n'
HEROKU_LAUNCH='n'
HEROKU_CONFIG='n'

for var in "$@"
do
    if [ "$var" == "clean" ]; then GIT_CLEAN="y"; fi
    if [ "$var" == "commit" ]; then GIT_COMMIT="y"; fi
    if [ "$var" == "create" ]; then HEROKU_CREATE="y"; fi
    if [ "$var" == "push" ]; then HEROKU_PUSH="y"; fi
    if [ "$var" == "launch" ]; then HEROKU_LAUNCH="y"; fi
    if [ "$var" == "config" ]; then HEROKU_CONFIG="y"; fi
    if [ "$var" == "all" ]
    then 
	GIT_CLEAN="y"
        GIT_COMMIT="y"
        HEROKU_CREATE="y"
        HEROKU_PUSH="y"
        HEROKU_LAUNCH="y"
        HEROKU_CONFIG="y"
    fi
    if [ "$var" == "deploy" ]
    then
	HEROKU_PUSH="y"
	HEROKU_LAUNCH="y"
	HEROKU_CONFIG="y"
    fi
done

if [ $GIT_CLEAN == "y" ]
then
    echo "INFO: Remove .git directory if necessary"
    GIT_DIR_PATH=`readlink -f .git`
    if [[ -d "${GIT_DIR_PATH}" ]]
    then
	echo "INFO: Start to Remove the .git directory"
	rm -rf .git
    fi
fi


if [ $GIT_COMMIT == "y" ]
then
    GIT_DIR_PATH=`readlink -f .git`
    if [[ -d "${GIT_DIR_PATH}"  ]]
    then
        echo "INFO: Add the changes to GIT"
        git add .

        if [[ ! $(git status) =~ "nothing to commit" ]]
        then
            echo "INFO: Commit the changes"
            git commit -m "Auto commit "
        else
            echo "INFO: Nothing to commit"
        fi
    else
        echo "INFO: Initialize GIT Repo and Commit"
        git init
        git add .
        git commit -m "Initial Commit"
	fi
fi


if [ $HEROKU_CREATE == "y" ]
then
    echo "INFO: Create HeroKu app"
    heroku create
fi

if [ $HEROKU_CONFIG == "y" ]
then
    echo "INFO: Set environment variables"
    ### Export the parameters
    heroku config:set   TC_DB_HOST=50.17.156.219 \
                        TC_DB_PORT=2021 \
                        TC_DB_USER=informix \
                        TC_DB_PASSWORD=1nf0rm1x \
                        TC_API_HOST=api.topcoder.com

    heroku config:set BUILDPACK_URL=https://github.com/cloudspokes/tc-api-heroku-buildpack.git
fi

#### Upload the code to heroku
if [ $HEROKU_PUSH == "y" ]
then
    echo "INFO: Push app to the master"
    git push heroku master
fi

### Start Dyno for 1 instance
if [ $HEROKU_LAUNCH == "y" ]
then
    echo "INFO: Start 1 Dyno"
    heroku ps:scale web=1
fi







