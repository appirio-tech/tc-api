#!/bin/bash
####
# Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
#
# Author: EasyHard, pvmagacho2
# Version: 1.0
#
# This file is for heroku app's enviroment setup.
# This enviroment variables are needed because Informix is highly depended
# on enviroment varibles to configurate. And LD_LIBRARY_PATH is for
# dynamic linking libraries.
####

# modify this to your VM (or box)'s IP Address, which running a informix database
# on it and topcoder's database scripts runned.
TC_DB_HOST=54.227.148.152
TC_DB_PORT=2021
TC_DB_USER=informix
TC_DB_PASSWORD=1nf0rm1x
TC_API_HOST=api.topcoder.com

TC_LDAP_HOST=54.227.148.152
TC_LDAP_PORT=636
TC_LDAP_PASSWORD=secret
TC_LDAP_MEMBER_BASE_DN="ou=members, dc=topcoder, dc=com"
TC_BIND_DN="cn=Manager,dc=topcoder,dc=com"

TC_EMAIL_HOST=smtp.gmail.com
TC_EMAIL_HOST_PORT=465
TC_EMAIL_ACCOUNT=tc.ldap.test@gmail.com
TC_EMAIL_PASSWORD=tc_public_email
TC_EMAIL_TEMPLATE_DIR=mail_templates

export TC_DB_HOST TC_DB_PORT TC_DB_USER TC_DB_PASSWORD TC_API_HOST
export TC_LDAP_HOST TC_LDAP_PORT TC_LDAP_PASSWORD TC_LDAP_MEMBER_BASE_DN TC_BIND_DN
export TC_EMAIL_HOST TC_EMAIL_HOST_PORT TC_EMAIL_ACCOUNT TC_EMAIL_PASSWORD TC_EMAIL_TEMPLATE_DIR

# comment for CSDK use (C++ informix library)
export USE_JDBC=YES

# Dir of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

LC_ALL="en_US.utf8"
CLIENT_LOCALE="en_US.utf8"
DB_LOCALE="en_US.utf8"

INFORMIXSERVER='informixoltp_tcp'
INFORMIXDIR="${DIR}/thirdparty/ibm/informix"
INFORMIXLIBDIR="${INFORMIXDIR}/lib"
INFORMIXLIBS="${INFORMIXLIBDIR}"
INFORMIXCONTIME=20
INFORMIXCONRETRY=1

ONCONFIG="onconfig.${INFORMIXSERVER}"
INFORMIXSQLHOSTS="${INFORMIXDIR}/etc/sqlhosts.${INFORMIXSERVER}"

echo "informixoltp_tcp onsoctcp ${TC_DB_HOST} ${TC_DB_PORT}"
printf "informixoltp_tcp onsoctcp ${TC_DB_HOST} ${TC_DB_PORT}" > "$INFORMIXSQLHOSTS"

for d in c++ cli client client/csm csm dmi esql ; do
    if [[ -d "${INFORMIXLIBDIR}/${d}" ]]; then
        INFORMIXLIBS=${INFORMIXLIBS}:${INFORMIXLIBDIR}/${d}
    fi
done

LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:${INFORMIXLIBS}

export INFORMIXSERVER INFORMIXDIR ONCONFIG INFORMIXSQLHOSTS INFORMIXCONTIME INFORMIXCONRETRY
export LD_LIBRARY_PATH PATH DB_LOCALE CLIENT_LOCALE IFMX_HISTORY_SIZE LC_ALL

node ./node_modules/.bin/actionHero start

