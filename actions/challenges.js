/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.18
 * @author Sky_, mekanizumu, TCSASSEMBLER, freegod, Ghost_141, kurtrips, xjtufreeman, ecnu_haozi, hesibo, LazyChild
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * 1. add stub for Get Studio Challenge Detail
 * changes in 1.2:
 * 1. Add an optional parameter to search challenge api - cmc
 * 2. Display cmc value search challenge and challenge detail API response.
 * 3. Remove challenge description from search challenge API response.
 * changes in 1.3:
 * 1. move studio API to separated file
 * changes in 1.4:
 *  - Use empty result set instead of 404 error in get challenges API.
 * changes in 1.5:
 * 1. Update the logic when get results from database since the query has been updated.
 * changes in 1.6:
 * merge the backend logic of search software challenges and studio challenges together.
 * changes in 1.7:
 * support private challenge for get software/studio challenge detail api.
 * changes in 1.8:
 * Added methods for getting terms of use by challenge or directly by id
 * changes in 1.9:
 * support private challenge search for search software/studio/both challenges api.
 * changes in 1.10:
 * Added method for uploading submission to a develop challenge
 * changes in 1.11:
 * Added 'private_description_text' field for copilot challenge details api
 * changes in 1.12
 * refactor out the getChallengeTerms functionality into initializers/challengeHelper.js.
 * changes in 1.13:
 * add API for checkpoint results for software and studio
 * changes in 1.14:
 * move get terms of use API to terms.js
 * changes in 1.15:
 * Change the open and active status filter behaviour. OPEN for only reg phase is open, ACTIVE for reg is closed and
 * the challenge status is active.
 * changes in 1.16:
 * add studio checkpoint submissions and submitter count
 * changes in 1.17:
 * add API for submitting to design challenge
 * changes in 1.18:
 * add clientSelection flag in studio results
 */
"use strict";
/*jslint stupid: true, unparam: true, continue: true */

require('datejs');
var fs = require('fs');
var async = require('async');
var S = require('string');
var _ = require('underscore');
var extend = require('xtend');
var request = require('request');
var AdmZip = require('adm-zip');
var archiver = require('archiver');
var mkdirp = require('mkdirp');

var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

var RequestTooLargeError = require('../errors/RequestTooLargeError');

/**
 * Represents the sort column value. This value will be used in log, check, get information from request etc.
 */
var SORT_COLUMN = "sortColumn";

/**
 * Represents the default sort column.
 */
var DEFAULT_SORT_COLUMN = "challengeName";

/**
 * Represents a predefined list of valid query parameter for all challenge types.
 */
var ALLOWABLE_QUERY_PARAMETER = [
    "listType", "challengeType", "challengeName", "projectId", SORT_COLUMN,
    "sortOrder", "pageIndex", "pageSize", "prizeLowerBound", "prizeUpperBound", "cmcTaskId", 'communityId',
    "submissionEndFrom", "submissionEndTo"];

/**
 * Represents a predefined list of valid sort column for active challenge.
 */
var ALLOWABLE_SORT_COLUMN = [
    "challengeName", "challengeType", "challengeId", "cmcTaskId", "registrationEndDate",
    "submissionEndDate", "finalFixEndDate", "prize1", "currentStatus", "digitalRunPoints"
];

/**
 * Represents a ListType enum
 */
var ListType = { ACTIVE: "ACTIVE", OPEN: "OPEN", UPCOMING: "UPCOMING", PAST: "PAST" };

/**
 * Represents a predefined list of valid list type.
 */
var ALLOWABLE_LIST_TYPE = [ListType.ACTIVE, ListType.OPEN, ListType.UPCOMING, ListType.PAST];

/**
 * Represents Percentage of Placement Points for digital run
 */
var DR_POINT = [[1], [0.7, 0.3], [0.65, 0.25, 0.10], [0.6, 0.22, 0.1, 0.08], [0.56, 0.2, 0.1, 0.08, 0.06]];

/**
 * Max value for integer
 */
var MAX_INT = 2147483647;

/**
 * The list type and registration phase status map.
 */
var LIST_TYPE_REGISTRATION_STATUS_MAP = {};
LIST_TYPE_REGISTRATION_STATUS_MAP[ListType.ACTIVE] = [2, 3];
LIST_TYPE_REGISTRATION_STATUS_MAP[ListType.OPEN] = [2];
LIST_TYPE_REGISTRATION_STATUS_MAP[ListType.UPCOMING] = [1];
LIST_TYPE_REGISTRATION_STATUS_MAP[ListType.PAST] = [3];

/**
 * The list type and project status map.
 */
var LIST_TYPE_PROJECT_STATUS_MAP = {};
LIST_TYPE_PROJECT_STATUS_MAP[ListType.ACTIVE] = [1];
LIST_TYPE_PROJECT_STATUS_MAP[ListType.OPEN] = [1];
LIST_TYPE_PROJECT_STATUS_MAP[ListType.UPCOMING] = [2];
LIST_TYPE_PROJECT_STATUS_MAP[ListType.PAST] = [4, 5, 6, 7, 8, 9, 10, 11];

/**
 * This copilot posting project type id
 */
var COPILOT_POSTING_PROJECT_TYPE = 29;

/**
 * Max and min date value for date parameter.
 * @type {string}
 */
var MIN_DATE = '1900-1-1';
var MAX_DATE = '9999-1-1';

/**
 * The date format for input date parameter startDate and enDate.
 * Dates like 2014-01-29 and 2014-1-29 are valid
 */
var DATE_FORMAT = 'YYYY-M-D';

/**
 * If the user is a copilot
 */
var isCopilot = false;
/**
 * This method will used to check the query parameter and sort column of the request.
 *
 * @param {Object} helper - the helper.
 * @param {String} type - the challenge type.
 * @param {Object} queryString - the query string object
 * @param {String} sortColumn - the sort column from the request.
 */
function checkQueryParameterAndSortColumn(helper, type, queryString, sortColumn) {
    var allowedQuery = helper.getLowerCaseList(ALLOWABLE_QUERY_PARAMETER),
        allowedSort = helper.getLowerCaseList(ALLOWABLE_SORT_COLUMN),
        currentQuery = helper.getLowerCaseList(Object.keys(queryString)),
        error;
    currentQuery.forEach(function (n) {
        if (allowedQuery.indexOf(n) === -1) {
            error = error ||
                new IllegalArgumentError("The query parameter contains invalid parameter for challenge type '" +
                    type + "'.");
        }
    });
    if (allowedSort.indexOf(sortColumn.toLowerCase()) === -1) {
        error = error || new IllegalArgumentError("The sort column '" + sortColumn +
            "' is invalid for challenge type '" + type + "'.");
    }
    return error;
}


/**
 * This method is used to validate input parameter of the request.
 * @param {Object} helper - the helper.
 * @param {Object} caller - the caller object.
 * @param {Object} challengeType - the challenge type object.
 * @param {Object} query - the query string.
 * @param {Object} filter - the filter.
 * @param {Number} pageIndex - the page index.
 * @param {Number} pageSize - the page size.
 * @param {String} sortColumn - the sort column.
 * @param {String} sortOrder - the sort order.
 * @param {String} type - the type of challenge.
 * @param {Object} dbConnectionMap - the database connection map.
 * @param {Function<err>} callback - the callback function.
 */
function validateInputParameter(helper, caller, challengeType, query, filter, pageIndex, pageSize, sortColumn, sortOrder, type, dbConnectionMap, callback) {
    var error = helper.checkContains(['asc', 'desc'], sortOrder.toLowerCase(), "sortOrder") ||
            helper.checkPageIndex(pageIndex, "pageIndex") ||
            helper.checkPositiveInteger(pageSize, "pageSize") ||
            helper.checkMaxNumber(pageSize, MAX_INT, 'pageSize') ||
            helper.checkMaxNumber(pageIndex, MAX_INT, 'pageIndex') ||
            helper.checkContains(ALLOWABLE_LIST_TYPE, type.toUpperCase(), "type") ||
            checkQueryParameterAndSortColumn(helper, type, query, sortColumn);

    if (_.isDefined(query.communityId)) {
        if (!_.isDefined(caller.userId)) {
            error = error || new BadRequestError('The caller is not passed.');
        }
        error = error || helper.checkPositiveInteger(Number(filter.communityId), 'communityId') ||
            helper.checkMaxNumber(Number(filter.communityId), MAX_INT, 'communityId');
    }

    if (_.isDefined(filter.projectId)) {
        error = error || helper.checkPositiveInteger(Number(filter.projectId), "projectId");
    }
    if (_.isDefined(filter.prizeLowerBound)) {
        error = error || helper.checkNonNegativeNumber(Number(filter.prizeLowerBound), "prizeLowerBound");
    }
    if (_.isDefined(filter.prizeUpperBound)) {
        error = error || helper.checkNonNegativeNumber(Number(filter.prizeUpperBound), "prizeUpperBound");
    }
    if (_.isDefined(filter.submissionEndFrom)) {
        error = error || helper.validateDate(filter.submissionEndFrom, 'submissionEndFrom', DATE_FORMAT);
    }
    if (_.isDefined(filter.submissionEndTo)) {
        error = error || helper.validateDate(filter.submissionEndTo, 'submissionEndTo', DATE_FORMAT);
    }
    if (error) {
        callback(error);
        return;
    }
    if (_.isDefined(query.challengeType)) {
        helper.isChallengeTypeValid(query.challengeType, dbConnectionMap, challengeType, callback);
    } else {
        callback();
    }
}

/**
 * This method will set up filter for sql query.
 *
 * @param {Object} filter - the filter from http request.
 * @param {Object} sqlParams - the parameters for sql query.
 */
function setFilter(filter, sqlParams) {
    sqlParams.challengeName = "%";
    sqlParams.prilower = 0;
    sqlParams.priupper = MAX_INT;
    sqlParams.tcdirectid = 0;
    sqlParams.communityId = 0;
    sqlParams.submissionEndFrom = MIN_DATE;
    sqlParams.submissionEndTo = MAX_DATE;

    if (_.isDefined(filter.challengeType)) {
        sqlParams.categoryName = filter.challengeType.toLowerCase();
    }
    if (_.isDefined(filter.challengeName)) {
        sqlParams.challengeName = "%" + filter.challengeName.toLowerCase() + "%";
    }
    if (_.isDefined(filter.prizeLowerBound)) {
        sqlParams.prilower = filter.prizeLowerBound.toLowerCase();
    }
    if (_.isDefined(filter.prizeUpperBound)) {
        sqlParams.priupper = filter.prizeUpperBound.toLowerCase();
    }
    if (_.isDefined(filter.projectId)) {
        sqlParams.tcdirectid = filter.projectId;
    }
    if (_.isDefined(filter.cmcTaskId)) {
        sqlParams.cmc = filter.cmcTaskId;
    }
    if (_.isDefined(filter.communityId)) {
        sqlParams.communityId = filter.communityId;
    }
    if (_.isDefined(filter.submissionEndFrom)) {
        sqlParams.submissionEndFrom = filter.submissionEndFrom;
    }
    if (_.isDefined(filter.submissionEndTo)) {
        sqlParams.submissionEndTo = filter.submissionEndTo;
    }
}

/**
 * Convert null string or if string is equal to "null"
 * @param {String} str - the string to convert.
 * @return {String} converted string
 */
function convertNull(str) {
    if (!str || str === "null") {
        return "";
    }
    return str;
}


/**
 * Format date
 * @param {Date} date date to format
 * @return {String} formatted date
 */
function formatDate(date) {
    if (!date) {
        return "";
    }
    return date;
}

/**
 * This method will get data from the query result.
 *
 * @param {Array} src - the query result.
 * @param {Object} helper - the helper object.
 * @return {Array} a list of transferred challenges
 */
function transferResult(src, helper) {
    var ret = [];
    src.forEach(function (row) {
        var challenge = {
            challengeType : row.challenge_type,
            challengeName : row.challenge_name,
            challengeId : row.challenge_id,
            projectId : row.project_id,
            forumId : row.forum_id,
            eventId: row.event_id,
            eventName: row.event_name,
            platforms: _.isDefined(row.platforms) ? row.platforms.split(', ') : [],
            technologies: _.isDefined(row.technology) ? row.technology.split(', ') : [],
            numSubmissions : row.num_submissions,
            numRegistrants : row.num_registrants,
            screeningScorecardId : row.screening_scorecard_id,
            reviewScorecardId : row.review_scorecard_id,
            cmcTaskId : convertNull(row.cmc_task_id),
            numberOfCheckpointsPrizes : row.number_of_checkpoints_prizes,
            topCheckPointPrize : convertNull(row.top_checkpoint_prize),
            postingDate : formatDate(row.posting_date),
            registrationEndDate : formatDate(row.registration_end_date),
            checkpointSubmissionEndDate : formatDate(row.checkpoint_submission_end_date),
            submissionEndDate : formatDate(row.submission_end_date)
        }, i, prize;

        if (row.appeals_end_date) {
            challenge.appealsEndDate = formatDate(row.appeals_end_date);
        }
        if (row.final_fix_end_date) {
            challenge.finalFixEndDate = formatDate(row.final_fix_end_date);
        }

        //use xtend to preserve ordering of attributes
        challenge = extend(challenge, {
            currentPhaseEndDate : formatDate(row.current_phase_end_date),
            currentPhaseRemainingTime : row.current_phase_remaining_time,
            currentStatus : row.current_status,
            currentPhaseName : convertNull(row.current_phase_name),
            digitalRunPoints: row.digital_run_points,
            prize: [],
            reliabilityBonus: helper.getReliabilityBonus(row.prize1),
            challengeCommunity: row.is_studio ? 'design' : 'develop'
        });

        for (i = 1; i < 10; i = i + 1) {
            prize = row["prize" + i];
            if (prize && prize !== -1) {
                challenge.prize.push(prize);
            }
        }

        ret.push(challenge);
    });
    return ret;
}

/**
 * Check input data.
 * Verify challengeId is correct number.
 * It exists and it's studio or software.
 * User has permissions to this challenge.
 * @param {Object} api The api object that is used to access the global infrastructure.
 * @param {Object} connection The connection object for the current request.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Number} challengeId the challenge id.
 * @param {Boolean} isStudio true if challenge is studio challenge, false if software.
 * @param {Function<err>} callback the callback function. It will pass error if any information are invalid.
 * @since 1.10
 */
function validateChallenge(api, connection, dbConnectionMap, challengeId, isStudio, callback) {
    var error, sqlParams, helper = api.helper;
    async.waterfall([
        function (cb) {
            error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxNumber(challengeId, MAX_INT, 'challengeId');
            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                challengeId: challengeId,
                user_id: connection.caller.userId || 0
            };
            async.parallel({
                accessibility: function (cbx) {
                    api.dataAccess.executeQuery('check_user_challenge_accessibility', sqlParams, dbConnectionMap, cbx);
                },
                exists:  function (cbx) {
                    api.dataAccess.executeQuery('check_challenge_exists', sqlParams, dbConnectionMap, cbx);
                }
            }, cb);
        }, function (res, cb) {
            if (res.exists.length === 0 || Boolean(res.exists[0].is_studio) !== isStudio) {
                cb(new NotFoundError("Challenge not found."));
                return;
            }
            var access = res.accessibility[0];
            if (access.is_private && !access.has_access && connection.caller.accessLevel !== "admin") {
                if (connection.caller.accessLevel === "anon") {
                    cb(new UnauthorizedError());
                } else {
                    cb(new ForbiddenError());
                }
                return;
            }
            cb();
        }
    ], callback);
}

/**
 * This is the function that actually search challenges
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {String} community - The community string that represent which challenge to search.
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var searchChallenges = function (api, connection, dbConnectionMap, community, next) {
    var helper = api.helper,
        query = connection.rawConnection.parsedURL.query,
        caller = connection.caller,
        copyToFilter = ["challengeType", "challengeName", "projectId", "prizeLowerBound",
            "prizeUpperBound", "cmcTaskId", 'communityId', "submissionEndFrom", "submissionEndTo"],
        sqlParams = {},
        filter = {},
        pageIndex,
        pageSize,
        sortColumn,
        sortOrder,
        listType,
        prop,
        result = {},
        total,
        challengeType,
        queryName,
        challenges;
    for (prop in query) {
        if (query.hasOwnProperty(prop)) {
            query[prop.toLowerCase()] = query[prop];
        }
    }

    switch (community) {
    case helper.studio.community:
        challengeType = helper.studio;
        break;
    case helper.software.community:
        challengeType = helper.software;
        break;
    case helper.both.community:
        challengeType = helper.both;
        break;
    }

    sortOrder = query.sortorder || "asc";
    sortColumn = query.sortcolumn || DEFAULT_SORT_COLUMN;
    listType = (query.listtype || ListType.OPEN).toUpperCase();
    pageIndex = Number(query.pageindex || 1);
    pageSize = Number(query.pagesize || 50);

    copyToFilter.forEach(function (p) {
        if (query.hasOwnProperty(p.toLowerCase())) {
            filter[p] = query[p.toLowerCase()];
        }
    });

    async.waterfall([
        function (cb) {
            validateInputParameter(helper, caller, challengeType, query, filter, pageIndex, pageSize, sortColumn, sortOrder, listType, dbConnectionMap, cb);
        }, function (cb) {
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }

            setFilter(filter, sqlParams);
            sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
            sqlParams.pageSize = pageSize;
            sqlParams.sortColumn = sortColumn.toLowerCase();
            sqlParams.sortColumn = helper.getSortColumnDBName(sortColumn.toLowerCase());
            sqlParams.sortOrder = sortOrder.toLowerCase();
            // Set the project type id
            sqlParams.project_type_id = challengeType.category;
            // Set the submission phase status id.
            sqlParams.registration_phase_status = LIST_TYPE_REGISTRATION_STATUS_MAP[listType];
            sqlParams.project_status_id = LIST_TYPE_PROJECT_STATUS_MAP[listType];
            sqlParams.userId = caller.userId || 0;

            // Check the private challenge access
            api.dataAccess.executeQuery('check_eligibility', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (results.length === 0) {
                // Return error if the user is not allowed to a specific group(communityId is set)
                // or any group(communityId is not set).
                cb(new UnauthorizedError('You\'re not belong to this group.'));
                return;
            }

            if (_.isDefined(query.communityId)) {
                // Private challenge only query name.
                queryName = {
                    count: 'search_private_software_studio_challenges_count',
                    challenges: 'search_private_software_studio_challenges'
                };
            } else {
                // Public & Private challenge query name.
                queryName = {
                    count: 'search_software_studio_challenges_count',
                    challenges: 'search_software_studio_challenges'
                };
            }

            async.parallel({
                count: function (cbx) {
                    api.dataAccess.executeQuery(queryName.count, sqlParams, dbConnectionMap, cbx);
                },
                challenges: function (cbx) {
                    api.dataAccess.executeQuery(queryName.challenges, sqlParams, dbConnectionMap, cbx);
                }
            }, cb);
        }, function (results, cb) {
            total = results.count[0].total;
            challenges = results.challenges;
            if (challenges.length === 0) {
                result.data = [];
                result.total = total;
                result.pageIndex = pageIndex;
                result.pageSize = pageIndex === -1 ? total : pageSize;
                cb();
                return;
            }
            result.data = transferResult(challenges, helper);
            result.total = total;
            result.pageIndex = pageIndex;
            result.pageSize = pageIndex === -1 ? total : pageSize;
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
};

/**
 * This is the function that gets challenge details
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Boolean} isStudio - the flag that represent if to search studio challenges.
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var getChallenge = function (api, connection, dbConnectionMap, isStudio, next) {
    var challenge, error, helper = api.helper, sqlParams, challengeType = isStudio ? helper.studio : helper.software,
        caller = connection.caller;
    async.waterfall([
        function (cb) {
            error = helper.checkPositiveInteger(Number(connection.params.contestId), 'contestId') ||
                helper.checkMaxNumber(Number(connection.params.contestId), MAX_INT, 'contestId');
            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                challengeId: connection.params.contestId,
                project_type_id: challengeType.category,
                user_id: caller.userId || 0
            };

            // Do the private check.
            api.dataAccess.executeQuery('check_user_challenge_accessibility', sqlParams, dbConnectionMap, cb);
        }, function (result, cb) {
            if (result[0].is_private && !result[0].has_access) {
                cb(new UnauthorizedError('The user is not allowed to visit the challenge.'));
                return;
            }

            var execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
                };
            };
            if (isStudio) {
                async.parallel({
                    details: execQuery('challenge_details'),
                    registrants: execQuery('challenge_registrants'),
                    checkpoints: execQuery("get_studio_challenge_detail_checkpoints"),
                    submissions: execQuery("get_studio_challenge_detail_submissions"),
                    winners: execQuery("get_studio_challenge_detail_winners"),
                    platforms: execQuery('challenge_platforms'),
                    phases: execQuery('challenge_phases'),
                    documents: execQuery('challenge_documents')
                }, cb);
            } else {
                async.parallel({
                    details: execQuery('challenge_details'),
                    registrants: execQuery('challenge_registrants'),
                    submissions: execQuery('challenge_submissions'),
                    platforms: execQuery('challenge_platforms'),
                    phases: execQuery('challenge_phases'),
                    documents: execQuery('challenge_documents'),
                    copilot: execQuery('check_is_copilot')
                }, cb);
            }
        }, function (results, cb) {
            if (results.details.length === 0) {
                cb(new NotFoundError('Challenge not found.'));
                return;
            }
            if (!isStudio && results.copilot.length) {
                isCopilot = results.copilot[0].user_is_copilot;
            }
            var data = results.details[0], i = 0, prize = 0,
                mapSubmissions = function (results) {
                    var submissions = [], passedReview = 0, drTable, submission = {};
                    if (isStudio) {
                        submissions = _.map(results.submissions, function (item) {
                            return {
                                submissionId: item.submission_id,
                                submitter: item.handle,
                                submissionTime: formatDate(item.create_date)
                            };
                        });
                    } else {
                        results.submissions.forEach(function (item) {
                            if (item.placement) {
                                passedReview = passedReview + 1;
                            }
                        });
                        drTable = DR_POINT[Math.min(passedReview - 1, 4)];
                        submissions = _.map(results.submissions, function (item) {
                            submission = {
                                handle: item.handle,
                                placement: item.placement || "",
                                screeningScore: item.screening_score,
                                initialScore: item.initial_score,
                                finalScore: item.final_score,
                                points: 0,
                                submissionStatus: item.submission_status,
                                submissionDate: formatDate(item.submission_date)
                            };
                            if (submission.placement && drTable.length >= submission.placement) {
                                submission.points = drTable[submission.placement - 1] * results.details[0].digital_run_points;
                            }
                            return submission;
                        });
                    }
                    return submissions;
                },
                mapPlatforms = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    var platforms = [];
                    results.forEach(function (item) {
                        platforms.push(item.name);
                    });
                    return platforms;
                },
                mapPhases = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (item) {
                        return {
                            type: item.type,
                            status: item.status,
                            scheduledStartTime: item.scheduled_start_time,
                            actualStartTime: item.actual_start_time,
                            scheduledEndTime: item.scheduled_end_time,
                            actualendTime: item.actual_end_time
                        };
                    });
                },
                mapRegistrants = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (item) {
                        var registrant = {
                            handle: item.handle,
                            reliability: !_.isDefined(item.reliability) ? "n/a" : item.reliability + "%",
                            registrationDate: formatDate(item.inquiry_date)
                        };
                        if (!isStudio) {
                            registrant.rating = item.rating;
                            registrant.colorStyle = helper.getColorStyle(item.rating);
                        }
                        return registrant;
                    });
                },
                mapPrize = function (results) {
                    var prizes = [];
                    for (i = 1; i < 10; i = i + 1) {
                        prize = results["prize" + i];
                        if (prize && prize !== -1) {
                            prizes.push(prize);
                        }
                    }
                    return prizes;
                },
                mapWinners = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (s) {
                        return {
                            submissionId: s.submission_id,
                            submitter: s.submitter,
                            submissionTime: s.submission_time,
                            points: s.points,
                            rank: s.rank
                        };
                    });
                },
                mapCheckPoints = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (s) {
                        return {
                            submissionId: s.submission_id,
                            submitter: s.handle,
                            submissionTime: s.create_date
                        };
                    });
                },
                mapDocuments = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (item) {
                        return {
                            documentName: item.document_name,
                            url: api.config.documentProvider + item.document_id
                        };
                    });
                };
            challenge = {
                challengeType : data.challenge_type,
                challengeName : data.challenge_name,
                challengeId : data.challenge_id,
                projectId : data.project_id,
                forumId : data.forum_id,
                introduction: data.introduction,
                round1Introduction: data.round_one_introduction,
                round2Introduction: data.round_two_introduction,
                detailedRequirements : isStudio ? data.studio_detailed_requirements : data.software_detailed_requirements,
                finalSubmissionGuidelines : data.final_submission_guidelines,
                screeningScorecardId : data.screening_scorecard_id,
                reviewScorecardId : data.review_scorecard_id,
                cmcTaskId : convertNull(data.cmc_task_id),
                numberOfCheckpointsPrizes : data.number_of_checkpoints_prizes,
                topCheckPointPrize : convertNull(data.top_checkpoint_prize),
                postingDate : formatDate(data.posting_date),
                registrationEndDate : formatDate(data.registration_end_date),
                checkpointSubmissionEndDate : formatDate(data.checkpoint_submission_end_date),
                submissionEndDate : formatDate(data.submission_end_date)
            };

            if (data.project_type === COPILOT_POSTING_PROJECT_TYPE && (isCopilot || helper.isAdmin(caller))) {
                challenge.copilotDetailedRequirements = data.copilot_detailed_requirements;
            }
            if (data.appeals_end_date) {
                challenge.appealsEndDate = formatDate(data.appeals_end_date);
            }
            if (data.final_fix_end_date) {
                challenge.finalFixEndDate = formatDate(data.final_fix_end_date);
            }

            //use xtend to preserve ordering of attributes
            challenge = extend(challenge, {
                submissionLimit : data.submission_limit,
                currentPhaseEndDate : formatDate(data.current_phase_end_date),
                currentStatus : data.current_status,
                currentPhaseName : convertNull(data.current_phase_name),
                currentPhaseRemainingTime : data.current_phase_remaining_time,
                digitalRunPoints: data.digital_run_points,
                reliabilityBonus: helper.getReliabilityBonus(data.prize1),
                challengeCommunity: challengeType.community,
                directUrl : helper.getDirectProjectLink(data.challenge_id),
                technology: data.technology.split(', '),
                prize: mapPrize(data),
                numberOfRegistrants: results.registrants.length,
                registrants: mapRegistrants(results.registrants),
                checkpoints: mapCheckPoints(results.checkpoints),
                submissions: mapSubmissions(results),
                winners: mapWinners(results.winners),
                Documents: mapDocuments(results.documents)
            });

            if (isStudio) {
                delete challenge.finalSubmissionGuidelines;
                delete challenge.reliabilityBonus;
                delete challenge.technology;
                delete challenge.platforms;
            } else {
                challenge.numberOfSubmissions = results.submissions.length;

                if (data.is_reliability_bonus_eligible !== 'true') {
                    delete challenge.reliabilityBonus;
                }
                delete challenge.checkpoints;
                delete challenge.winners;
                delete challenge.introduction;
                delete challenge.round1Introduction;
                delete challenge.round2Introduction;
                delete challenge.submissionLimit;
            }
            challenge.platforms = mapPlatforms(results.platforms);
            challenge.phases = mapPhases(results.phases);
            if (data.event_id !== 0) {
                challenge.event = {id: data.event_id, description: data.event_description, shortDescription: data.event_short_desc};
            }
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = challenge;
        }
        next(connection, true);
    });
};

/**
 * This is the function that handles user's submission for a develop challenge.
 * It handles both checkpoint and final submissions
 * @since 1.9
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var submitForDevelopChallenge = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        ret = {},
        userId = connection.caller.userId,
        challengeId = Number(connection.params.challengeId),
        fileName,
        type = connection.params.type,
        error,
        resourceId,
        userEmail,
        userHandle,
        submissionPhaseId,
        checkpointSubmissionPhaseId,
        uploadId,
        submissionId,
        thurgoodLanguage,
        thurgoodPlatform,
        thurgoodApiKey = process.env.THURGOOD_API_KEY || api.config.thurgoodApiKey,
        thurgoodJobId = null,
        multipleSubmissionPossible,
        savedFilePath = null,
        submissionFile = connection.params.submissionFile;

    async.waterfall([
        function (cb) {
            //Check if the user is logged-in
            if (_.isUndefined(connection.caller) || _.isNull(connection.caller) ||
                    _.isEmpty(connection.caller) || !_.contains(_.keys(connection.caller), 'userId')) {
                cb(new UnauthorizedError("Authentication details missing or incorrect."));
                return;
            }

            //Simple validations of the incoming parameters
            error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxNumber(challengeId, MAX_INT, 'challengeId');

            if (error) {
                cb(error);
                return;
            }

            //Validation for the type parameter
            if (_.isNull(type) || _.isUndefined(type)) {
                type = 'final';
            } else {
                type = type.toLowerCase();
                if (type !== 'final' && type !== 'checkpoint') {
                    cb(new BadRequestError("type can either be final or checkpoint."));
                    return;
                }
            }

            //Simple validations of the incoming parameters
            if (submissionFile.constructor.name !== 'File') {
                cb(new IllegalArgumentError("submissionFile must be a File"));
                return;
            }


            //Validation for the size of the fileName parameter. It should be 256 chars as this is max length of parameter field in submission table.
            fileName = submissionFile.name;
            if (fileName.length > 256) {
                cb(new BadRequestError("The file name is too long. It must be 256 characters or less."));
                return;
            }

            //All basic validations now pass.
            //Check if the backend validations for submitting to the challenge are passed
            sqlParams.userId = userId;
            sqlParams.challengeId = challengeId;

            api.dataAccess.executeQuery("challenge_submission_validations_and_info", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('No such challenge exists.'));
                return;
            }

            if (!rows[0].is_develop_challenge) {
                cb(new BadRequestError('Non-develop challenges are not supported.'));
                return;
            }

            if (!rows[0].is_submission_open && type === 'final') {
                cb(new BadRequestError('Submission phase for this challenge is not open.'));
                return;
            }

            if (!rows[0].is_checkpoint_submission_open && type === 'checkpoint') {
                cb(new BadRequestError('Checkpoint submission phase for this challenge is not open.'));
                return;
            }

            if (_.contains([27, 29], rows[0].project_category_id)) {
                cb(new BadRequestError('Submission to Marathon Matches and Spec Reviews are not supported.'));
                return;
            }

            //Note 1 - this will also cover the case where user is not registered,
            //as the corresponding resource with role = Submitter will be absent in DB.
            //Note 2 - this will also cover the case of private challenges
            //User will have role Submitter only if the user belongs to group of private challenge and is registered.
            if (!rows[0].is_user_submitter_for_challenge) {
                cb(new ForbiddenError('You cannot submit for this challenge as you are not a Submitter.'));
                return;
            }

            resourceId = rows[0].resource_id;
            submissionPhaseId = rows[0].submission_phase_id;
            checkpointSubmissionPhaseId = rows[0].checkpoint_submission_phase_id;
            thurgoodPlatform = rows[0].thurgood_platform;
            thurgoodLanguage = rows[0].thurgood_language;
            userHandle = rows[0].user_handle;
            userEmail = rows[0].user_email;
            multipleSubmissionPossible = rows[0].multiple_submissions_possible;

            //All validations are now complete. Generate the new ids for the upload and submission
            async.parallel({
                submissionId: function (cb) {
                    api.idGenerator.getNextID("SUBMISSION_SEQ", dbConnectionMap, cb);
                },
                uploadId: function (cb) {
                    api.idGenerator.getNextID("UPLOAD_SEQ", dbConnectionMap, cb);
                }
            }, cb);
        }, function (generatedIds, cb) {
            uploadId = generatedIds.uploadId;
            submissionId = generatedIds.submissionId;

            var submissionPath;

            //The file output dir should be overwritable by environment variable
            submissionPath = api.config.submissionDir;

            //The path to save is the folder with the name as <base submission path>
            //The name of the file is the <generated upload id>_<original file name>
            savedFilePath = submissionPath + "/" + uploadId + "_" + fileName;

            //Check the max length of the submission file (if there is a limit)
            if (api.config.submissionMaxSizeBytes > 0) {
                fs.stat(submissionFile.path, function (err, stats) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    if (stats.size > api.config.submissionMaxSizeBytes) {
                        cb(new RequestTooLargeError(
                            "The submission file size is greater than the max allowed size: " + (api.config.submissionMaxSizeBytes / 1024) + " KB."
                        ));
                        return;
                    }
                    cb();
                });
            } else {
                cb();
            }
        }, function (cb) {
            fs.createReadStream(submissionFile.path).pipe(fs.createWriteStream(savedFilePath));

            //Now insert into upload table
            _.extend(sqlParams, {
                uploadId: uploadId,
                userId: userId,
                challengeId: challengeId,
                projectPhaseId: type === 'final' ? submissionPhaseId : checkpointSubmissionPhaseId,
                resourceId: resourceId,
                fileName: fileName
            });
            api.dataAccess.executeQuery("insert_upload", sqlParams, dbConnectionMap, cb);
        }, function(notUsed, cb) {
            //Now check if the contest is a CloudSpokes one and if it needs to submit the thurgood job
            if (!_.isUndefined(thurgoodPlatform) && !_.isUndefined(thurgoodLanguage) && type === 'final') {
                //Make request to the thurgood job api url

                //Prepare the options for the request
                var options = {
                    url: api.config.thurgoodApiUrl,
                    timeout: api.config.thurgoodTimeout,
                    method: 'POST',
                    headers: {
                        'Authorization': 'Token: token=' + thurgoodApiKey
                    },
                    form: {
                        'email': userEmail,
                        'thurgoodLanguage': thurgoodLanguage,
                        'userId': userHandle,
                        'notification': 'email',
                        'codeUrl': api.config.thurgoodCodeUrl + uploadId,
                        'platform': thurgoodPlatform
                    }
                };

                //Make the actual request
                request(options, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var respJson = JSON.parse(body);
                        if (_.has(respJson, 'success') && respJson.success.toLowerCase() === 'true'
                                && _.has(respJson, 'data') && _.has(respJson.data, '_id') && String(respJson.data._id) !== '') {
                            thurgoodJobId = String(respJson.data._id);
                        }
                    }
                    //Even if the request fails, we don't mind. This follows from the strategy used in current code.
                    //In case of error, thurgoodJobId will just be null and the next call will not be made.
                    cb();
                });
            } else {
                cb();
            }
        }, function (cb) {
            //If we created a thurgood job id, then we now submit it.
            if (!_.isNull(thurgoodJobId)) {
                //Make request to the submit thurgood job id api url

                //Prepare the options for the request
                var options = {
                    url: api.config.thurgoodApiUrl + '/' + thurgoodJobId + '/submit',
                    timeout: api.config.thurgoodTimeout,
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Token: token=' + thurgoodApiKey
                    }
                };

                //Make the actual request
                request(options, function () {
                    //Even if the request fails, we don't mind. This follows from the strategy used in current code.
                    //Although this seems counter-intuitive, this is how it is implemented currently in code, and so we stick with it.
                    cb();
                });
            } else {
                cb();
            }
        }, function (cb) {
            //Now we are ready to
            //1) Insert into submission table
            //2) Insert into resource_submission table
            //3) Possibly delete older submissions and uploads by the user, if multiple submissions are not allowed
            _.extend(sqlParams, {
                submissionId: submissionId,
                thurgoodJobId: thurgoodJobId,
                submissionTypeId: type === 'final' ? 1 : 3
            });

            async.series([
                function (cb) {
                    api.dataAccess.executeQuery("insert_submission", sqlParams, dbConnectionMap, function (err, result) {
                        cb(err, result);
                    });
                }, function (cb) {
                    api.dataAccess.executeQuery("insert_resource_submission", sqlParams, dbConnectionMap, function (err, result) {
                        cb(err, result);
                    });
                }, function (cb) {
                    if (!multipleSubmissionPossible) {
                        api.dataAccess.executeQuery("delete_old_submissions", sqlParams, dbConnectionMap, function (err, result) {
                            cb(err, result);
                        });
                    } else {
                        cb();
                    }
                }, function (cb) {
                    if (!multipleSubmissionPossible) {
                        api.dataAccess.executeQuery("delete_old_uploads", sqlParams, dbConnectionMap, function (err, result) {
                            cb(err, result);
                        });
                    } else {
                        cb();
                    }
                }
            ], cb);
        }
    ], function (err) {
        if (err) {
            //If file has been written before error, delete it
            if (!_.isNull(savedFilePath)) {
                //If we are unable to delete, we cannot do anything
                fs.unlink(savedFilePath, null);
            }
            helper.handleError(api, connection, err);
        } else {
            ret = {
                submissionId: submissionId,
                uploadId: uploadId
            };
            connection.response = ret;
        }
        next(connection, true);
    });
};

/**
 * Gets the checkpoint results for studio or software challenge
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Boolean} isStudio True if studio checkpoint, false if software
 * @param {Function<connection, render>} next The callback to be called after this function is done
 * @since 1.10
 */
var getCheckpoint = function (api, connection, dbConnectionMap, isStudio, next) {
    var result = {}, helper = api.helper, challengeId = Number(connection.params.challengeId),
        feedbackQueryName = isStudio ?
                "get_studio_checkpoint_general_feedback" : "get_software_checkpoint_general_feedback",
        sqlParams = {
            challengeId: challengeId,
            user_id: connection.caller.userId || 0,
            projectCategory: isStudio ? helper.studio.category : helper.software.category
        },
        execQuery = function (name) {
            return function (cbx) {
                api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
            };
        };
    async.waterfall([
        function (cb) {
            //whole validation is here
            validateChallenge(api, connection, dbConnectionMap, challengeId, isStudio, cb);
        }, function (cb) {
            async.parallel({
                detail: execQuery('get_checkpoint_detail'),
                feedback: execQuery(feedbackQueryName)
            }, cb);
        }, function (res, cb) {
            var generalFeedback = "", hasGeneralFeedback = true;
            if (res.feedback.length === 0 ||
                    !_.isDefined(res.feedback[0].general_feedback) ||
                    res.feedback[0].general_feedback.trim().length === 0) {
                hasGeneralFeedback = false;
            } else {
                generalFeedback = res.feedback[0].general_feedback || "";
            }
            if (res.detail.length === 0 && !hasGeneralFeedback) {
                cb(new NotFoundError("Checkpoint data not found."));
                return;
            }
            result.checkpointResults = _.map(res.detail, function (ele) {
                return {
                    submissionId: ele.id,
                    feedback: ele.feedback
                };
            });
            result.generalFeedback = generalFeedback;

            if (isStudio) {
                async.parallel({
                    numberOfSubmissions: execQuery("get_studio_challenge_checkpoints_submissions_count"),
                    numberOfPassedScreeningSubmissions: execQuery("get_studio_challenge_checkpoints_passed_screening_submissions_count"),
                    numberOfPassedScreeningUniqueSubmitters: execQuery('get_studio_challenge_checkpoints_passed_screening_submitters_count'),
                    numberOfUniqueSubmitters: execQuery('get_studio_challenge_checkpoints_submitters_count')
                }, cb);
            } else {
                cb(null, cb);
            }
        }, function (res, cb) {
            if (isStudio) {
                result.numberOfSubmissions = res.numberOfSubmissions[0].total;
                result.numberOfPassedScreeningSubmissions = res.numberOfPassedScreeningSubmissions[0].total;
                result.numberOfPassedScreeningUniqueSubmitters = res.numberOfPassedScreeningUniqueSubmitters[0].total;
                result.numberOfUniqueSubmitters = res.numberOfUniqueSubmitters[0].total;
            }
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
};

/**
 * The API for getting challenge terms of use
 */
exports.getChallengeTerms = {
    name: "getChallengeTerms",
    description: "getChallengeTerms",
    inputs: {
        required: ["challengeId"],
        optional: ["role"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
	cacheEnabled : false,
    databases : ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getChallengeTerms#run", 'debug');
            var challengeId = Number(connection.params.challengeId), role = connection.params.role;
            async.waterfall([
                function (cb) {
                    api.challengeHelper.getChallengeTerms(
                        connection,
                        challengeId,
                        role,
                        connection.dbConnectionMap,
                        cb
                    );
                }
            ], function (err, data) {
                if (err) {
                    api.helper.handleError(api, connection, err);
                } else {
                    connection.response = {terms : data};
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This function gets the challenge results for both develop (software) and design (studio) contests.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Boolean} isStudio Whether this is studio challenge (true) or software challenge (false)
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getChallengeResults = function (api, connection, dbConnectionMap, isStudio, next) {
    var helper = api.helper,
        sqlParams = {},
        error,
        challengeId = Number(connection.params.challengeId),
        result = {};

    async.waterfall([
        function (cb) {
            error = helper.checkPositiveInteger(challengeId, "challengeId")
                || helper.checkMaxNumber(challengeId, MAX_INT, 'challengeId');
            if (error) {
                cb(error);
                return;
            }

            sqlParams.challengeId = challengeId;
            api.dataAccess.executeQuery("get_challenge_results_validations", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('Challenge with given id is not found.'));
                return;
            }

            if (rows[0].is_private_challenge) {
                cb(new NotFoundError('This is a private challenge. You cannot view it.'));
                return;
            }

            if (!rows[0].is_challenge_finished) {
                cb(new BadRequestError('You cannot view the results because the challenge is not yet finished or was cancelled.'));
                return;
            }

            if (isStudio) {
                if (rows[0].project_type_id !== 3) {
                    cb(new BadRequestError('Requested challenge is not a design challenge.'));
                    return;
                }
            } else {
                if (!_.contains([1, 2], rows[0].project_type_id)) {
                    cb(new BadRequestError('Requested challenge is not a develop challenge.'));
                    return;
                }
                //Spec Review, Copilot postings, Marathon Matches are not served by this API
                if (_.contains([27, 29, 37], rows[0].project_category_id)) {
                    cb(new BadRequestError('Requested challenge type is not supported.'));
                    return;
                }
            }

            result.challengeCommunity = isStudio ? "design" : "develop";

            var execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
                };
            };

            async.parallel({
                info: execQuery('get_challenge_results'),
                results: execQuery("get_challenge_results_submissions"),
                drPoints: execQuery("get_challenge_results_dr_points"),
                finalFixes: execQuery("get_challenge_results_final_fixes"),
                restrictions: execQuery("get_challenge_restrictions")
            }, cb);

        }, function (res, cb) {
            var infoRow = res.info[0];
            _.extend(result, {
                challengeType: infoRow.project_category_name,
                challengeName: infoRow.component_name,
                challengeId: infoRow.project_id,
                postingDate: infoRow.posting_date,
                challengeEndDate: infoRow.complete_date,
                registrants: infoRow.num_registrations,
                submissions: infoRow.num_submissions,
                submissionsPassedScreening: infoRow.num_valid_submissions
            });

            //This information is only for develop contests
            if (!isStudio) {
                _.extend(result, {
                    submissionsPercentage: +(infoRow.submission_percent).toFixed(2),
                    averageInitialScore: infoRow.avg_raw_score,
                    averageFinalScore: infoRow.avg_final_score
                });
            }

            //Populate the result standings for the contest
            result.results = _.map(res.results, function (el) {
                var resEl = {
                    handle: el.handle,
                    placement: el.placed === 0 ? 'n/a' : el.placed,
                    submissionDate: el.submission_date,
                    registrationDate: el.registration_date
                }, drRowFound;

                if (!isStudio) {
                    _.extend(resEl, {
                        finalScore: el.final_score,
                        screeningScore: el.screening_score,
                        initialScore: el.initial_score
                    });
                } else {
                    _.extend(resEl, {
                        clientSelection: el.mark_for_purchase
                    });
                }


                //In the DR points resultset, find the row with same user_id and use it to set the DR points
                drRowFound = _.find(res.drPoints, function (drEl) {
                    return Number(drEl.user_id) === Number(el.user_id);
                });
                resEl.points = drRowFound === undefined ? 0 : drRowFound.dr_points;

                //Submission Links
                if (isStudio) {
                    if (res.restrictions[0].show_submissions) {
                        resEl.submissionDownloadLink = api.config.designSubmissionLink + el.submission_id + "&submissionType=original";
                        resEl.previewDownloadLink = api.config.designSubmissionLink + el.submission_id + "&submissionType=preview";
                    }
                } else {
                    resEl.submissionDownloadLink = api.config.submissionLink + el.submission_id;
                }

                //Handle
                if (isStudio) {
                    if (res.restrictions[0].show_coders) {
                        resEl.handle = el.handle;
                    }
                } else {
                    resEl.handle = el.handle;
                }

                return resEl;
            });

            //Populate the final fixes
            if (isStudio) {
                if (res.restrictions[0].show_submissions) {
                    result.finalFixes = _.map(res.finalFixes, function (ff) {
                        return api.config.designSubmissionLink + ff.submission_id + "&submissionType=original";
                    });
                }
            } else {
                result.finalFixes = _.map(res.finalFixes, function (ff) {
                    return api.config.submissionLink + ff.submission_id;
                });
            }

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
};


/**
 * The API for getting challenge
 */
exports.getSoftwareChallenge = {
    name: "getSoftwareChallenge",
    description: "getSoftwareChallenge",
    inputs: {
        required: ["contestId"],
        optional: ["refresh"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getChallenge#run", 'debug');
            getChallenge(api, connection, connection.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting studio challenge
 */
exports.getStudioChallenge = {
    name: "getStudioChallenge",
    description: "getStudioChallenge",
    inputs: {
        required: ["contestId"],
        optional: ["refresh"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["tcs_catalog", "tcs_dw"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getStudioChallenge#run", 'debug');
            getChallenge(api, connection, connection.dbConnectionMap, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for searching challenges
 */
exports.searchSoftwareChallenges = {
    name: "searchSoftwareChallenges",
    description: "searchSoftwareChallenges",
    inputs: {
        required: [],
        optional: ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchSoftwareChallenges#run", 'debug');
            searchChallenges(api, connection, connection.dbConnectionMap, 'develop', next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for searching challenges
 */
exports.searchStudioChallenges = {
    name: "searchStudioChallenges",
    description: "searchStudioChallenges",
    inputs: {
        required: [],
        optional: ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchStudioChallenges#run", 'debug');
            searchChallenges(api, connection, connection.dbConnectionMap, 'design', next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Generic API for searching challenges
 */
exports.searchSoftwareAndStudioChallenges = {
    name: "searchSoftwareAndStudioChallenges",
    description: "searchSoftwareAndStudioChallenges",
    inputs: {
        required: [],
        optional: ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchSoftwareAndStudioChallenges#run", 'debug');
            searchChallenges(api, connection, connection.dbConnectionMap, 'both', next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * API for getting challenge results for software contests
 */
exports.getSoftwareChallengeResults = {
    name: "getSoftwareChallengeResults",
    description: "getSoftwareChallengeResults",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog", "tcs_dw"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getSoftwareChallengeResults#run", 'debug');
            getChallengeResults(api, connection, connection.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for posting submission to software challenge
 * @since 1.10
 */
exports.submitForDevelopChallenge = {
    name: "submitForDevelopChallenge",
    description: "submitForDevelopChallenge",
    inputs: {
        required: ["challengeId", "submissionFile"],
        optional: ["type"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    cacheEnabled : false,
    databases: ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute submitForDevelopChallenge#run", 'debug');
            submitForDevelopChallenge(api, connection, connection.dbConnectionMap, next);
        }
    }
};

/**
 * Generic API for getting challenge results for studio contests
 */
exports.getStudioChallengeResults = {
    name: "getStudioChallengeResults",
    description: "getStudioChallengeResults",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog", "tcs_dw"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getStudioChallengeResults#run", 'debug');
            getChallengeResults(api, connection, connection.dbConnectionMap, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for software checkpoint
 * @since 1.13
 */
exports.getSoftwareCheckpoint = {
    name: "getSoftwareCheckpoint",
    description: "getSoftwareCheckpoint",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getSoftwareCheckpoint#run", 'debug');
            getCheckpoint(api, connection, connection.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for studio checkpoint
 * @since 1.13
 */
exports.getStudioCheckpoint = {
    name: "getStudioCheckpoint",
    description: "getStudioCheckpoint",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getStudioCheckpoint#run", 'debug');
            getCheckpoint(api, connection, connection.dbConnectionMap, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The URL to use when the font source is the standard topcoder font list
 * @since 1.14
 */
var DEFAULT_FONT_URL = 'community.topcoder.com/studio/the-process/font-policy/';

/**
 * Gets the file type based on the file name extension. Return null if not found.
 * @since 1.14
 *
 * @param {Object} file - The file name
 * @param {Object} fileTypes - The file types from which to read
 */
var getFileType = function (fileName, fileTypes) {
    var lastIndexOfDot = fileName.lastIndexOf('.'),
        extension,
        fileType;
    if (lastIndexOfDot > 0) {
        extension = fileName.substr(lastIndexOfDot + 1).toLowerCase();
        fileType = _.find(fileTypes, function (fileType) {
            return fileType.extension.toLowerCase() === extension;
        });
        if (!_.isUndefined(fileType)) {
            return fileType;
        }
    }
    return null;
};

/**
 * Performs basic submission file validation. Returns non-null value if error exists
 * @since 1.14
 *
 * @param {Object} file - The file to validate
 * @param {Object} fileTypes - The file types from which to read
 * @param {Object} submissionFormat - 'zip' or 'image' based on the file to validate
 */
var basicSubmissionValidation = function (file, fileTypes, submissionFormat) {
    var err = null,
        fileType;
    if (_.isNull(file.type) || new S(file.type).isEmpty()) {
        err = 'File Content Type is not included.'; //actually actionhero automatically throws error in such case
    }
    if (!err && file.size === 0) {
        err = 'File is empty.'; //actually actionhero automatically throws error in such case
    }
    fileType = getFileType(file.name, fileTypes);
    if (!err && fileType === null) {
        err = 'Unknown file type submitted.';
    }
    if (!err && submissionFormat === 'zip' && !fileType.bundled_file) {
        err = 'Invalid file type submitted.';
    }
    if (!err && submissionFormat === 'image' && !fileType.image_file) {
        err = 'Invalid file type submitted.';
    }
    if (!err && submissionFormat === 'zip' && new AdmZip(file.path).getEntries().length === 0) {
        err = 'Empty zip file provided.';
    }
    return err;
};

/**
 * Processes and validates font parameters and returns the result
 * @since 1.14
 *
 * @param {Object} fonts - The font sources
 * @param {Object} fontNames - The font names
 * @param {Object} fontUrls - The font urls
 */
var processFontData = function (fonts, fontNames, fontUrls) {
    var ret = {
        error: null,
        fontsExternalContent: []
    }, f, fn, fu, x;

    if (fonts.length !== fontNames.length || fonts.length !== fontUrls.length) {
        ret.error = 'font parameters are not all of same length.';
        return ret;
    }

    for (x = 0; x < fonts.length; x = x + 1) {
        f = new S(fonts[x]);
        fn = new S(fontNames[x]);
        fu = new S(fontUrls[x]);
        if (f.isEmpty() && fn.isEmpty() && fu.isEmpty()) {
            continue;
        }
        if (f.isEmpty()) {
            ret.error = 'Missing Font Source for index: ' + x;
        } else if (fn.isEmpty()) {
            ret.error = 'Missing Font Name for index: ' + x;
        } else if (!f.isEmpty() && f.toString() !== 'Studio Standard Fonts list' && fu.isEmpty()) {
            ret.error = 'Missing Font URL for index: ' + x;
        }

        if (ret.error) {
            return ret;
        }

        if (fu.isEmpty()) {
            fu = new S(DEFAULT_FONT_URL);
        } else if (!fu.startsWith('http://')) {
            fu = new S('http://' + fu.toString());
        }

        ret.fontsExternalContent.push({
            name: fn.toString() + " (" + f.toString() + ")",
            url: fu.toString()
        });
    }
    return ret;
};

/**
 * Processes and validates stock art parameters and returns the result
 * @since 1.14
 *
 * @param {Object} saNames - The stock art names
 * @param {Object} saUrls - The stock art url
 * @param {Object} saFileNumbers - The stock art file numbers
 */
var processStockArtData = function (saNames, saUrls, saFileNumbers) {
    var ret = {
        error: null,
        sasExternalContent: []
    }, san, sau, safn, x;

    if (saNames.length !== saUrls.length || saUrls.length !== saFileNumbers.length) {
        ret.error = 'stockArt parameters are not all of same length.';
        return ret;
    }

    for (x = 0; x < saNames.length; x = x + 1) {
        san = new S(saNames[x]);
        sau = new S(saUrls[x]);
        safn = new S(saFileNumbers[x]);
        if (san.isEmpty() && sau.isEmpty() && safn.isEmpty()) {
            continue;
        }
        if (san.isEmpty()) {
            ret.error = 'Missing Stock Art name for index: ' + x;
        } else if (sau.isEmpty()) {
            ret.error = 'Missing Stock Art url for index: ' + x;
        } else if (safn.isEmpty()) {
            ret.error = 'Missing Stock Art file number for index: ' + x;
        }

        if (ret.error) {
            return ret;
        }

        if (!sau.startsWith('http://')) {
            sau = new S('http://' + sau.toString());
        }

        ret.sasExternalContent.push({
            name: san.toString(),
            url: sau.toString(),
            fileNumber: safn.toString()
        });
    }
    return ret;
};

/**
 * The directory in the unified zip that contains the source files
 */
var SOURCE_DIR = 'source/';

/**
 * The directory in the unified zip that contains the submission files
 */
var SUBMISSION_DIR = 'submission/'

/**
 * Generates a unified submission zip for design submissions using the 3 files that submitters submit
 * @since 1.14
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} submissionFile - The submission file that submitter submits
 * @param {Object} previewFile - The preview file that submitter submits
 * @param {Object} sourceFile - The source file that submitter submits
 * @param {String} declaration - The generated declaration based on the submitter's comments, fonts and stockArts
 * @param {Integer} userId - The user making the submission
 * @param {Function<err, data>} done - The function to call when done
 */
var generateUnifiedSubmissionFile = function (api, submissionFile, previewFile, sourceFile, declaration, userId, done) {
    var unifiedZipPath = api.config.designSubmissionTmpPath + 'generated_' + new Date().getTime() + '_' + userId + '_unifiedSubmission.zip',
        unifiedZip = fs.createWriteStream(unifiedZipPath),
        submissionOutputPath = api.config.designSubmissionTmpPath + new Date().getTime() + ".zip",
        submissionOutputZip = fs.createWriteStream(submissionOutputPath),
        archive = archiver('zip'),
        submissionArchive = archiver('zip'),
        submissionZip,
        doneCalled = false;

    archive.pipe(unifiedZip);
    submissionArchive.pipe(submissionOutputZip);

    //Go through the submission zip, flatten out the files and put them into the new submission archive
    submissionZip = new AdmZip(submissionFile.path);
    submissionZip.getEntries().forEach(function (zipEntry) {
        if (!zipEntry.isDirectory) {
            //Extract the file to tmp location
            submissionZip.extractEntryTo(zipEntry, api.config.designSubmissionTmpPath, false, true);

            //Read file from tmp location and add to unified zip
            var tmpFileBuf = fs.readFileSync(api.config.designSubmissionTmpPath + zipEntry.name);
            submissionArchive.append(tmpFileBuf, {name: zipEntry.name});

            //Remove the temporary file
            fs.unlinkSync(api.config.designSubmissionTmpPath + zipEntry.name);
        }
    });

    //Write the declaration file to the new submission archive
    submissionArchive.append(declaration, {name: 'declaration.txt'});

    //new submission archive is now done
    submissionArchive.finalize();

    submissionOutputZip.on('finish', function () {
        //Now add the new submission archive, the source file and the preview file to the unified zip
        archive.append(fs.createReadStream(sourceFile.path), {name: SOURCE_DIR + sourceFile.name});
        archive.append(fs.createReadStream(previewFile.path), {name: SUBMISSION_DIR + previewFile.name});
        archive.append(fs.createReadStream(submissionOutputPath), {name: SUBMISSION_DIR + submissionFile.name});

        //The unified zip is now done
        archive.finalize();
    });

    unifiedZip.on('finish', function () {
        if (!doneCalled) {
            doneCalled = true;
            done(null, unifiedZipPath);
        }
    });

    archive.on('error', function (err) {
        if (!doneCalled) {
            doneCalled = true;
            done(err);
        }
    });

    submissionArchive.on('error', function (err) {
        if (!doneCalled) {
            doneCalled = true;
            done(err);
        }
    });
};

/**
 * This is the function that handles user's submission for a design challenge.
 * It handles both normal submissions and final fix submissions
 * @since 1.14
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var submitForDesignChallenge = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        ret = {},
        userId = connection.caller.userId,
        userHandle = connection.caller.handle,
        challengeId = Number(connection.params.challengeId),
        submissionFile = connection.params.submissionFile,
        previewFile = connection.params.previewFile,
        sourceFile = connection.params.sourceFile,
        rank = Number(connection.params.rank),
        comment = connection.params.comment,
        fonts = connection.params.fonts,
        fontNames = connection.params.fontNames,
        fontUrls = connection.params.fontUrls,
        fontInfo,
        type = connection.params.type,
        saNames = connection.params.stockArtNames,
        saUrls = connection.params.stockArtUrls,
        saFileNumbers = connection.params.stockArtFileNumbers,
        saInfo,
        basicInfo,
        fontsExternalContent = [],
        sasExternalContent = [],
        fileTypes,
        filePath,
        systemFileName,
        ids,
        unifiedZipPath,
        error;

    async.waterfall([
        function (cb) {

            //Check if the user is logged-in
            if (connection.caller.accessLevel === 'anon') {
                cb(new UnauthorizedError("Authentication details missing or incorrect."));
                return;
            }

            if (_.isUndefined(comment)) {
                comment = '';
            }

            //Simple validations of the incoming parameters
            if (submissionFile.constructor.name !== 'File') {
                cb(new IllegalArgumentError("submissionFile must be a File"));
                return;
            }
            if (previewFile.constructor.name !== 'File') {
                cb(new IllegalArgumentError("previewFile must be a File"));
                return;
            }
            if (sourceFile.constructor.name !== 'File') {
                cb(new IllegalArgumentError("sourceFile must be a File"));
                return;
            }

            error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxInt(challengeId, 'challengeId');

            if (error) {
                cb(error);
                return;
            }

            if (!_.isUndefined(connection.params.rank)) {
                error = helper.checkMaxInt(rank, 'rank'); //technically it can be 0 or less
            }

            if (error) {
                cb(error);
                return;
            }

            //Validation for the type parameter
            if (_.isUndefined(type)) {
                type = 'submission';
            } else {
                type = type.toLowerCase();
                if (type !== 'submission' && type !== 'checkpoint') {
                    cb(new BadRequestError("type can either be submission or checkpoint"));
                    return;
                }
            }

            //Check if the backend validations for submitting to the challenge are passed
            sqlParams.userId = userId;
            sqlParams.challengeId = challengeId;
            api.dataAccess.executeQuery("design_submission_validations_and_info", sqlParams, dbConnectionMap, cb);

        }, function (rows, cb) {
            basicInfo = rows;

            if (basicInfo.length === 0) {
                cb(new NotFoundError('No such challenge exists.'));
                return;
            }

            if (!basicInfo[0].is_design_challenge) {
                cb(new BadRequestError('Non-design challenges are not supported.'));
                return;
            }

            var now = new Date();
            if (!basicInfo[0].is_active || now < new Date(basicInfo[0].start_time) || now > new Date(basicInfo[0].end_time)) {
                cb(new BadRequestError('Challenge is not currently open for submission.'));
                return;
            }

            if (type === 'checkpoint' && !basicInfo[0].is_checkpoint_submission_open) {
                cb(new BadRequestError('Challenge is not currently open for checkpoint submission.'));
                return;
            }

            if (!basicInfo[0].is_user_submitter_for_challenge) {
                cb(new ForbiddenError('You are not authorized to submit for this challenge.'));
                return;
            }

            //Process the fonts.
            //actionhero is unable to parse array values in multipart requests.
            //Hence these weird double pipe delimited values which are then split to array.
            fonts = _.isUndefined(fonts) ? [] : fonts.split('||');
            fontNames = _.isUndefined(fontNames) ? [] : fontNames.split('||');
            fontUrls = _.isUndefined(fontUrls) ? [] : fontUrls.split('||');
            if (fonts.length > 0) {
                fontInfo = processFontData(fonts, fontNames, fontUrls);
                if (fontInfo.error) {
                    cb(new BadRequestError(fontInfo.error));
                    return;
                }
                fontsExternalContent = fontInfo.fontsExternalContent;
            } else {
                fontsExternalContent.push({
                    name: "I did not introduce any new fonts",
                    url: DEFAULT_FONT_URL
                });
            }

            //Process the stock art.
            saNames = _.isUndefined(saNames) ? [] : saNames.split('||');
            saUrls = _.isUndefined(saUrls) ? [] : saUrls.split('||');
            saFileNumbers = _.isUndefined(saFileNumbers) ? [] : saFileNumbers.split('||');
            saInfo = processStockArtData(saNames, saUrls, saFileNumbers);
            if (saInfo.error) {
                cb(new BadRequestError(saInfo.error));
                return;
            }
            sasExternalContent = saInfo.sasExternalContent;

            //Get file types used for validation of the zip files
            helper.getFileTypes(api, dbConnectionMap, cb);
        }, function (rows, cb) {
            fileTypes = rows;

            //Perform basic validation of submission, source and preview files
            error = basicSubmissionValidation(sourceFile, fileTypes, 'zip');
            if (error) {
                cb(new BadRequestError(error));
                return;
            }

            error = basicSubmissionValidation(submissionFile, fileTypes, 'zip');
            if (error) {
                cb(new BadRequestError(error));
                return;
            }

            error = basicSubmissionValidation(previewFile, fileTypes, 'image');
            if (error) {
                cb(new BadRequestError(error));
                return;
            }

            //1. Create the directories (if needed) where the submisison will be stored
            //2. Load the template for the declaration file
            async.parallel({
                mkdirRes: function (cbx) {
                    filePath = api.config.designSubmissionsBasePath + challengeId + "/" + userHandle.toLowerCase() + "_" + userId + "/";
                    mkdirp(filePath, cbx);
                },
                declarationTemplate: function (cbx) {
                    fs.readFile('templates/design_submission_declaration', 'utf8', cbx);
                }
            }, cb);
        }, function (res, cb) {
            var compiledDeclarationTemplate = _.template(res.declarationTemplate),
                declaration;

            //Generate the declaration file now
            declaration = compiledDeclarationTemplate({
                fontsExternalContent: fontsExternalContent,
                sasExternalContent: sasExternalContent,
                comment: comment
            });

            //Generate the unified submission file (in temp folder) (No need to validate it more as that would be redundant)
            generateUnifiedSubmissionFile(api, submissionFile, previewFile, sourceFile, declaration, userId, cb);
        }, function (path, cb) {
            unifiedZipPath = path;
            systemFileName = new Date().getTime() + ".zip";

            //Generate the new ids for the upload and submission
            async.parallel({
                submissionId: function (cb) {
                    api.idGenerator.getNextID("SUBMISSION_SEQ", dbConnectionMap, cb);
                },
                uploadId: function (cb) {
                    api.idGenerator.getNextID("UPLOAD_SEQ", dbConnectionMap, cb);
                }
            }, cb);
        }, function (rows, cb) {
            ids = rows;

            //Now we save to database
            _.extend(sqlParams, {
                uploadId: ids.uploadId,
                projectPhaseId: type === 'submission' ? basicInfo[0].submission_phase_id : basicInfo[0].checkpoint_submission_phase_id,
                resourceId: basicInfo[0].resource_id,
                fileName: systemFileName,
                submissionId: ids.submissionId,
                thurgoodJobId: null,
                submissionTypeId: type === 'submission' ? 1 : 3
            });
            async.waterfall([
                function (cbx) {
                    //Save to upload
                    api.dataAccess.executeQuery("insert_upload", sqlParams, dbConnectionMap, cbx);
                },
                function (notUsed, cbx) {
                    //Save to submission
                    api.dataAccess.executeQuery("insert_submission", sqlParams, dbConnectionMap, cbx);
                },
                function (notUsed, cbx) {
                    //Save to resource submission
                    api.dataAccess.executeQuery("insert_resource_submission", sqlParams, dbConnectionMap, cbx);
                },
                function (notUsed, cbx) {
                    //Set rank if needed
                    if (!_.isUndefined(connection.params.rank)) {
                        var maxRank;
                        async.waterfall([
                            function (cby) {
                                //Get user's submissions max rank
                                api.dataAccess.executeQuery("get_resource_submissions_max_rank", sqlParams, dbConnectionMap, cby);
                            },
                            function (rows, cby) {
                                maxRank = rows[0].max_rank;
                                if (rank < 1) {
                                    rank = 1;
                                } else if (rank > maxRank) {
                                    rank = maxRank + 1;
                                }
                                //Update the other submissions' rank
                                sqlParams.minRank = rank;
                                api.dataAccess.executeQuery("submissions_increment_rank", sqlParams, dbConnectionMap, cby);
                            },
                            function (notUsed, cby) {
                                //Se this submission's rank
                                sqlParams.userRank = rank;
                                api.dataAccess.executeQuery("set_submission_rank", sqlParams, dbConnectionMap, cby);
                            }
                        ], cbx);
                    } else {
                        cbx(null, null);
                    }
                }
            ], cb);
        }, function (notUsed, cb) {
            //Copy the unified zip from the temp folder into the actual folder
            fs.createReadStream(unifiedZipPath).pipe(fs.createWriteStream(filePath + systemFileName));
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            ret = {
                submissionId: ids.submissionId,
                uploadId: ids.uploadId
            };
            connection.response = ret;
        }
        next(connection, true);
    });

};


/**
 * The API for posting submission to design challenge
 * @since 1.14
 */
exports.submitForDesignChallenge = {
    name: "submitForDesignChallenge",
    description: "submitForDesignChallenge",
    inputs: {
        required: ["challengeId", "submissionFile", "previewFile", "sourceFile"],
        optional: ["type", "fonts", "fontNames", "fontUrls", "stockArtNames", "stockArtUrls", "stockArtFileNumbers", "rank", "comment"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    cacheEnabled : false,
    databases: ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute submitForDesignChallenge#run", 'debug');
            submitForDesignChallenge(api, connection, connection.dbConnectionMap, next);
        }
    }
};

