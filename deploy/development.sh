#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
#

export TC_DB_COUNT=2
export TC_DB_NAME_1=informixoltp_tcp
export TC_DB_HOST_1=54.205.34.183
export TC_DB_PORT_1=2021
export TC_DB_USER_1=informix
export TC_DB_PASSWORD_1=1nf0rm1x

export TC_DB_NAME_2=topcoder_dw
export TC_DB_HOST_2=54.205.34.183
export TC_DB_PORT_2=2021
export TC_DB_USER_2=informix
export TC_DB_PASSWORD_2=1nf0rm1x

export TC_API_HOST=api.topcoder.com

export TC_LDAP_HOST=54.221.107.21
export TC_LDAP_PORT=636
export TC_LDAP_PASSWORD=secret
export TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
export TC_BIND_DN="cn=Manager,dc=topcoder,dc=com"

export TC_EMAIL_HOST=smtp.gmail.com
export TC_EMAIL_HOST_PORT=465
export TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com
export TC_EMAIL_PASSWORD=tc_public_email
export TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"

. .profile

node ./node_modules/.bin/actionHero start
