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
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getTcDirectFacts = function (api, connection, dbConnectionMap, next) {
    api.dataAccess.executeQuery("tc_direct_facts", {}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.helper.handleError(api, connection, err);
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            var data = result[0];
            connection.response = {
                activeContestsCount: data.active_contests_count,
                activeMembersCount: data.active_members_count,
                memberCount: data.member_count,
                activeProjectsCount: data.active_projects_count,
                completedProjectCount: data.completed_projects_count,
                prizePurse: data.prize_purse
            };
            next(connection, true);
        }

    });
};

/**
 * The API for getting TC Direct Facts
 */
exports.action = {
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
            api.log("Execute tcDirectFacts#run", 'debug');
            getTcDirectFacts(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

