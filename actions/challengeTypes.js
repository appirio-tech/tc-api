/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author vangavroche, mekanizumu
 * @changes from 1.0
 * merged with Member Registration API
 * @changes from 1.1
 * Add studio types in this action.
 */
"use strict";

/**
 * This is the function that actually get the challenge types.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Boolean} isStudio - The flag that represents if to search studio challenge types.
 * @param {Function} next The callback to be called after this function is done
 */
var getChallengeTypes = function (api, connection, dbConnectionMap, isStudio, next) {
    var sqlParameters, type = isStudio ? api.helper.studio : api.helper.software;
    sqlParameters = { project_type_id: type.category };
    api.dataAccess.executeQuery("get_challenge_types", sqlParameters, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
            connection.error = err;
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            var ret = [];
            result.forEach(function (item) {
                ret.push({
                    challengeCategoryId: item.challenge_category_id,
                    challengeTypeId: item.challenge_type_id,
                    name: item.name,
                    description: item.description
                });
            });
            connection.response = ret;
            next(connection, true);
        }

    });
};

/**
 * The API for getting challenge types
 */
exports.softwareTypes = {
    name : "softwareTypes",
    description : "softwareTypes",
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
            api.log("Execute softwareTypes#run", 'debug');
            getChallengeTypes(api, connection, connection.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

exports.studioTypes = {
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
            api.log("Execute studioTypes#run", 'debug');
            getChallengeTypes(api, connection, connection.dbConnectionMap, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting challenge types, while this is guarded by OAuth
 */
exports.softwareTypesSecured = {
    name : 'softwareTypesSecured',
    description : 'softwareTypesSecured',
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
        if (connection.dbConnectionMap) {
            api.log("Execute softwareTypesSecured#run", 'debug');
            getChallengeTypes(api, connection, connection.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
