#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche
#

#export TC_DB_HOST=50.17.156.219
export TC_DB_HOST=192.168.0.102
export TC_DB_PORT=2021
export TC_DB_USER=informix
export TC_DB_PASSWORD=1nf0rm1x
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


. .profile

node ./node_modules/.bin/actionHero start
