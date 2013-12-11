/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author KeSyren
 */
"use strict";

/**
 * This is the function that actually get the studio/design contest types.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getStudioTypes = function (api, connection, next) {
    api.dataAccess.executeQuery("get_studio_types", {}, connection.dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
            connection.error = err;
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            var ret = new Array();
            var len = result.length;
            for(var i=0; i<result.length; i = i + 1) {
                var t = {};
                t.challengeCategoryId = result[i].challengecategoryid;
                t.challengeTypeId = result[i].challengetypeid;
                t.name = result[i].name;
                t.description = result[i].description;
                ret.push(t);
            }
            connection.response = ret;
            next(connection, true);
        }
    });
};

/**
 * The API for getting studio/design contest types
 */
exports.action = {
    name : "studioTypes",
    description : "studioTypes",
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
            getStudioTypes(api, connection, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

