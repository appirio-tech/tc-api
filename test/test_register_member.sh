export TC_DB_COUNT=2
export TC_DB_NAME_1=informixoltp_tcp
export TC_DB_HOST_1=54.205.34.183
export TC_DB_PORT_1=2021
export TC_DB_USER_1=informix
export TC_DB_PASSWORD_1=1nf0rm1x

export TC_DB_NAME_2=datawarehouse_tcp
export TC_DB_HOST_2=54.205.34.183
export TC_DB_PORT_2=2021
export TC_DB_USER_2=informix
export TC_DB_PASSWORD_2=1nf0rm1x

. .profile

./node_modules/.bin/mocha ./test/register_member.js