#!/bin/bash

#
# Copyright (C) 2013-2014 TopCoder Inc., All Rights Reserved.
#
# Version: 1.3
# Author: vangavroche, isv, TCASSEMBLER
# changes in 1.1:
# - add JIRA_USERNAME and JIRA_PASSWORD
# changes in 1.2:
# - added RESET_PASSWORD_TOKEN_CACHE_EXPIRY environment variable
# - added RESET_PASSWORD_TOKEN_EMAIL_SUBJECT environment variable
# - added REDIS_HOST environment variable
# - added REDIS_PORT environment variable
# changes in 1.3
# - added WKHTMLTOIMAGE_COMMAND_PATH environment variable
# - added WKHTMLTOIMAGE_IMAGE_WIDTH environment variable
# - added HIGHLIGHT_STYLE_LINK environment variable
#

# tests rely on caching being off. But set this to a real value (or remove) while coding.
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
export TC_EMAIL_ACCOUNT=tc.ldap.test.1@gmail.com
export TC_EMAIL_PASSWORD=tc_public_email
export TC_EMAIL_FROM=tc.ldap.test.1@gmail.com
export TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_ACTIVATION_SERVER_NAME="https://www.topcoder-dev.com"
export TC_SOFTWARE_SERVER_NAME="https://software.topcoder-dev.com"
export TC_FORUMS_SERVER_NAME="http://apps.topcoder-dev.com/forums"

export PASSWORD_HASH_KEY="ciTHHTSMg6ixffIuPbB30A=="
## JDBC connection pool environment variables - set for all databases
export MINPOOL=1
export MAXPOOL=20
export MAXSIZE=0
export IDLETIMEOUT=3600
export TIMEOUT=30000

# Used in Jira soap service (Bugs API)
export JIRA_USERNAME=api_test
export JIRA_PASSWORD=8CDDp6BHLtUeUdD

# Forum settings
export STUDIO_FORUMS_SERVER_NAME="http://studio.topcoder-dev.com/forums"
export GRANT_FORUM_ACCESS=false
export DEV_FORUM_JNDI=jnp://env.topcoder.com:1199

## The period for expiring the generated tokens for password resetting
export RESET_PASSWORD_TOKEN_EMAIL_SUBJECT=TopCoder Account Password Reset
# Set this to 180000 which is 3 mins. This will help saving time for test.
export RESET_PASSWORD_TOKEN_CACHE_EXPIRY=180000

export REDIS_HOST=localhost
export REDIS_PORT=6379

export DEVELOP_SUBMISSION_MAX_SIZE=6144

export WATERMARK_FILE_PATH=test/test_files/design_image_file_generator/studio_logo_watermark.png

export WKHTMLTOIMAGE_COMMAND_PATH=/home/ubuntu/tmp/wkhtmltox-0.12.1/static-build/posix-local/wkhtmltox-0.12.1/bin/wkhtmltoimage
export WKHTMLTOIMAGE_IMAGE_WIDTH=1024
export HIGHLIGHT_STYLE_LINK=http://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/styles/%OVERRIDE_STYLE_NAME%.min.css

export JWT_TOKEN_COOKIE_KEY="tcjwt_vm"

export ADMIN_API_KEY=1234567

export ENV_URL="topcoder-dev.com"
export TOPCODER_SITE="www.$ENV_URL"
export APPS_TC="apps.$ENV_URL"
export COMMUNITY_TC="community.$ENV_URL"
export SOFTWARE_TC="software.$ENV_URL"
export STUDIO_TC="studio.$ENV_URL"
export API_TC="api.$ENV_URL"
export APPS_FORUMS_TC="apps.$ENV_URL/forums"
export FORUMS_TC="forums.$ENV_URL"
export STUDIO_FORUMS_TC="studio.$ENV_URL/forums"


