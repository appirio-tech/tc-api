#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
# 

export TC_DB_NAME=informixoltp_tcp
#export TC_DB_HOST=192.168.14.53
export TC_DB_HOST=oltp01.prod.topcoder.com
export TC_DB_PORT=2020
export TC_DB_USER=coder
export TC_DB_PASSWORD=Qn8TZxFFD77tzQwc

export TC_DW_NAME=datawarehouse_tcp
#export TC_DW_HOST=192.168.14.54
export TC_DW_HOST=dw01.prod.topcoder.com
export TC_DW_PORT=2020
export TC_DW_USER=coder
export TC_DW_PASSWORD=Qn8TZxFFD77tzQwc

# oauth provider
export TC_API_HOST=api.topcoder.com

# REDIS settings
#export REDIS_HOST=apicache.xg1cht.0001.usw2.cache.amazonaws.com
export REDIS_HOST=cache-useast01.x5q7n6.0001.use1.cache.amazonaws.com
export REDIS_PORT=6379

# LDAP settings
export TC_LDAP_HOST=ldap.topcoder.com
export TC_LDAP_PORT=636
export TC_LDAP_PASSWORD=tXLRnFeT
export TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
export TC_BIND_DN="cn=coder,dc=topcoder,dc=com"

# Mail settings
export TC_EMAIL_HOST=smtp.topcoder.com
export TC_EMAIL_HOST_PORT=25
export TC_EMAIL_SECURED=false
export TC_EMAIL_ACCOUNT=
export TC_EMAIL_PASSWORD=
export TC_EMAIL_FROM=service@topcoder.com
export TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"

export PASSWORD_HASH_KEY=4uUJ4+xALw==
export DEFAULT_PASSWORD=r3nd0m789soUwi11NeverGue33ed

## JDBC connection pool environment variables - set for all databases
export MINPOOL=5
export MAXPOOL=50
export MAXSIZE=50
export IDLETIMEOUT=600
export TIMEOUT=180000

## auth0 settings
export OAUTH_CLIENT_ID=6ZwZEUo2ZK4c50aLPpgupeg5v2Ffxp9P
export OAUTH_CLIENT_SECRET="Iia-VGJ-_FlIdT53uALiPoQFKizgsX1XTXnY13Yjkf1XQvZvSpY-updjEnQkM0I0"
export OAUTH_CONNECTION=LDAP
export OAUTH_DOMAIN=topcoder

# Used in Jira soap service (Bugs API)
export JIRA_USERNAME=tcwebservice
export JIRA_PASSWORD=860gbry

export JAVA_HOME=/usr/local/java/jdk1.7.0_45
export LD_LIBRARY_PATH=/usr/local/lib:/usr/lib:/usr/local/java/jdk1.7.0_45/jre/lib/amd64:/usr/local/java/jdk1.7.0_45/jre/lib/amd64/server

export DOWNLOADS_ROOT_DIRECTORY=/nfs_shares/tcs-downloads
export SUBMISSION_DIR=/nfs_shares/tcssubmissions

export THURGOOD_API_URL="https://thurgood-production.herokuapp.com/api/1/jobs"
export THURGOOD_API_KEY="52bc413f5e4f3df4c700014a"

export ENABLE_FILE_LOG=true



export ACTIONHERO_CONFIG=./config.js

#node ./node_modules/.bin/actionHero start
