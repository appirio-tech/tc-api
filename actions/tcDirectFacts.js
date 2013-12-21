/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author KeSyren
 */
"use strict";

/**
 * This is the function that actually get TC Direct Facts.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getTcDirectFacts = function (api, connection, next) {
    api.dataAccess.executeQuery("tc_direct_facts", {}, connection.dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
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
 * The API for getting TC Direct Facts
 */
exports.action= {
    name : "tcDirectFacts",
    description : "tcDirectFacts",
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
        if (connection.dbConnectionMap) {
            api.log("Execute contestTypes#run", 'debug');
            getTcDirectFacts(api, connection, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

