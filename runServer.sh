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

# modify this to your VM (or box)'s IP Address, which running a informix database
# on it and topcoder's database scripts runned.
export TC_DB_NAME=informixoltp_tcp
export TC_DB_HOST=54.227.148.152
export TC_DB_PORT=2021
export TC_DB_USER=informix
export TC_DB_PASSWORD=1nf0rm1x

export TC_DW_NAME=informixoltp_tcp
export TC_DW_HOST=54.227.148.152
#export TC_DW_NAME=datawarehouse_tcp
#export TC_DW_HOST=54.204.103.114
export TC_DW_PORT=2021
export TC_DW_USER=informix
export TC_DW_PASSWORD=1nf0rm1x

# oauth provider
export TC_API_HOST=api.topcoder.com

# LDAP settings
export TC_LDAP_HOST=50.17.140.110
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

. .profile

## JDBC connection pool environment variables - set for all databases
#export MINPOOL=1
#export MAXPOOL=20
#export MAXSIZE=0
#export IDLETIMEOUT=3600
#export TIMEOUT=3000

node ./node_modules/.bin/actionHero start
