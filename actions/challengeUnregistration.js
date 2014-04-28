/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * The APIs to un-register a challenge (studio category or software category) for the current logged-in user.
 *
 * @version 1.0
 * @author bugbuka
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var ForumWrapper = require("forum-connector").ForumWrapper;
var UnauthorizedError = require('../errors/UnauthorizedError');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

//constants
var SUBMITTER_RESOURCE_ROLE_ID = 1,
    PROJECT_USER_AUDIT_DELETE_TYPE = 2;

/**
 * Checks if specified challenge category ID implies the presence of records in project_result and component_inquiry
 * tables for challenge registrants.
 *
 * @param {Number} categoryId - ID for challenge category.
 * @returns {boolean} true if above records are required; false otherwise.
 * @since 1.3
 */
function isProjectResultCategory(categoryId) {
    return (categoryId === 1   // Component Design
        || categoryId === 2    // Component Development
        || categoryId === 5    // Component Testing
        || categoryId === 6    // Application Specification
        || categoryId === 7    // Application Architecture
        || categoryId === 9    // Bug Hunt
        || categoryId === 13   // Test Scenarios
        || categoryId === 26   // Test Suites
        || categoryId === 14   // Application Assembly
        || categoryId === 23   // Application Conceptualization
        || categoryId === 19   // UI Prototype
        || categoryId === 24   // RIA Build
        || categoryId === 25   // RIA Component
        || categoryId === 29   // Copilot Posting
        || categoryId === 35   // Content Creation
        || categoryId === 36   // Reporting
        || categoryId === 38   // First2Finish
        || categoryId === 39   // Code
        );
}

/**
 * Remove forum permissions. It is initialized only once.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} forumCategoryId The sql params.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var removeForumPermissions = function (api, userId, forumCategoryId, next) {

    if (api.config.general.grantForumAccess !== true || forumCategoryId === 0) {
        next();
        return;
    }

    if (forumCategoryId === null) {
        api.log('Could not find forum category ' + forumCategoryId, 'error');
        next(new Error('Could not find forum category ' + forumCategoryId));
        return;
    }

    api.log('start to remove user ' + userId + ' from forum category ' +  forumCategoryId + '.');
    async.waterfall([
        function (cb) {
            api.challengeHelper.getForumWrapper(api, cb);
        }, function (forumWrapper, cb) {
            forumWrapper.removeRole(userId, "Software_Users_" + forumCategoryId, cb);
        }, function (forumWrapper, cb) {
            forumWrapper.removeRole(userId, "Software_Moderators_" + forumCategoryId, cb);
        }, function (forumWrapper, cb) {
            forumWrapper.removeUserPermission(userId, forumCategoryId, cb);
        }, function (forumWrapper, cb) {
            forumWrapper.deleteCategoryWatch(userId, forumCategoryId, cb);
        }
    ], function (err) {
        if (err) {
            next(err);
            return;
        }
        next();
    });
};

/**
 * Unregister a development (software) challenge for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Object} sqlParams The sql params.
 * @param {Object} unregisterInfo The data used to do unregistration.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var unregisterChallenge = function (api, userId, sqlParams, unregisterInfo, dbConnectionMap, next) {
    async.series([
        function (cb) {
            if (sqlParams.isStudio || isProjectResultCategory(sqlParams.categoryId)) {
                api.dataAccess.executeQuery("delete_challenge_result", sqlParams, dbConnectionMap, cb);
            } else {
                cb();
            }

        }, function (cb) {

            if (_.size(unregisterInfo.userChallengeResources) < 1) {
                api.log("Could not find user challenge resource", 'error');
                cb(new Error('Could not find user challenge resource'));
                return;
            }
            var submitterRoleResourceId =  _.filter(unregisterInfo.userChallengeResources, function (resource) {
                return resource.resource_role_id === SUBMITTER_RESOURCE_ROLE_ID;
            })[0].resource_id;

            api.dataAccess.executeQuery("delete_challenge_resources", {resourceId : submitterRoleResourceId}, dbConnectionMap, cb);
        }, function (cb) {

            api.challengeHelper.aduitResourceAddition(api, userId, sqlParams.challengeId, SUBMITTER_RESOURCE_ROLE_ID, PROJECT_USER_AUDIT_DELETE_TYPE, dbConnectionMap, cb);
        }, function (cb) {

            if (_.size(unregisterInfo.userChallengeResources)  === 1 && unregisterInfo.userChallengeResources[0].resource_role_id === SUBMITTER_RESOURCE_ROLE_ID) { // Only remove forum permissions if the user has no other roles left.
                if (unregisterInfo.challengeForum.length === 0) {
                    api.log("Could not find user challenge forum", 'error');
                    cb(new Error('Could not find user challenge forum'));
                    return;
                }
                var forumCategoryId = parseInt(unregisterInfo.challengeForum[0].forum_category_id, 10);
                removeForumPermissions(api, userId, forumCategoryId, cb);
            }
            cb();
        }
    ], next);
};

/**
 * The action to unregister a challenge for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Object} connection The connection for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var unregisterChallengeAction = function (api, connection, next) {

    var helper = api.helper,
        sqlParams = {},
        userId = connection.caller.userId,
        challengeId = Number(connection.params.challengeId),

        execQuery = function (name) {
            return function (cbx) {
                api.dataAccess.executeQuery(name, sqlParams, connection.dbConnectionMap, cbx);
            };
        };

    async.waterfall([
        function (cb) {

            //Simple validations of the incoming parameters
            var error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxInt(challengeId, 'challengeId') ||
                helper.checkMember(connection, 'You don\'t have the authority to access this. Please login.');

            if (error) {
                cb(error);
                return;
            }

            //Check if the user passes validations for joining the challenge
            sqlParams.userId = userId;
            sqlParams.challengeId = challengeId;

            api.dataAccess.executeQuery("challenge_unregistration_validations", sqlParams, connection.dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {

                cb(new NotFoundError('No such challenge exists.'));
            } else if (!rows[0].reg_open) {

                cb(new ForbiddenError('You cannot unregister since registration phase is closed.'));
            } else if (!rows[0].user_has_submitter_resource_role) {

                cb(new ForbiddenError('You are not registered for this challenge.'));
            }

            sqlParams.categoryId = rows[0].category_id;
            sqlParams.isStudio =  rows[0].is_studio;

            async.series({
                userChallengeResources: execQuery('get_user_challenge_resource'),
                challengeForum: execQuery('get_challenge_forum')
            }, cb);

        },
        function (result, cb) {
            unregisterChallenge(api, userId, sqlParams, result, connection.dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            api.helper.handleError(api, connection, err);
        } else {
            api.log("unregister the challenge succeeded.", 'debug');
            connection.response = {message : "ok"};
        }
        next(connection, true);
    });

};

/**
 * The API to unregister a challenge for the current logged-in user.
 */
exports.unregisterChallenge = {
    name: "unregisterChallenge",
    description: "unregisterChallenge",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled : false,
    transaction: 'write',
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute unregisterChallenge#run", 'debug');
            unregisterChallengeAction(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};


