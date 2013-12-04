#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
#

PATH="heroku/bin:$PATH"
GIT_CLEAN='n'
GIT_COMMIT='n'
HEROKU_CREATE='n'
HEROKU_PUSH='n'
HEROKU_LAUNCH='n'
HEROKU_CONFIG='n'
HEROKU_APP='tc-api-heroku'

for var in "$@"
do
    if [ "$var" == "create" ]; then HEROKU_CREATE="y"; fi
    if [ "$var" == "push" ]; then HEROKU_PUSH="y"; fi
    if [ "$var" == "launch" ]; then HEROKU_LAUNCH="y"; fi
    if [ "$var" == "config" ]; then HEROKU_CONFIG="y"; fi
    if [ "$var" == "all" ]
    then 
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


if [ $HEROKU_CREATE == "y" ]
then
    echo "INFO: Create HeroKu app"
    heroku apps:destroy --confirm $HEROKU_APP
    heroku apps:create $HEROKU_APP
fi

if [ $HEROKU_CONFIG == "y" ]
then
    echo "INFO: Set environment variables"
    ### Export the parameters
    heroku config:set   TC_DB_HOST=54.196.46.77 \
                        TC_DB_PORT=2021 \
                        TC_DB_USER=informix \
                        TC_DB_PASSWORD=1nf0rm1x \
                        TC_API_HOST=api.topcoder.com \
                        TC_LDAP_HOST=54.196.46.77 \
                        TC_LDAP_PORT=636 \
                        TC_LDAP_PASSWORD=secret \
                        TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com" \
                        TC_BIND_DN="cn=Manager,dc=topcoder,dc=com" \
                        TC_EMAIL_HOST=smtp.gmail.com \
                        TC_EMAIL_HOST_PORT=465 \
                        TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com \
                        TC_EMAIL_PASSWORD=tc_public_email \
                        TC_EMAIL_SECURED=true \
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
