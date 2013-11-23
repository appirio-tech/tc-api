/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: vangavroche
 */
"use strict";

/**
 * This is the function that actually get the contest types.
 * 
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnection The database connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getContestTypes = function (api, connection, dbConnection, next) {
    api.dataAccess.executeQuery("get_contest_types", {}, dbConnection, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            connection.error = err;
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            connection.response = result;
            next(connection, true);
        }

    });
};

/**
 * The API for getting contest types
 */
exports.contestTypes = {
    name : "contestTypes",
    description : "contestTypes",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    run : function (api, connection, next) {
        if (this.dbConnection) {
            api.log("Execute contestTypes#run", 'debug');
            getContestTypes(api, connection, this.dbConnection, next);
        } else {
            api.log("dbConnection is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * The API for getting contest types, while this is guarded by OAuth
 */
exports.contestTypesSecured = {
    name : 'contestTypesSecured',
    description : 'contestTypesSecured',
    inputs : {
        required : [],
        optional : []
    },
    permissionScope : 'CONTEST_REST',
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    run : function (api, connection, next) {
        if (this.dbConnection) {
            api.log("Execute contestTypesSecured#run", 'debug');
            getContestTypes(api, connection, this.dbConnection, next);
        } else {
            api.log("dbConnection is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};
