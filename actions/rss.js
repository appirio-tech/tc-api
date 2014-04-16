/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Ghost_141
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * valid value for challenge type.
 */
var VALID_CHALLENGE_TYPE = ['develop', 'design', 'data'];

/**
 * Get the challenges RSS information.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function getChallengesRSS(api, connection, next) {
    var result, helper = api.helper,
        dbConnectionMap = connection.dbConnectionMap,
        RSSMaxLength = api.config.general.maxRSSLength,
        positionsRemain = RSSMaxLength,
        challengeType = connection.params.challengeType,
        listType = (connection.params.listType || helper.ListType.OPEN).toUpperCase(),
        copyToResult = function (queryResults) {
            if (positionsRemain > 0) {
                var i, row, res;
                for (i = 0; i < Math.min(positionsRemain, queryResults.length); i += 1) {
                    row = queryResults[i];
                    res = {
                        challengeType: row.challenge_type.trim(),
                        challengeName: row.challenge_name,
                        challengeId: row.challenge_id,
                        detailedRequirements: row.detailed_requirements || '',
                        projectId: row.project_id
                    };
                    if (_.isDefined(row.software_detailed_requirements)) {
                        res.detailedRequirements = row.software_detailed_requirements || '';
                    }
                    if (_.isDefined(row.studio_detailed_requirements)) {
                        res.detailedRequirements = row.studio_detailed_requirements || '';
                    }
                    result.data.push(res);
                }
                positionsRemain -= queryResults.length;
            }
        };
    async.waterfall([
        function (cb) {
            var error;
            if (_.isDefined(challengeType)) {
                error = helper.checkContains(VALID_CHALLENGE_TYPE, challengeType.toLowerCase(), 'challengeType');
            }
            error = error || helper.checkContains(helper.VALID_LIST_TYPE, listType, 'listType');
            if (error) {
                cb(error);
                return;
            }

            challengeType = (challengeType || 'all').toLowerCase();

            async.parallel({
                design: function (cbx) {
                    if (challengeType === 'design' || challengeType === 'all') {
                        api.dataAccess.executeQuery('get_software_studio_challenges_rss',
                            {
                                page_size: RSSMaxLength,
                                project_status_id: helper.LIST_TYPE_PROJECT_STATUS_MAP[listType],
                                project_type_id: helper.studio.category,
                                registration_phase_status: helper.LIST_TYPE_REGISTRATION_STATUS_MAP[listType]
                            }, dbConnectionMap, cbx);
                    } else {
                        cbx();
                    }
                },
                develop: function (cbx) {
                    if (challengeType === 'develop' || challengeType === 'all') {
                        api.dataAccess.executeQuery('get_software_studio_challenges_rss',
                            {
                                page_size: RSSMaxLength,
                                project_status_id: helper.LIST_TYPE_PROJECT_STATUS_MAP[listType],
                                project_type_id: helper.software.category,
                                registration_phase_status: helper.LIST_TYPE_REGISTRATION_STATUS_MAP[listType]
                            }, dbConnectionMap, cbx);
                    } else {
                        cbx();
                    }
                },
                data: function (cbx) {
                    if (challengeType === 'data' || challengeType === 'all') {
                        if (listType === helper.ListType.PAST) {
                            api.dataAccess.executeQuery('get_past_data_challenges_rss', { page_size: RSSMaxLength }, dbConnectionMap, cbx);
                        } else if (listType === helper.ListType.OPEN || listType === helper.ListType.ACTIVE) {
                            api.dataAccess.executeQuery('get_open_data_challenges_rss', { page_size: RSSMaxLength }, dbConnectionMap, cbx);
                        } else {
                            cbx();
                        }
                    } else {
                        cbx();
                    }
                }
            }, cb);
        },
        function (results, cb) {
            result = {
                data: []
            };
            _.compact([results.design, results.develop, results.data]).forEach(function (item) {
                copyToResult(item);
            });
            result.total = result.data.length;
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });
}

/**
 * Get Challenges RSS API.
 */
exports.getChallengesRSS = {
    name: 'getChallengesRSS',
    description: 'getChallengesRSS',
    inputs: {
        required: [],
        optional: ['listType', 'challengeType']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ['informixoltp', 'tcs_catalog', 'topcoder_dw'],
    run: function (api, connection, next) {
        api.log('Execute getChallengesRSS#run', 'debug');
        getChallengesRSS(api, connection, next);
    }
};
