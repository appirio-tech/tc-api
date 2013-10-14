TopCoder API (built on NodeJS)
==============================

As [TopCoder](http://www.topcoder.com/tc) and [CloudSpokes](http://www.cloudspokes) integrate, the APIs are going to play a critical role. TopCoder has already started work on a API, which can be found [here](http://dev.topcoder.com). That API is built on a Java stack.

In order to accelerate development we are looking to move some of the API work to use a more cloud-friendly approach built on [NodeJS](http://www.nodejs.org). This is complicated by the fact that the back end of TC relies on an Informix DB.

This code at the moment should be considered in a "Proof-of-concept" state, but we hope to rapidly bring it up into production readiness.

Configuration
-------------

Configuration at the moment is fairly messy.

### Informix
* *sqlhosts* - You need to configure a sqlhosts file to tell the Informix drivers about the Informix DB. Copy the example file, `doc/sqlhosts.informixoltp_tcp`. Change line 62 to point to the IP and Port of your Informix DB. Then put the file in `thirdparty/ibm/informix/etc`.
* *.procfile* - This file loads all the Informix variables into the session. You should not have to change it, but be aware of it. When working locally you'll need to run it manually by executing `. .profile` in your terminal.
* *db_conf.json* - Database name and the db username and password are set here. Currently there are also values set for host and port, but these are ignored - the informix drivers looks at the sqlhosts file for those values.

### OAuth Configuration
* *config.js* - This file has most of the values used by the oauth provider. *clientID*, *clientSecret*, are already setup for dev purposes. Change the *callbackURL* to use the domain/IP of where you will be running API code.
* *node_modules/passport-topcoder/lib/passport-topcoder/strategy.js* - The OAuth provider URL is being set on lines 51 and 52, and is currently hardcoded to TopCoder's production OAuth provider. These values need to be moved up into general application configuration.

Running on Heroku
-----------------

To run on Heroku, setup all the configuration as described above. Then follow the guide "[Getting Started with Node.js on Heroku](http://devcenter.heroku.com/articles/getting-started-with-nodejs)" with one additional step - after you create the application but before deploying it be sure to change your buildback as follows:
``` sh
heroku config:set BUILDPACK_URL=https://github.com/cloudspokes/tc-api-heroku-buildpack.git
```
The reason is because we have to run the `.profile` *before* `npm rebuild` is called.

Hopefully we can eliminate the need for this by getting rid of the use of `.profile`.
