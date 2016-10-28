# Admin App - TC API Reviewer Management API
In this challenge, we need to enhance / extend the tc-api to provide new endpoints to handle admin / copilot / reviewer related tasks.

## Setup
- [nodejs 0.10.x](https://nodejs.org/)
- [Docker](https://docs.docker.com/engine/installation/)
- [docker-compose](https://docs.docker.com/compose/install/)
- java(required by https://github.com/appirio-tech/informix-wrapper)
It will actually use [node-java](https://github.com/joeferner/node-java), if you meet any issues please check there.

informix docker service
```
cd test/docker
docker-compose up
```

Follow exist wiki to setup application [wiki](https://github.com/appirio-tech/tc-api/wiki), please do not run `npm test` since old tests are broken.
TC_VM_IP could be `127.0.0.1` under linux or `192.168.99.100` under mac or windows using docker tool box.
```
# follow wiki to start applications(all previous steps are required)
npm start
```

mock bridge service
```
# you must prepare same environment variables as the tc-api https://github.com/appirio-tech/tc-api/wiki/Configure-Environment-Variables
# I assume you have install all dependencies
node test/scripts/bridge
```
Or you can user real java version using **java8**.
Download  tc-api-jdbc-bridge-dev.zip  in https://apps.topcoder.com/forums//?module=Thread&threadID=891500&start=0
unzip and run `mvn clean package`
update `src/main/resources/bridge.yml` as expected
authDomain: topcoder-dev.com
dbStore/dwStore should change to match configurations in  `tc-api/deploy/development.bat` or `development.sh`
```
TC_DB_NAME=informixoltp_tcp
TC_DB_HOST=$VM_IP
TC_DB_PORT=2021
TC_DB_USER=informix
TC_DB_PASSWORD=1nf0rm1x

TC_DW_NAME=informixoltp_tcp
TC_DW_HOST=$VM_IP
TC_DW_PORT=2021
TC_DW_USER=informix
TC_DW_PASSWORD=1nf0rm1x
```

## lint
```
# you may need to add sudo under linux or mac
npm install jslint -g
jslint routes.js
jslint actions/admins.js
jslint actions/copilots.js
jslint actions/reviewers.js
jslint errors/DuplicateResourceError.js

# exist lint errors in old codes will not fix
jslint initializers/helper.js

jslint test/scripts/bridge.js

jslint test/test.admins.js
jslint test/test.createAdmin.js
jslint test/test.removeAdmin.js

jslint test/test.copilots.js
jslint test/test.createCopilot.js
jslint test/test.removeCopilot.js

jslint test/test.reviewers.js
jslint test/test.createReviewer.js
jslint test/test.removeReviewer.js
```

## Verify by postman
Import postman collection `test/postman/Reviewer_Management_API.json` and environment `test/postman/Reviewer_Management_API_environment.json`.
Make sure tc api is listening `8080` of localhost rightly or url in environment is right for `http://localhost:8080/api/v2`(mocha test will use this url too).
Make sure informix, bridge is also running.
You can verify requests in different folder.
If token is expired please run requests in `login` folder and Log in as admin or ordinary user and update `adminToken`, `userToken` in environment.

## Verify by mocha
It will run similar requests as postman including failure and success cases.

Please make sure informix, tc-api, bridge service is running, it is slow to run single test 
and easy to occur max connection numbers issues so it is better to test files one by one and restart all applications if meets any error.
```
# you must prepare same environment variables as the tc-api https://github.com/appirio-tech/tc-api/wiki/Configure-Environment-Variables
# you may need to add sudo under linux or mac
npm install mocha -g
mocha test/test.admins.js
mocha test/test.createAdmin.js
mocha test/test.removeAdmin.js

mocha test/test.copilots.js
mocha test/test.createCopilot.js
mocha test/test.removeCopilot.js

mocha test/test.reviewers.js
mocha test/test.createReviewer.js
mocha test/test.removeReviewer.js
```

## api doc
Register account in  https://apiary.io and create new api and copy document `tc-api/apiary-admin.apib` and validate document, 
Save and you can click Documentation tab on top to view api doc.


## Max connection number issue
The docker image of informix is limited to have 20 connections.It is very easy to occur **Open Timeout** 
or **Timed out without obtaining all DB connections** or **Error: The server experienced an internal error** during test,postman requests.
You should close all services/applications include bridge service and stop and restart informix again with previous steps.
You may change `MAXPOOL` environment variable since it will be shared in tc api, bridge,test applications so use `20` is not proper actually.

## Pass data to api
when add/remove reviewers you could use categoryId/username in query or body, but I recommend you to send data in body 
since category id in query will be ignored if exists categoryId in body
and it could send number directly in body(provide postman requests for category id in query too).