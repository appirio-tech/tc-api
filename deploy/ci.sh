#!/bin/bash

#
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Version: 1.0
# Author: vangavroche, delemach
#

export TC_DB_HOST=54.196.54.170
export TC_DB_PORT=2021
export TC_DB_USER=informix
export TC_DB_PASSWORD=1nf0rm1x
export TC_API_HOST=api.topcoder.com

# oauth provider
export TC_API_HOST=api.topcoder.com

# LDAP settings
export TC_LDAP_HOST=54.196.54.170
export TC_LDAP_PORT=636
export TC_LDAP_PASSWORD=secret
export TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
export TC_BIND_DN="cn=Manager,dc=topcoder,dc=com"

# Mail settings
export TC_EMAIL_HOST=smtp.gmail.com
export TC_EMAIL_HOST_PORT=465
export TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com
export TC_EMAIL_PASSWORD=tc_public_email
export TC_EMAIL_SECURED=true
export TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_ACTIVATION_SERVER_NAME="https://www.topcoder.com"

export DISABLE_CONSOLE_LOG=true

. .profile

