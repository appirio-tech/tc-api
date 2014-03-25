@echo off
REM
REM Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
REM
REM Version: 1.0
REM Author: TrePe
REM

REM tests rely on caching being off. But set this to a real value (or remove) while coding.

set VM_IP=%TC_VM_IP%
IF [%VM_IP%] == [] (
  set VM_IP="informix.cloud.topcoder.com"
)

set CACHE_EXPIRY=-1

set TC_DB_NAME=informixoltp_tcp
set TC_DB_HOST=%VM_IP%
set TC_DB_PORT=2021
set TC_DB_USER=informix
set TC_DB_PASSWORD=1nf0rm1x

set TC_DW_NAME=informixoltp_tcp
set TC_DW_HOST=%VM_IP%
REM set TC_DW_NAME=datawarehouse_tcp
REM set TC_DW_HOST=54.204.103.114
set TC_DW_PORT=2021
set TC_DW_USER=informix
set TC_DW_PASSWORD=1nf0rm1x

REM oauth provider
set TC_API_HOST=api.topcoder.com

REM LDAP settings
set TC_LDAP_HOST=%VM_IP%
set TC_LDAP_PORT=636
set TC_LDAP_PASSWORD=secret
set TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
set TC_BIND_DN="cn=Manager,dc=topcoder,dc=com"

REM Mail settings
set TC_EMAIL_HOST=smtp.gmail.com
set TC_EMAIL_HOST_PORT=465
set TC_EMAIL_SECURED=true
set TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com
set TC_EMAIL_PASSWORD=tc_public_email
set TC_EMAIL_FROM=tc.ldap.test@gmail.com
set TC_EMAIL_TEMPLATE_DIR=mail_templates

set TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"
set TC_SOFTWARE_SERVER_NAME="https://software.topcoder.com"
set TC_FORUMS_SERVER_NAME="http://apps.topcoder.com/forums"

set PASSWORD_HASH_KEY="ciTHHTSMg6ixffIuPbB30A=="
REM JDBC connection pool environment variables - set for all databases
set MINPOOL=1
set MAXPOOL=20
set MAXSIZE=0
set IDLETIMEOUT=3600
set TIMEOUT=3000

REM Used in Jira soap service (Bugs API)
set JIRA_USERNAME=api_test
set JIRA_PASSWORD=8CDDp6BHLtUeUdD

REM Used in challenge registration API
set GRANT_FORUM_ACCESS=true

set ACTIONHERO_CONFIG=./config.js

