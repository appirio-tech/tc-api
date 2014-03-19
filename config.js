/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @author vangavroche, Ghost_141, kurtrips, Sky_, isv
 * @version 1.13
 * changes in 1.1:
 * - add defaultCacheLifetime parameter
 * changes in 1.2:
 * - add badgeProperties.
 * changes in 1.3:
 * - add oauthClientId and oauthClientSecret parameters
 * changes in 1.4:
 * - add oauthConnection and oauthDomain parameters
 * - added submissionLink and finalFixLink
 * changes in 1.5:
 * - add jiraWsdlUrl, jiraUsername and jiraPassword parameters
 * changes in 1.6:
 * - add corporate_oltp in database mapping.
 * changes in 1.7:
 * - add downloadsRootDirectory parameter
 * changes in 1.8:
 * - add time_oltp and corporate_oltp in databaseMapping.
 * - added uploadsRootDirectory, thurgoodDownloadUsername and thurgoodDownloadPassword parameters
 * changes in 1.9:
 * - add parameters for submission output directory, submission max size and thurgood endpoint parameters
 * changes in 1.10:
 * - add challengeCommunityLink and reviewAuctionDetailLink.
 * Changes in 1.11:
 * - add cachePrefix in config.general.
 * - added designSubmissionsBasePath for design submissions 
 * changes in 1.12:
 * - add defaultUserCacheLifetime property.
 * Changes in 1.13:
 * - add minPasswordLength and maxPasswordLength
 * - add resetTokenSuffix
 */
"use strict";

/**
 * Module dependencies.
 */
var fs = require('fs');
var cluster = require('cluster');

var config = {};

/////////////////////////
// General Information //
/////////////////////////

config.general = {
    apiVersion : "0.0.1",
    serverName : "TopCoder API",
    // id: "myActionHeroServer",                                    // id can be set here, or it will be generated dynamically.  Be sure that every server you run has a unique ID (which will happen when genrated dynamically)
    serverToken : "not-used",                                       // A unique token to your application that servers will use to authenticate to each other
    welcomeMessage : "Hello! Welcome to the TopCoder API",          // The welcome message seen by TCP and webSocket clients upon connection
    flatFileNotFoundMessage : "Sorry, that file is not found :(",   // The body message to accompany 404 (file not found) errors regading flat files
    serverErrorMessage : "The server experienced an internal error",// The message to accompany 500 errors (internal server errors)
    defaultChatRoom : "default",                                // The chatRoom that TCP and webSocket clients are joined to when the connect
    defaultLimit : 100,                                             // defaultLimit & defaultOffset are useful for limiting the length of response lists.
    defaultOffset : 0,
    workers : 5,                                                    // The number of internal "workers" (timers) this node will have.
    developmentMode : (process.env.NODE_ENV === 'development') ? true : false,  // Watch for changes in actions and tasks, and reload/restart them on the fly
    simultaneousActions : 5,                                        // How many pending actions can a single connection be working on
    paths : {                                                       // configuration for your actionHero project structure
        "action" : __dirname + "/actions",
        "task" : __dirname + "/tasks",
        "public" : __dirname + "/public",
        "pid" : __dirname + "/pids",
        "log" : __dirname + "/log",
        "server" : __dirname + "/servers",
        "initializer" : __dirname + "/initializers"
    },
    defaultCacheLifetime : process.env.CACHE_EXPIRY || 1000 * 60 * 10, //10 min default
    defaultAuthMiddlewareCacheLifetime : process.env.AUTH_MIDDLEWARE_CACHE_EXPIRY || 1000 * 60 * 10, //10 min default
    defaultUserCacheLifetime: process.env.USER_CACHE_EXPIRY || 1000 * 60 * 60 * 24, //24 hours default
    resetTokenSuffix: 'reset-token',
    minPasswordLength: 8,
    maxPasswordLength: 30,
    cachePrefix: '',
    oauthClientId: process.env.OAUTH_CLIENT_ID || "CMaBuwSnY0Vu68PLrWatvvu3iIiGPh7t",
    //auth0 secret is encoded in base64!
    oauthClientSecret: new Buffer(process.env.OAUTH_CLIENT_SECRET || 'ZEEIRf_aLhvbYymAMTFefoEJ_8y7ELrUaboMTmE5fQoJXEo7sxxyg8IW6gtbyKuT', 'base64'),
    oauthConnection: process.env.OAUTH_CONNECTION || "vm-ldap-connection",
    oauthDomain: process.env.OAUTH_DOMAIN || "sma",
    jiraWsdlUrl: "https://apps.topcoder.com/bugs/rpc/soap/jirasoapservice-v2?wsdl",
    jiraUsername: process.env.JIRA_USERNAME,
    jiraPassword: process.env.JIRA_PASSWORD,
    filteredParams: ['password'],
    downloadsRootDirectory: process.env.DOWNLOADS_ROOT_DIRECTORY || __dirname + "/downloads",
    challengeCommunityLink: 'http://community.topcoder.com/tc?module=ProjectDetail&pj=',
    reviewAuctionDetailLink: 'http://community.topcoder.com/tc?module=ReviewAuctionDetails&aid=',

    /**
     * The directory where uploaded files are stored.
     * It can be relative to the current directory or can be absolute 
     */
    uploadsRootDirectory: process.env.UPLOADS_ROOT_DIRECTORY || "test/test_files/dev_download_submission"
};

/////////////
// logging //
/////////////

config.logger = {
    transports : []
};

// console logger
if (cluster.isMaster && !process.env.DISABLE_CONSOLE_LOG) {
    config.logger.transports.push(function (api, winston) {
        return new (winston.transports.Console)({
            colorize : true,
            level : "debug",
            timestamp : api.utils.sqlDateTime
        });
    });
}

// file logger
fs.mkdir("./log", function (err) {
    if (err && err.code !== "EEXIST") {
        console.log(err);
        process.exit();
    }
});

config.logger.transports.push(function (api, winston) {
    return new (winston.transports.File)({
        filename : config.general.paths.log + "/" + api.pids.title + '.log',
        level : "debug",
        json : false,
        timestamp : true
    });
});

///////////
// Stats //
///////////

config.stats = {
    // how often should the server write its stats to redis?
    writeFrequency: 300000, //every five min
    // what redis key(s) [hash] should be used to store stats?
    //  provide no key if you do not want to store stats
    keys: [
        'actionHero:stats'
    ]
};

///////////
// Redis //
///////////

config.redis = {
    fake : !(process.env.REDIS_HOST && process.env.REDIS_HOST !== '127.0.0.1'),
    host : process.env.REDIS_HOST || "127.0.0.1",
    port : process.env.REDIS_PORT || 6379,
    password : null,
    options : null,
    DB : 0
};

//////////
// FAYE //
//////////

config.faye = {
    mount : "/faye",
    timeout : 45,
    ping : null,
    redis: config.redis,
    namespace: 'faye:'
};

///////////
// TASKS //
///////////

// see https://github.com/taskrabbit/node-resque for more information / options
config.tasks = {
  // Should this node run a scheduler to promote delayed tasks?
    scheduler: false,
  // what queues should the workers work and how many to spawn?
  //  ['*'] is one worker working the * queue
  //  ['high,low'] is one worker working 2 queues
    queues: ['default'],
  // how long to sleep between jobs / scheduler checks
    timeout: 5000,
  // What redis server should we connect to for tasks / delayed jobs?
    redis: config.redis
};

/////////////
// SERVERS //
/////////////

// uncomment the section to enable the server

config.servers = {
    "web" : {
        secure : false,                         // HTTP or HTTPS?
        serverOptions : {},                     // Passed to https.createServer if secure=ture. Should contain SSL certificates
        port : process.env.PORT || 8080,        // Port or Socket
        bindIP : "0.0.0.0",                     // Which IP to listen on (use 0.0.0.0 for all)
        httpHeaders : {},                       // Any additional headers you want actionHero to respond with
        urlPathForActions : "api",              // Route that actions will be served from; secondary route against this route will be treated as actions, IE: /api/?action=test == /api/test/
        urlPathForFiles : "public",             // Route that static files will be served from; path (relitive to your project root) to server static content from
        rootEndpointType : "api",               // When visiting the root URL, should visitors see "api" or "file"? Visitors can always visit /api and /public as normal
        directoryFileType : "index.html",       // The default filetype to server when a user requests a directory
        flatFileCacheDuration : 60,             // The header which will be returned for all flat file served from /public; defined in seconds
        fingerprintOptions : {                  // Settings for determining the id of an http(s) requset (browser-fingerprint)
            cookieKey : "sessionID",
            toSetCookie : true,
            onlyStaticElements : true
        },
        formOptions : {                         // Options to be applied to incomming file uplaods. More options and details at https://github.com/felixge/node-formidable
            uploadDir : "/tmp",
            keepExtensions : false,
            maxFieldsSize : 1024 * 1024 * 100
        },
        // Options to configure metadata in responses
        metadataOptions: {
            serverInformation: true,
            requesterInformation: true
        },
        returnErrorCodes : false                // When true, returnErrorCodes will modify the response header for http(s) clients if connection.error is not null. You can also set connection.responseHttpCode to specify a code per request.
    },
    // "socket" : {
    //   secure: false,                        // TCP or TLS?
    //   serverOptions: {},                    // passed to tls.createServer if secure=ture. Should contain SSL certificates
    //   port: 5000,                           // Port or Socket
    //   bindIP: "0.0.0.0",                    // which IP to listen on (use 0.0.0.0 for all)
    // },
    "websocket" : {
    }
};

/**
 * A mapping indicating which database belongs to which database server.
 */
config.databaseMapping = {
    "common_oltp" : "TC_DB",
    "informixoltp" : "TC_DB",
    "tcs_catalog" : "TC_DB",
    "topcoder_dw" : "TC_DW",
    "tcs_dw" : "TC_DW",
    "time_oltp": "TC_DB",
    "corporate_oltp": "TC_DB"
};

config.documentProvider = 'http://community.topcoder.com/tc?module=DownloadDocument&docid';

/**
 * The default password to be used for social register
 */
config.defaultPassword = process.env.DEFAULT_PASSWORD  || "defaultpass";
config.submissionLink = 'https://software.topcoder.com/review/actions/DownloadContestSubmission.do?method=downloadContestSubmission&uid=';
config.finalFixLink = 'https://software.topcoder.com/review/actions/DownloadFinalFix.do?method=downloadFinalFix&uid=';
config.designSubmissionLink = 'http://studio.topcoder.com/?module=DownloadSubmission&sbmid=';

//The name of the folder where to store the submission files.
//Please make sure the directory already exists
config.submissionDir = process.env.SUBMISSION_DIR || 'test/tmp/submissions';

/**
 * The thurgood username and password used for downloading submissions
 */
config.thurgoodDownloadUsername = process.env.THURGOOD_DOWNLOAD_USERNAME || "iamthurgood";
config.thurgoodDownloadPassword = process.env.THURGOOD_DOWNLOAD_PASSWORD || "secret";

//Max size of a submission. Currently set to 2KB for test purpose. On production, it will be in the order of 100s of MB
//Set to 0 or negative for no size limit.
config.submissionMaxSizeBytes = 2048;

//////Thurgood configurables///////
config.thurgoodCodeUrl = 'https://software.topcoder.com/review/actions/DownloadContestSubmission.do?method=downloadContestSubmission%26uid=';

//API URL for production
//config.thurgoodApiUrl = 'https://thurgood-production.herokuapp.com/api/1/jobs';
//API URL for testing
config.thurgoodApiUrl = process.env.THURGOOD_API_URL || 'http://localhost:8090/';

config.thurgoodTimeout = 5000;

//API KEY for testing
//Can be overwritten by an environment variable of name THURGOOD_API_KEY 
config.thurgoodApiKey = process.env.THURGOOD_API_KEY || 'mock_api_key';

//The base folder for design submission files
config.designSubmissionsBasePath = process.env.DESIGN_SUBMISSIONS_BASE_PATH || 'test/tmp/design_submissions';

//////////////////////////////////

exports.config = config;
