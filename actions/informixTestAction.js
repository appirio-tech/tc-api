/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

var clone = require('util')._extend;
var apiCodes = require('../config.js').apiCodes;
var DBMS = require('../common/DBMS.js');
var async = require('async');

/**
 * This is the function that actually test the asynchronous/synchronous data access.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 * @param {boolean} asyncFlag The flag to indicate to use async (true) or sync (false) calls
 */
var testAction = function (api, connection, next, asyncFlag) {
    var err2 = clone(apiCodes.badRequest), projectId = parseInt(connection.params.projectId, 10);

    if (isNaN(projectId)) {
        err2.message = "The required id should be an integer ";
        connection.error = JSON.stringify(err2);
        api.log(connection.error, "error");
        connection.rawConnection.responseHttpCode = 400;
        next(connection, true);
        return;
    }

    async.parallel([
        function (callback) {
            api.dataAccess.executeQuery(DBMS.TCS_CATALOG, "driver_test", [{
                type: 'Int',
                value: projectId
            }],
                function (err, result) {
                    api.log("Execution of query one with projectId " + projectId, "debug");
                    if (err) {
                        callback(err, "gen");
                    } else {
                        callback(null, {
                            totalCount: result.length,
                            data: result
                        });
                    }
                },
                asyncFlag);
        },
        function (callback) {
            api.dataAccess.executeQuery(DBMS.TCS_CATALOG, "test_query", [{
                type: 'Int',
                value: (projectId + 1)
            }],
                function (err, result) {
                    api.log("Execution of query two with projectId " + (projectId + 1), "debug");
                    if (err) {
                        callback(err, "gen");
                    } else {
                        callback(null, {
                            totalCount: result.length,
                            data: result
                        });
                    }
                },
                asyncFlag);
        },
        function (callback) {
            api.dataAccess.executeQuery(DBMS.TCS_CATALOG, "test_query", [{
                type: 'Int',
                value: (projectId + 2)
            }],
                function (err, result) {
                    api.log("Execution of query three with projectId " + (projectId + 2), "debug");
                    if (err) {
                        callback(err, "gen");
                    } else {
                        callback(null, {
                            totalCount: result.length,
                            data: result
                        });
                    }
                },
                asyncFlag);
        }
    ],

        function (err, result) {
            if (err) {
                api.log("Error occured: " + err + " " + (err.stack || ''), "error");
                connection.error = err;
                next(connection, true);
            } else {
                api.log("Forward result",  "debug");
                connection.response = result;
                next(connection, true);
            }
        });
};

/**
 * The API for running asynchronous requests
 */
exports.testAsynchronous = {
    name : "testAsynchronous",
    description : "Test Action Asynchronous",
    inputs : {
        required : ["projectId"],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute testAction#run", 'debug');
        testAction(api, connection, next, true);
    }
};

/**
 * The API for running synchronous requests
 */
exports.testSynchronous = {
    name : "testSynchronous",
    description : "Test Action Synchronous",
    inputs : {
        required : ["projectId"],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute testAction#run", 'debug');
        testAction(api, connection, next, false);
    }
};
