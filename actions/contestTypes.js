/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author vangavroche, mekanizumu
 * @changes from 1.0
 * merged with Member Registration API
 */
"use strict";

/**
 * This is the function that actually get the contest types.
 * 
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getContestTypes = function (api, connection, dbConnectionMap, next) {
    api.dataAccess.executeQuery("get_contest_types", {}, dbConnectionMap, function (err, result) {
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
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute contestTypes#run", 'debug');
            getContestTypes(api, connection, this.dbConnectionMap, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
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
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute contestTypesSecured#run", 'debug');
            getContestTypes(api, connection, this.dbConnectionMap, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};
