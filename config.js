/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.6
 * @author vangavroche, TCSASSEMBLER, Ghost_141, Sky_
 * changes in 1.1:
 * - add defaultCacheLifetime parameter
 * changes in 1.2:
 * - add badgeProperties.
 * changes in 1.3:
 * - add oauthClientId and oauthClientSecret parameters
 * changes in 1.4:
 * - add oauthConnection and oauthDomain parameters
 * changes in 1.5:
 * - add jiraWsdlUrl, jiraUsername and jiraPassword parameters
 * changes in 1.6:
 * - add downloadsRootDirectory parameter
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
    defaultCacheLifetime : process.env.CACHE_EXPIRY || 1000 * 60 * 30, //30 min default
    defaultAuthMiddlewareCacheLifetime : process.env.AUTH_MIDDLEWARE_CACHE_EXPIRY || 1000 * 60 * 30, //30 min default
    oauthClientId: process.env.OAUTH_CLIENT_ID || "topcoder",
    //auth0 secret is encoded in base64!
    oauthClientSecret: new Buffer(process.env.OAUTH_CLIENT_SECRET || 'ZEEIRf_aLhvbYymAMTFefoEJ_8y7ELrUaboMTmE5fQoJXEo7sxxyg8IW6gtbyKuT', 'base64'),
    oauthConnection: process.env.OAUTH_CONNECTION || "vm-ldap-connection",
    oauthDomain: process.env.OAUTH_DOMAIN || "sma",
    jiraWsdlUrl: "https://apps.topcoder.com/bugs/rpc/soap/jirasoapservice-v2?wsdl",
    jiraUsername: process.env.JIRA_USERNAME,
    jiraPassword: process.env.JIRA_PASSWORD,
    filteredParams: ['password'],
    downloadsRootDirectory: process.env.DOWNLOADS_ROOT_DIRECTORY || __dirname + "/downloads"
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
  queues: [],
  // how long to sleep between jobs / scheduler checks
  timeout: 5000,
  // What redis server should we connect to for tasks / delayed jobs?
  redis: config.redis
}

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
    "tcs_dw" : "TC_DW"
};

/**
 * The badge config data.
 */
config.badge = {};

/**
 * The badge image link.
 */
config.badge.link = 'http://topcoder.com/images/badge.grid.small.png';
/**
 * A mapping indicating the badge properties.
 */
config.badge.properties = {
    1: {
        "left": 0,
        "top": 0
    },
    2: {
        "left": -17,
        "top": 0
    },
    3: {
        "left": -34,
        "top": 0
    },
    4: {
        "left": -51,
        "top": 0
    },
    5: {
        "left": -68,
        "top": 0
    },
    6: {
        "left": 0,
        "top": -17
    },
    7: {
        "left": -17,
        "top": -17
    },
    8: {
        "left": -34,
        "top": -17
    },
    9: {
        "left": -51,
        "top": -17
    },
    10: {
        "left": -68,
        "top": -17
    },
    11: {
        "left": 0,
        "top": -34
    },
    12: {
        "left": -17,
        "top": -34
    },
    13: {
        "left": -34,
        "top": -34
    },
    14: {
        "left": -51,
        "top": -34
    },
    15: {
        "left": -68,
        "top": -34
    },
    16: {
        "left": 0,
        "top": -51
    },
    17: {
        "left": -17,
        "top": -51
    },
    18: {
        "left": -34,
        "top": -51
    },
    19: {
        "left": -51,
        "top": -51
    },
    20: {
        "left": -68,
        "top": -51
    },
    21: {
        "left": 0,
        "top": -68
    },
    22: {
        "left": -17,
        "top": -68
    },
    23: {
        "left": -34,
        "top": -68
    },
    24: {
        "left": -51,
        "top": -68
    },
    25: {
        "left": -68,
        "top": -68
    },
    51: {
        "left": 0,
        "top": -136
    },
    52: {
        "left": 0,
        "top": -102
    },
    53: {
        "left": 0,
        "top": -119
    },
    54: {
        "left": 0,
        "top": -85
    },
    75: {
        "left": 0,
        "top": -170
    },
    76: {
        "left": 0,
        "top": -187
    },
    77: {
        "left": 0,
        "top": -153
    },
    89: {
        "left": 0,
        "top": -204
    },
    90: {
        "left": -17,
        "top": -204
    },
    91: {
        "left": -34,
        "top": -204
    },
    92: {
        "left": -51,
        "top": -204
    },
    93: {
        "left": -68,
        "top": -204
    },
    94: {
        "left": 0,
        "top": -221
    },
    95: {
        "left": -17,
        "top": -221
    },
    96: {
        "left": -34,
        "top": -221
    },
    97: {
        "left": -51,
        "top": -221
    },
    98: {
        "left": -68,
        "top": -221
    },
    99: {
        "left": 0,
        "top": -238
    },
    100: {
        "left": -17,
        "top": -238
    },
    101: {
        "left": -34,
        "top": -238
    },
    102: {
        "left": -51,
        "top": -238
    },
    103: {
        "left": -68,
        "top": -238
    },
    104: {
        "left": 0,
        "top": -255
    },
    105: {
        "left": -17,
        "top": -255
    },
    106: {
        "left": -34,
        "top": -255
    },
    107: {
        "left": -51,
        "top": -255
    },
    108: {
        "left": -68,
        "top": -255
    },
    109: {
        "left": 0,
        "top": -272
    },
    110: {
        "left": -17,
        "top": -272
    },
    111: {
        "left": -34,
        "top": -272
    },
    112: {
        "left": -51,
        "top": -272
    },
    113: {
        "left": -68,
        "top": -272
    },
    114: {
        "left": 0,
        "top": -289
    },
    115: {
        "left": -17,
        "top": -289
    },
    116: {
        "left": -34,
        "top": -289
    },
    117: {
        "left": -51,
        "top": -289
    },
    118: {
        "left": -68,
        "top": -289
    },
    119: {
        "left": -17,
        "top": -85
    },
    120: {
        "left": -34,
        "top": -85
    },
    121: {
        "left": -51,
        "top": -85
    },
    122: {
        "left": -68,
        "top": -85
    },
    123: {
        "left": -17,
        "top": -102
    },
    124: {
        "left": -34,
        "top": -102
    },
    125: {
        "left": -51,
        "top": -102
    },
    126: {
        "left": -68,
        "top": -102
    },
    127: {
        "left": -17,
        "top": -119
    }
};

config.documentProvider = 'http://community.topcoder.com/tc?module=DownloadDocument&docid';
//////////////////////////////////

exports.config = config;
