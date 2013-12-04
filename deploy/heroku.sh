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
    heroku config:set   
                        TC_DATABASE_LIST=(TC_DB TC_DW) \
                        TC_DB_NAME=informixoltp_tcp \
                        TC_DB_HOST=54.205.34.183 \
                        TC_DB_PORT=2021 \
                        TC_DB_USER=informix \
                        TC_DB_PASSWORD=1nf0rm1x \
                        TC_DW_NAME=informixoltp_tcp \
                        TC_DW_HOST=54.205.34.183 \
                        TC_DW_PORT=2021 \
                        TC_DW_USER=informix \
                        TC_DW_PASSWORD=1nf0rm1x \
                        TC_API_HOST=api.topcoder.com \
                        TC_LDAP_HOST=54.221.107.21 \
                        TC_LDAP_PORT=636 \
                        TC_LDAP_PASSWORD=secret \
                        TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com" \
                        TC_BIND_DN="cn=Manager,dc=topcoder,dc=com" \
                        TC_EMAIL_HOST=smtp.gmail.com \
                        TC_EMAIL_HOST_PORT=465 \
                        TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com \
                        TC_EMAIL_PASSWORD=tc_public_email \
                        TC_EMAIL_TEMPLATE_DIR=mail_templates \
                        TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"

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







