#!/bin/bash

#
# Copyright (C) 2013-2014 TopCoder Inc., All Rights Reserved.
#
# Version: 1.1
# Author: vangavroche, delemach, isv
#
# changes in 1.1:
# - added RESET_PASSWORD_TOKEN_CACHE_EXPIRY environment variable
# - added RESET_PASSWORD_TOKEN_EMAIL_SUBJECT environment variable
# - added REDIS_HOST environment variable
# - added REDIS_PORT environment variable
#
export CACHE_EXPIRY=-1

VM_IP=informix.cloud.topcoder.com
if [ -n "$TC_VM_IP" ]
then
VM_IP=$TC_VM_IP
fi

export TC_DB_NAME=informixoltp_tcp
export TC_DB_HOST=$VM_IP
export TC_DB_PORT=2021
export TC_DB_USER=informix
export TC_DB_PASSWORD=1nf0rm1x

export TC_DW_NAME=informixoltp_tcp
export TC_DW_HOST=$VM_IP
#export TC_DW_NAME=datawarehouse_tcp
#export TC_DW_HOST=54.204.103.114
export TC_DW_PORT=2021
export TC_DW_USER=informix
export TC_DW_PASSWORD=1nf0rm1x


# oauth provider
export TC_API_HOST=api.topcoder.com

# LDAP settings
export TC_LDAP_HOST=$VM_IP
export TC_LDAP_PORT=636
export TC_LDAP_PASSWORD=secret
export TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
export TC_BIND_DN="cn=Manager,dc=topcoder,dc=com"

# Mail settings
export TC_EMAIL_HOST=smtp.gmail.com
export TC_EMAIL_HOST_PORT=465
export TC_EMAIL_SECURED=true
export TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com
export TC_EMAIL_PASSWORD=tc_public_email
export TC_EMAIL_FROM=tc.ldap.test@gmail.com
export TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"
export TC_SOFTWARE_SERVER_NAME="https://www.topcoder.com"

#export DISABLE_CONSOLE_LOG=true

export PASSWORD_HASH_KEY="ciTHHTSMg6ixffIuPbB30A=="

## JDBC connection pool environment variables - set for all databases
export MINPOOL=1
export MAXPOOL=20
export MAXSIZE=0
export IDLETIMEOUT=3600
export TIMEOUT=3000
# Used in Jira soap service (Bugs API)
export JIRA_USERNAME=api_test
export JIRA_PASSWORD=8CDDp6BHLtUeUdD

# Forum settings
export TC_FORUMS_SERVER_NAME="http://forums.topcoder.com/"
export STUDIO_FORUMS_SERVER_NAME="http://studio.topcoder.com/forums"
export GRANT_FORUM_ACCESS=false
export DEV_FORUM_JNDI=jnp://env.topcoder.com:1199

export ACTIONHERO_CONFIG=./config.js

## The period for expiring the generated tokens for password resetting
export RESET_PASSWORD_TOKEN_CACHE_EXPIRY=1800000
export RESET_PASSWORD_TOKEN_EMAIL_SUBJECT=TopCoder Account Password Reset

export REDIS_HOST=localhost
export REDIS_PORT=6379

export DEVELOP_SUBMISSION_MAX_SIZE=6144
