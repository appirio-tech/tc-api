/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * Changes in version 1.1 (Module Assembly - Topcoder NodeJS Active and Upcoming Data Science Challenge API):
 *  - Added the logic for active / upcoming data science challenges.
 *
 * @version 1.1
 * @author isv, TCASSEMBLER
 */
/*jslint node: true, nomen: true */

"use strict";

var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * A value of 'pageIndex' request parameter to indicate that no paging of returned data is required.
 */
var NO_PAGING = -1;

/**
 * A value of 'sortingOrder' request parameter to indicate that sorting in ascending order is requested.
 */
var SORTING_ORDER_ASCENDING = 'asc';

/**
 * A value of 'sortingOrder' request parameter to indicate that sorting in descending order is requested.
 */
var SORTING_ORDER_DESCENDING = 'desc';

/**
 * A list of names for columns in Past Data Science data.  
 */
var PAST_CHALLENGES_DATA_COLUMN_NAMES = ['challengetype', 'challengename', 'challengeid', 'numsubmissions',
    'numregistrants', 'registrationstartdate', 'submissionenddate', 'challengecommunity', 'postingdate'];

/**
 * A format for the dates for Data Science Challenges filter.
 */
var CHALLENGES_FILTER_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * A format for the dates for Data Science Challenges output.
 */
var CHALLENGES_OUTPUT_DATE_FORMAT = 'YYYY-MM-DD HH:mm z';

/**
 * Maximum value for integer number.
 */
var MAX_INT = 2147483647;

/**
 * A name for the column to sort the data for past Data Science challenges by default.
 */
var PAST_CHALLENGES_DEFAULT_SORT_COLUMN = "submissionEndDate";

/**
 * An order to sort the data for past Data Science challenges by default.
 */
var PAST_CHALLENGES_DEFAULT_SORT_ORDER = "desc";

/**
 * Gets the details for the past Data Science challenges and provides it to specified callback. 
 * 
 * @param {Number} pageIndex - an index of the page of the data to be returned or -1 if no paging is required.
 * @param {Number} pageSize - a size of page of the data to be returned or 0 if pageIndex is -1.
 * @param {String} sortingColumnName - a name of the column to sort the data against. Must not be null.
 * @param {String} sortingOrder - a sorting order (either 'asc' or 'desc'). Must not be null.
 * @param {Date} submissionEndFrom - a lower boundary for the submission end date filter. Must not be null.  
 * @param {Date} submissionEndTo - - an upper boundary for the submission end date filter. Must not be null. 
 * @param {Object} api - an action hero api object.
 * @param {Object} connection - a connection object for the current request.
 * @param callback - a callback to be notified on retrieved data matching the specified criteria.
 */
function pastDataScienceChallenges(pageIndex, pageSize, sortingColumnName, sortingOrder, submissionEndFrom,
                                   submissionEndTo, api, connection, callback) {
    if (pageIndex === NO_PAGING) {
        pageIndex = 1;
        pageSize = MAX_INT;
    }

    var sqlParams = {};
    sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
    sqlParams.pageSize = pageSize;
    sqlParams.sortColumn = api.helper.getSortColumnDBName(sortingColumnName);
    sqlParams.sortOrder = sortingOrder;
    sqlParams.submitByFrom = submissionEndFrom;
    sqlParams.submitByTo = submissionEndTo;

    async.parallel({
        total: function (cb) {
            api.dataAccess.executeQuery('past_data_science_challenges_count', sqlParams, connection.dbConnectionMap, cb);
        },
        data: function (cb) {
            api.dataAccess.executeQuery('past_data_science_challenges', sqlParams, connection.dbConnectionMap, cb);
        }
    }, function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results.total[0].total_count, results.data);
        }
    });
}

/**
 * Populate the result.
 * @param data - the data value
 * @param helper - the helper instance
 * @param response - the response.
 * @returns {*} - the response
 * @since 1.1
 */
function populateResult(data, helper, response) {
    _.each(data, function (row) {
        var challenge = {
            challengeType: row.challenge_type,
            challengeName: row.challenge_name,
            challengeId: row.challenge_id,
            numSubmissions: row.num_submissions,
            numRegistrants: row.num_registrants,
            registrationStartDate: helper.formatDateWithTimezone(row.registration_start_date, CHALLENGES_OUTPUT_DATE_FORMAT),
            submissionEndDate: helper.formatDateWithTimezone(row.submission_end_date, CHALLENGES_OUTPUT_DATE_FORMAT),
            challengeCommunity: row.challenge_community,
            postingDate: helper.formatDateWithTimezone(row.posting_date, CHALLENGES_OUTPUT_DATE_FORMAT)
        };
        response.data.push(challenge);
    });

    return response;
}

/**
 * Sets the submission dates.
 * @param connection - the connection instance.
 * @param response - the response instance.
 * @returns {*} the response instance
 * @since 1.1
 */
function setSubmissionDates(connection, response) {
    if (_.isDefined(connection.params.submissionEndFrom)) {
        response.submissionEndFrom = connection.params.submissionEndFrom;
    }
    if (_.isDefined(connection.params.submissionEndTo)) {
        response.submissionEndTo = connection.params.submissionEndTo;
    }

    return response;
}

/**
 * Get data science challenges from database.
 * @param isActive - the active flag.
 * @param submissionEndFrom - the submission from date.
 * @param submissionEndTo - the submission to date.
 * @param api - the api instance
 * @param connection - the connection instance
 * @param callback - the callback function
 * @since 1.1
 */
function getDataScienceChallenges(isActive, submissionEndFrom, submissionEndTo, api, connection, callback) {
    var sqlParams = {};
    sqlParams.submitByFrom = submissionEndFrom;
    sqlParams.submitByTo = submissionEndTo;

    async.waterfall([
        function (cb) {
            api.dataAccess.executeQuery((isActive ? 'active' : 'upcoming') + '_data_science_challenges', sqlParams, connection.dbConnectionMap, cb);
        }
    ], function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results.length, results);
        }
    });
}

/**
 * Set the default submission from date.
 * @param connection - the connection instance
 * @returns {*} the submission from date.
 * @since 1.1
 */
function setSubmissionEndFromDefault(connection) {
    var submissionEndFrom;
    if (_.isDefined(connection.params.submissionEndFrom)) {
        submissionEndFrom = connection.params.submissionEndFrom;
    } else {
        submissionEndFrom = '1900-01-01';
    }

    return submissionEndFrom;
}

/**
 * Set the default submission to date.
 * @param connection - the connection instance
 * @returns {*} the submission to date
 * @since 1.1
 */
function setSubmissionEndToDefault(connection) {
    var submissionEndTo;
    if (_.isDefined(connection.params.submissionEndTo)) {
        submissionEndTo = connection.params.submissionEndTo;
    } else {
        submissionEndTo = '2999-12-31';
    }
    return submissionEndTo;
}

/**
 * Validates the submission dates.
 * @param submissionEndFrom - the submission from date
 * @param submissionEndTo - the submission to date
 * @param helper - the helper instance
 * @returns {*} the validation result
 * @since 1.1
 */
function validateSubmissionDates(submissionEndFrom, submissionEndTo, helper) {
    var err = helper.checkDateFormat(submissionEndFrom, CHALLENGES_FILTER_DATE_FORMAT, 'submissionEndFrom');
    if (err) {
        return err;
    }

    err = helper.checkDateFormat(submissionEndTo, CHALLENGES_FILTER_DATE_FORMAT, 'submissionEndTo');
    if (err) {
        return err;
    }

    err = helper.checkDates(submissionEndFrom, submissionEndTo, 'submissionEndFrom must be before submissionEndTo');
    if (err) {
        return err;
    }
    return null;
}


/**
 * View Past Data Science Challenges API.
 */
exports.pastDataScienceChallenges = {
    name: 'pastDataScienceChallenges',
    description: 'Get the list of past Data Science challenges',
    inputs: {
        required: [],
        optional: ['pageIndex', 'pageSize', 'sortColumn', 'sortOrder', 'submissionEndFrom', 'submissionEndTo']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ['tcs_dw'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute pastDataScienceChallenges#run', 'debug');
            var pageIndex,
                pageSize,
                sortingColumnName,
                sortingOrder,
                submissionEndFrom,
                submissionEndTo,
                err,
                helper = api.helper;

            async.waterfall([
                function (cb) { // Parse and validate request parameters
                    pageIndex = Number(connection.params.pageIndex || 1);
                    pageSize = Number(connection.params.pageSize || 50);
                    sortingOrder = connection.params.sortOrder || PAST_CHALLENGES_DEFAULT_SORT_ORDER;
                    sortingColumnName = connection.params.sortColumn || PAST_CHALLENGES_DEFAULT_SORT_COLUMN;

                    err = helper.checkContains([SORTING_ORDER_ASCENDING, SORTING_ORDER_DESCENDING], sortingOrder.toLowerCase(), "sortOrder")
                        || helper.checkContains(PAST_CHALLENGES_DATA_COLUMN_NAMES, sortingColumnName.toLowerCase(), "sortColumn")
                        || helper.checkPageIndex(pageIndex, "pageIndex")
                        || helper.checkPositiveInteger(pageSize, "pageSize")
                        || helper.checkMaxInt(pageSize, 'pageSize');

                    if (err) {
                        cb(err);
                        return;
                    }

                    submissionEndFrom = setSubmissionEndFromDefault(connection);
                    submissionEndTo = setSubmissionEndToDefault(connection);
                    err = validateSubmissionDates(submissionEndFrom, submissionEndTo, helper);

                    if (err) {
                        cb(err);
                        return;
                    }

                    cb();
                }, function (cb) { // Get the data based on requested parameters once provided parameters are valid
                    pastDataScienceChallenges(pageIndex, pageSize, sortingColumnName, sortingOrder, submissionEndFrom,
                        submissionEndTo, api, connection, cb);
                }
            ], function (err, total, data) {
                if (err) {
                    helper.handleError(api, connection, err);
                } else {
                    // Build the response from the results
                    var response = {};
                    response.total = total;
                    response.data = [];

                    // Copy request parameters for filter into response
                    if (_.isDefined(connection.params.pageIndex)) {
                        response.pageIndex = connection.params.pageIndex;
                    }
                    if (_.isDefined(connection.params.pageSize)) {
                        response.pageSize = connection.params.pageSize;
                    }
                    if (_.isDefined(connection.params.sortColumn)) {
                        response.sortColumn = connection.params.sortColumn;
                    }
                    if (_.isDefined(connection.params.sortOrder)) {
                        response.sortOrder = connection.params.sortOrder;
                    }

                    response = setSubmissionDates(connection, response);
                    connection.response = populateResult(data, helper, response);
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Processes the data science challenges.
 * @param isActive - the active flag, if the active is false, it means upcoming type.
 * @param api - the api instance
 * @param connection - the connection instance
 * @param next - the callback function
 * @since 1.1
 */
function processDataScienceChallenges(isActive, api, connection, next) {
    var submissionEndFrom,
        submissionEndTo,
        err,
        helper = api.helper;

    async.waterfall([
        function (cb) { // Parse and validate request parameters
            submissionEndFrom = setSubmissionEndFromDefault(connection);
            submissionEndTo = setSubmissionEndToDefault(connection);
            err = validateSubmissionDates(submissionEndFrom, submissionEndTo, helper);

            if (err) {
                cb(err);
                return;
            }

            cb();
        }, function (cb) { // Get the data based on requested parameters once provided parameters are valid
            getDataScienceChallenges(isActive, submissionEndFrom, submissionEndTo, api, connection, cb);
        }
    ], function (err, total, data) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            var response = {};
            response.total = total;
            response.data = [];

            response = setSubmissionDates(connection, response);

            connection.response = populateResult(data, helper, response);
        }
        next(connection, true);
    });
}

/**
 * View Active Data Science Challenges API.
 * @since 1.1
 */
exports.activeDataScienceChallenges = {
    name: 'activeDataScienceChallenges',
    description: 'Get the list of active Data Science challenges',
    inputs: {
        required: [],
        optional: ['submissionEndFrom', 'submissionEndTo']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute activeDataScienceChallenges#run', 'debug');
            processDataScienceChallenges(true, api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * View Upcoming Data Science Challenges API.
 * @since 1.1
 */
exports.upcomingDataScienceChallenges = {
    name: 'upcomingDataScienceChallenges',
    description: 'Get the list of upcoming Data Science challenges',
    inputs: {
        required: [],
        optional: ['submissionEndFrom', 'submissionEndTo']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute upcomingDataScienceChallenges#run', 'debug');
            processDataScienceChallenges(false, api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};