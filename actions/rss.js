/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Ghost_141
 * Changes in 1.1:
 * - Add technologies and platforms filter.
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * valid value for challenge type.
 */
var VALID_CHALLENGE_TYPE = ['develop', 'design', 'data'];

/**
 * The technology filter for challenges api.
 * @since 1.1
 */
var TECHNOLOGY_FILTER = ' AND EXISTS (SELECT DISTINCT 1 FROM comp_technology ct WHERE ct.comp_vers_id = pi1.value ' +
    'AND ct.technology_type_id IN (@filter@))';

/**
 * The platform filter for challenges api.
 * @since 1.1
 */
var PLATFORM_FILTER = ' AND EXISTS (SELECT 1 FROM project_platform pp WHERE pp.project_platform_id IN (@filter@) ' +
    'AND p.project_id = pp.project_id)';

/**
 * Add tech filter and platform filter.
 * @param query
 * @param techId
 * @param platformId
 * @param helper
 * @returns {*}
 */
function addFilter(query, techId, platformId, helper) {
    if (_.isDefined(techId)) {
        query = helper.editSql(query, TECHNOLOGY_FILTER, techId.join(','));
    }
    if (_.isDefined(platformId)) {
        query = helper.editSql(query, PLATFORM_FILTER, platformId.join(','));
    }
    return query;
}

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
        RSSMaxLength = api.config.tcConfig.maxRSSLength,
        positionsRemain = RSSMaxLength,
        challengeType = connection.params.challengeType,
        technologies = connection.params.technologies,
        techId,
        platforms = connection.params.platforms,
        platformId,
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
                        registrationStartDate: row.registration_start_date,
                        challengeCommunity: row.challenge_community,
                        projectId: row.project_id
                    };
                    if (_.isDefined(row.software_detailed_requirements)) {
                        res.detailedRequirements = row.software_detailed_requirements || '';
                    }
                    if (_.isDefined(row.studio_detailed_requirements)) {
                        res.detailedRequirements = row.studio_detailed_requirements || '';
                    }
                    if (row.project_type_id === helper.studio.category[0]) {
                        res.challengeCommunity = helper.studio.community;
                    } else {
                        res.challengeCommunity = helper.software.community;
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

            challengeType = (challengeType || 'all').toLowerCase();
            cb(error);
        },
        function (cb) {
            if (!_.isUndefined(technologies)) {
                helper.getCatalogCachedValue(technologies.split(',').map(function (s) { return s.toLowerCase().toString(); }), dbConnectionMap, 'technologies', cb);
            } else {
                cb(null, null);
            }
        },
        function (id, cb) {
            if (_.isDefined(id)) {
                techId = id;
            }
            if (!_.isUndefined(platforms)) {
                helper.getCatalogCachedValue(platforms.split(',').map(function (s) { return s.toLowerCase().toString(); }), dbConnectionMap, 'platforms', cb);
            } else {
                cb(null, null);
            }
        },
        function (id, cb) {
            if (_.isDefined(id)) {
                platformId = id;
            }
            helper.readQuery('get_software_studio_challenges_rss', cb);
        },
        function (q, cb) {
            q = addFilter(q, techId, platformId, helper);
            // edit the sql
            async.parallel({
                design: function (cbx) {
                    if (challengeType === 'design' || challengeType === 'all') {
                        api.dataAccess.executeSqlQuery(q,
                            {
                                page_size: RSSMaxLength,
                                project_status_id: helper.LIST_TYPE_PROJECT_STATUS_MAP[listType],
                                project_type_id: helper.studio.category,
                                registration_phase_status: helper.LIST_TYPE_REGISTRATION_STATUS_MAP[listType]
                            }, 'tcs_catalog', dbConnectionMap, cbx);
                    } else {
                        cbx();
                    }
                },
                develop: function (cbx) {
                    if (challengeType === 'develop' || challengeType === 'all') {
                        api.dataAccess.executeSqlQuery(q,
                            {
                                page_size: RSSMaxLength,
                                project_status_id: helper.LIST_TYPE_PROJECT_STATUS_MAP[listType],
                                project_type_id: helper.software.category,
                                registration_phase_status: helper.LIST_TYPE_REGISTRATION_STATUS_MAP[listType]
                            }, 'tcs_catalog', dbConnectionMap, cbx);
                    } else {
                        cbx();
                    }
                },
                data: function (cbx) {
                    if (_.isDefined(techId) || _.isDefined(platformId)) {
                        cbx();
                    } else {
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
