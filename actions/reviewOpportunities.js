/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author Sky_, Ghost_141
 * changes in 1.1
 * - Implement the studio review opportunities.
 * changes in 1.2
 * - Implement the general(software & studio) review opportunities.
 * - remove getStudioReviewOpportunities method.
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * Sample result from specification for Review Opportunity Detail
 */
var sampleReviewOpportunity;

/**
 * Sample result from specification for Review Opportunities for algorithms
 */
var sampleAlgorithmsReviewOpportunities;

/**
 * Sample result from specification for Review Opportunity Detail for algorithms
 */
var sampleAlgorithmsReviewOpportunity;


/**
 * The max value for Integer.
 */
var MAX_INT = 2147483647;

var ALLOWABLE_SORT_ORDER = ['asc', 'desc'];

/**
 * The allowed sort column value for search studio review opportunities api.
 */
var STUDIO_ALLOWABLE_SORT_COLUMN = ['challengeName', 'round2ScheduledStartDate', 'round1ScheduledStartDate',
    'reviewType', 'reviewer'];

/**
 * The review type for studio review opportunities api.
 */
var STUDIO_REVIEW_TYPE = ['Screening', 'Spec Review'];

/**
 * The allowed sort column value for search software review opportunities api.
 */
var SOFTWARE_ALLOWABLE_SORT_COLUMN = ['challengeName', 'reviewStart', 'reviewEnd', 'challengeType', 'reviewType',
    'numberOfSubmissions', 'numberOfReviewPositionsAvailable'];

/**
 * The allowed query parameter for search software review opportunities api.
 */
var SOFTWARE_ALLOWABLE_QUERY_PARAMETER = ['reviewStartDate.type', 'reviewStartDate.firstDate',
    'reviewStartDate.secondDate', 'reviewEndDate.type', 'reviewEndDate.firstDate', 'reviewEndDate.secondDate', 'pageSize',
    'pageIndex', 'sortOrder', 'sortColumn', 'challengeName', 'challengeType', 'reviewType', 'reviewPaymentUpperBound',
    'reviewPaymentLowerBound'];

/**
 * The allowed query parameter for search studio review opportunities api.
 */
var STUDIO_ALLOWABLE_QUERY_PARAMETER = ['round1ScheduledStartDate.type', 'round1ScheduledStartDate.firstDate',
    'round1ScheduledStartDate.secondDate', 'round2ScheduledStartDate.type', 'round2ScheduledStartDate.firstDate',
    'round2ScheduledStartDate.secondDate', 'pageSize', 'pageIndex', 'sortOrder', 'sortColumn', 'challengeName',
    'reviewType', 'reviewPaymentUpperBound', 'reviewPaymentLowerBound', 'challengeType'];

/**
 * The review type for software review opportunities api.
 */
var SOFTWARE_REVIEW_TYPE = ['Iterative Review', 'Spec Review', 'Contest Review'];

/**
 * The review application role id for primary reviewer.
 * It wll be used in payment calculation.
 */
var PRIMARY_REVIEW_APPLICATION_ROLE_ID = 1;

/**
 * The review application role id for secondary reviewer.
 * It wll be used in payment calculation.
 */
var SECONDARY_REVIEW_APPLICATION_ROLE_ID = 2;

/**
 * The review application role id for specification reviewer.
 * It wll be used in payment calculation.
 */
var SPECIFICATION_REVIEW_APPLICATION_ROLE_ID = 7;

/**
 * The review application role id for iterative reviewer.
 * It wll be used in payment calculation.
 */
var ITERATIVE_REVIEW_APPLICATION_ROLE_ID = 8;

/**
 * Format the date value to a specific pattern.
 * @param dateValue {String} the date value.
 * @return the empty value or the date value itself.
 */
var formatDate = function (dateValue) {
    if (!dateValue) {
        return '';
    }
    return dateValue;
};

/**
 * This method will calculate the duration between two times. It will only return how many hours between the given time.
 * @param startTime {String} the start time
 * @param endTime {String} the end time
 * @return The duration hours between start time and the end time.
 */
var getDuration = function (startTime, endTime) {
    var s = new Date(startTime), e = new Date(endTime);
    return (e - s) / 1000 / 60 / 60;
};

/**
 * This is the function that retrieve a specific studio review opportunity.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getStudioReviewOpportunity = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, result = {}, sqlParams = {}, challengeId = Number(connection.params.id), error, positions;
    async.waterfall([
        function (cb) {
            error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxNumber(challengeId, MAX_INT, 'challengeId');

            if (error) {
                cb(error);
                return;
            }
            sqlParams.challengeId = challengeId;
            api.dataAccess.executeQuery('get_studio_review_opportunity_phases', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('The studio challenge is not found.'));
                return;
            }
            result.name = rows[0].challenge_name;
            result.Phases = [];
            rows.forEach(function (row) {
                result.Phases.push({
                    name: row.phase_name,
                    start: formatDate(row.start_time),
                    end: formatDate(row.end_time),
                    duration: getDuration(row.start_time, row.end_time) + ' hours'
                });
            });
            api.dataAccess.executeQuery('get_studio_review_opportunity_positions', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length !== 0) {
                positions = 0;
            } else {
                positions = 1;
            }
            result.Positions = [];
            result.Positions.push({
                role: 'Screener',
                positions: positions,
                payment: rows[0].payment
            });
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
 * Create date for filter object from given parameters.
 * @param {Object} helper - the helper object.
 * @param {Object} params - the request parameters.
 * @param {String} dateName - the date name.
 */
var createDate = function (helper, params, dateName) {
    var type = (params[dateName + '.type'] || '').toUpperCase(), date, MIN_DATE, MAX_DATE, now;
    MIN_DATE = '01.01.1900';
    MAX_DATE = '01.01.2999';
    now = new Date();

    // For the unset date filter just return the default date filter - between min date and max date.
    if (!params[dateName + '.type'] && !params[dateName + '.firstDate'] && !params[dateName + '.secondDate']) {
        return {
            type: helper.consts.BETWEEN_DATES,
            firstDate: MIN_DATE,
            secondDate: MAX_DATE
        };
    }

    switch (type) {
    case helper.consts.ON:
        date = {
            type: type,
            firstDate: params[dateName + '.firstDate'],
            secondDate: params[dateName + '.firstDate']
        };
        break;
    case helper.consts.BEFORE:
        date = {
            type: type,
            firstDate: MIN_DATE,
            secondDate: params[dateName + '.firstDate']
        };
        break;
    case helper.consts.AFTER:
        date = {
            type: type,
            firstDate: params[dateName + '.firstDate'],
            secondDate: MAX_DATE
        };
        break;
    case helper.consts.AFTER_CURRENT_DATE:
        date = {
            type: type,
            firstDate: now,
            secondDate: MAX_DATE
        };
        break;
    case helper.consts.BEFORE_CURRENT_DATE:
        date = {
            type: type,
            firstDate: MIN_DATE,
            secondDate: now
        };
        break;
    case helper.consts.BETWEEN_DATES:
        date = {
            type: type,
            firstDate: params[dateName + '.firstDate'],
            secondDate: params[dateName + '.secondDate']
        };
        break;
    default:
        // If you are here, it means the type value is invalid.
        date = {
            type: type,
            firstDate: MIN_DATE,
            secondDate: MAX_DATE
        };
        break;
    }
    return date;
};

/**
 * Validate the input parameter.
 * @param {Object} helper - the api helper.
 * @param {Object} connection - the connection object.
 * @param {Object} filter - the filter object.
 * @param {Boolean} isStudio - The flag that represent which kind of challenge to search.
 * @param {Function} cb - the callback function.
 */
var validateInputParameter = function (helper, connection, filter, isStudio, cb) {

    var pageSize, pageIndex, sortOrder, sortColumn, allowedSortColumn, allowedReviewType, params, allowedQueryParameter,
        queryKeys = helper.getLowerCaseList(Object.keys(connection.rawConnection.parsedURL.query)),
        challengeType = isStudio ? helper.studio : helper.software,
        error;

    params = connection.params;
    pageSize = Number(params.pageSize || 10);
    pageIndex = Number(params.pageIndex || 1);
    sortOrder = params.sortOrder || 'asc';
    sortColumn = params.sortColumn || 'challengeName';
    allowedSortColumn = isStudio ? STUDIO_ALLOWABLE_SORT_COLUMN : SOFTWARE_ALLOWABLE_SORT_COLUMN;
    allowedQueryParameter = helper.getLowerCaseList(isStudio ? STUDIO_ALLOWABLE_QUERY_PARAMETER : SOFTWARE_ALLOWABLE_QUERY_PARAMETER);

    error =
        helper.checkPageIndex(pageIndex, 'pageIndex') ||
        helper.checkPositiveInteger(pageSize, 'pageSize') ||
        helper.checkMaxInt(pageSize, 'pageSize') ||
        helper.checkContains(helper.getLowerCaseList(allowedSortColumn), sortColumn.toLowerCase(), 'sortColumn') ||
        helper.checkContains(helper.getLowerCaseList(ALLOWABLE_SORT_ORDER), sortOrder.toLowerCase(), 'sortOrder');

    queryKeys.forEach(function (n) {
        if (allowedQueryParameter.indexOf(n) === -1) {
            error = error ||
                new IllegalArgumentError('The query parameter contains invalid parameter.');
        }
    });

    filter.challengeName = params.challengeName || '%';
    filter.reviewType = params.reviewType || '';
    filter.reviewPaymentLowerBound = Number(params.reviewPaymentLowerBound) || -1;
    filter.reviewPaymentUpperBound = Number(params.reviewPaymentUpperBound) || helper.MAX_INT;
    filter.reviewStartDate = createDate(helper, params, 'reviewStartDate');
    filter.reviewEndDate = createDate(helper, params, 'reviewEndDate');
    filter.challengeType = (params.challengeType || '').toLowerCase();
    filter.round1ScheduledStartDate = createDate(helper, params, 'round1ScheduledStartDate');
    filter.round2ScheduledStartDate = createDate(helper, params, 'round2ScheduledStartDate');

    if (_.isDefined(params.reviewType)) {
        allowedReviewType = isStudio ? STUDIO_REVIEW_TYPE : SOFTWARE_REVIEW_TYPE;
        error = error || helper.checkContains(helper.getLowerCaseList(allowedReviewType), filter.reviewType.toLowerCase(), 'reviewType');
    }

    if (_.isDefined(params.reviewPaymentLowerBound)) {
        error = error || helper.checkNumber(Number(params.reviewPaymentLowerBound), 'reviewPaymentLowerBound');
    }

    if (_.isDefined(params.reviewPaymentUpperBound)) {
        error = error || helper.checkNumber(Number(params.reviewPaymentUpperBound), 'reviewPaymentUpperBound');
    }

    error = error ||
        helper.checkFilterDate(filter.reviewStartDate, 'reviewStartDate', 'MM.DD.YYYY') ||
        helper.checkFilterDate(filter.reviewEndDate, 'reviewEndDate', 'MM.DD.YYYY') ||
        helper.checkFilterDate(filter.round1ScheduledStartDate, 'round1ScheduledStartDate', 'MM.DD.YYYY') ||
        helper.checkFilterDate(filter.round2ScheduledStartDate, 'round2ScheduledStartDate', 'MM.DD.YYYY');

    if (error) {
        cb(error);
        return;
    }

    // Check the category name last.
    if (_.isDefined(params.challengeType)) {
        helper.isChallengeTypeValid(filter.challengeType, connection.dbConnectionMap, challengeType, cb);
    } else {
        cb();
    }
};

/**
 * Calculate the review payment based on default, adjust payment and review role.
 * @param {Object} defaultPayments - the default payments array.
 * @param {Object} adjustPayments - the adjust payments array.
 * @param {Object} reviewOpp - the review Opportunity item.
 * @param {Number} role - the review application role id.
 * @return {Number} The payment of the determined role.
 */
var calculatePayment = function (defaultPayments, adjustPayments, reviewOpp, role) {
    if (role === 0) {
        return 0.00;
    }
    // filter out the payment for other review opportunities first and other review application role (eg. primary reviewer)
    var defaultPayment = _.filter(defaultPayments, function (item) {
        return item.review_auction_id === reviewOpp.review_auction_id && item.review_application_role_id === role;
    }), adjustPayment = _.filter(adjustPayments, function (item) {
        return item.review_auction_id === reviewOpp.review_auction_id;
    }), payment = 0.00;

    defaultPayment.forEach(function (row) {
        var adjust = _.find(adjustPayment, function (item) { return item.resource_role_id === row.resource_role_id; }),
            defPayment,
            submissionCount = row.submission_count;
        // Fix the submission count. Treat 0 as 1 submission. treat none result as 0 submission.
        if (submissionCount === 0) {
            submissionCount = 1;
        } else if (!submissionCount) {
            submissionCount = 0;
        }
        // Calculate the default payment.
        defPayment = row.fixed_amount + (row.base_coefficient + row.incremental_coefficient * submissionCount) * row.prize;

        // adjust it if necessary.
        if (adjust) {
            // We have adjust payment for this role.
            if (adjust.fixed_amount) {
                payment += Number(adjust.fixed_amount);
            }
            if (adjust.multiplier) {
                payment += Number(defPayment) * Number(adjust.multiplier);
            }
        } else {
            // We don't have adjust payment for this role.
            payment += Number(defPayment);
        }
    });
    return payment;
};

/**
 * Get the review opportunities
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Boolean} isStudio - the flag that represent if to search studio challenge review opportunities.
 * @param {Function} next - the callback function.
 */
var getReviewOpportunities = function (api, connection, isStudio, next) {
    var helper = api.helper, result = {}, sqlParams, dbConnectionMap = connection.dbConnectionMap, pageIndex,
        pageSize, sortOrder, sortColumn, filter = {}, reviewAuctionIds, reviewOpportunities, challengeIds;

    pageSize = Number(connection.params.pageSize || 10);
    pageIndex = Number(connection.params.pageIndex || 1);
    sortOrder = connection.params.sortOrder || 'asc';
    sortColumn = connection.params.sortColumn || 'challengeName';

    async.waterfall([
        function (cb) {
            validateInputParameter(helper, connection, filter, isStudio, cb);
        },
        function (cb) {

            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = helper.MAX_INT;
            }

            sqlParams = {
                sortOrder: sortOrder,
                sortColumn: helper.getSortColumnDBName(sortColumn),
                reviewType: filter.reviewType,
                challengeType: filter.challengeType,
                challengeName: filter.challengeName,
                projectTypeId: isStudio ? helper.studio.category : helper.software.category,
                round1ScheduledStartDateFirstDate: helper.formatDate(filter.round1ScheduledStartDate.firstDate, 'YYYY-MM-DD'),
                round1ScheduledStartDateSecondDate: helper.formatDate(filter.round1ScheduledStartDate.secondDate, 'YYYY-MM-DD'),
                round2ScheduledStartDateFirstDate: helper.formatDate(filter.round2ScheduledStartDate.firstDate, 'YYYY-MM-DD'),
                round2ScheduledStartDateSecondDate: helper.formatDate(filter.round2ScheduledStartDate.secondDate, 'YYYY-MM-DD'),
                reviewStartDateFirstDate: helper.formatDate(filter.reviewStartDate.firstDate, 'YYYY-MM-DD'),
                reviewStartDateSecondDate: helper.formatDate(filter.reviewStartDate.secondDate, 'YYYY-MM-DD'),
                reviewEndDateFirstDate: helper.formatDate(filter.reviewEndDate.firstDate, 'YYYY-MM-DD'),
                reviewEndDateSecondDate: helper.formatDate(filter.reviewEndDate.secondDate, 'YYYY-MM-DD')
            };

            api.dataAccess.executeQuery('search_software_studio_review_opportunities', sqlParams, dbConnectionMap, cb);
        },
        function (results, cb) {
            reviewOpportunities = results;
            var exeQuery = function (suffix) {
                return function (cbx) {
                    api.dataAccess.executeQuery('search_software_studio_review_opportunities_' + suffix,
                        { challengeIds: challengeIds, reviewAuctionIds: reviewAuctionIds }, dbConnectionMap, cbx);
                };
            };
            if (!isStudio) {
                // Get the review Auctions ids and execute payment query.
                if (results.length === 0) {
                    cb(null, null);
                    return;
                }

                reviewAuctionIds = _.map(results, function (row) {
                    return row.review_auction_id;
                });
                challengeIds = _.map(results, function (row) {
                    return row.challenge_id;
                });
                async.parallel({
                    defaultPayment: exeQuery('default_payment'),
                    adjustPayment: exeQuery('adjust_payment')
                }, cb);
            } else {
                //callback
                cb(null, null);
            }
        },
        function (results, cb) {
            var defaultPayment, adjustPayment, pageStart = (pageIndex - 1) * pageSize, primaryRoleId, secondaryRoleId, reviewType;
            result.data = [];
            if (reviewOpportunities.length === 0) {
                result.data = [];
                result.total = 0;
                result.pageIndex = pageIndex;
                result.pageSize = pageIndex === -1 ? 0 : pageSize;
                cb();
                return;
            }

            if (isStudio) {
                // Handle the studio challenge here.
                reviewOpportunities.forEach(function (row) {
                    reviewType = row.review_type.trim();
                    var reviewOpp = {
                        challengeName: row.challenge_name,
                        round1ScheduledStartDate: formatDate(row.round_1_scheduled_start_date),
                        round2ScheduledStartDate: formatDate(row.round_2_scheduled_start_date),
                        reviewerPayment: row.reviewer_payment,
                        reviewer: row.reviewer,
                        reviewType: reviewType
                    };
                    if (reviewType === 'Spec Review') {
                        delete reviewOpp.round2ScheduledStartDate;
                    }
                    result.data.push(reviewOpp);
                });
            } else {
                // Handle the software challenge here.
                defaultPayment = results.defaultPayment;
                adjustPayment = results.adjustPayment;
                reviewOpportunities.forEach(function (row) {
                    reviewType = row.review_type.trim();
                    if (reviewType === 'Contest Review') {
                        primaryRoleId = PRIMARY_REVIEW_APPLICATION_ROLE_ID;
                        secondaryRoleId = SECONDARY_REVIEW_APPLICATION_ROLE_ID;
                    } else if (reviewType === 'Spec Review') {
                        primaryRoleId = SPECIFICATION_REVIEW_APPLICATION_ROLE_ID;
                        secondaryRoleId = 0;
                    } else if (reviewType === 'Iterative Review') {
                        primaryRoleId = ITERATIVE_REVIEW_APPLICATION_ROLE_ID;
                        secondaryRoleId = 0;
                    }
                    result.data.push({
                        primaryReviewerPayment: calculatePayment(defaultPayment, adjustPayment, row, primaryRoleId),
                        secondaryReviewerPayment: calculatePayment(defaultPayment, adjustPayment, row, secondaryRoleId),
                        numberOfSubmissions: row.number_of_submissions,
                        reviewStart: row.review_start,
                        reviewEnd: row.review_end,
                        numberOfReviewPositionsAvailable: row.number_of_review_positions_available,
                        challengeType: row.challenge_type,
                        reviewType: row.review_type.trim(),
                        challengeName: row.challenge_name,
                        challengeLink: api.config.general.challengeCommunityLink + row.challenge_id,
                        detailLink: api.config.general.reviewAuctionDetailLink + row.review_auction_id
                    });
                });

            }
            // filter the payment.
            result.data = _(result.data)
                .filter(function (item) {
                    if (isStudio) {
                        return item.reviewerPayment >= filter.reviewPaymentLowerBound
                            && item.reviewerPayment <= filter.reviewPaymentUpperBound;
                    }
                    return item.primaryReviewerPayment >= filter.reviewPaymentLowerBound
                        && item.primaryReviewerPayment <= filter.reviewPaymentUpperBound;
                });

            result.total = result.data.length;
            result.pageIndex = pageIndex;
            result.pageSize = Number(connection.params.pageIndex) === -1 ? result.data.length : pageSize;
            result.data = result.data.slice(pageStart, pageStart + pageSize);
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
 * The API for searching review opportunities
 */
exports.searchReviewOpportunities = {
    name: 'searchReviewOpportunities',
    description: 'searchReviewOpportunities',
    inputs: {
        required: [],
        optional: SOFTWARE_ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute searchReviewOpportunities#run', 'debug');
            getReviewOpportunities(api, connection, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting review opportunity information
 */
exports.getReviewOpportunity = {
    name: 'getReviewOpportunity',
    description: 'getReviewOpportunity',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log('Execute getReviewOpportunity#run', 'debug');
        connection.response = sampleReviewOpportunity;
        next(connection, true);
    }
};

/**
 * The API for getting review opportunities for studio
 */
exports.getStudioReviewOpportunities = {
    name: 'getStudioReviewOpportunities',
    description: 'getStudioReviewOpportunities',
    inputs: {
        required: [],
        optional: STUDIO_ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute getStudioReviewOpportunities#run', 'debug');
            getReviewOpportunities(api, connection, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting review opportunity information for studio
 */
exports.getStudioReviewOpportunity = {
    name: 'getStudioReviewOpportunity',
    description: 'getStudioReviewOpportunity',
    inputs: {
        required: ['id'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute getStudioReviewOpportunity#run', 'debug');
            getStudioReviewOpportunity(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting review opportunities for algorithms
 */
exports.getAlgorithmsReviewOpportunities = {
    name: "getAlgorithmsReviewOpportunities",
    description: "getAlgorithmsReviewOpportunities",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmsReviewOpportunities#run", 'debug');
        connection.response = sampleAlgorithmsReviewOpportunities;
        next(connection, true);
    }
};

/**
 * The API for getting review opportunity information for algorithms
 */
exports.getAlgorithmsReviewOpportunity = {
    name: "getAlgorithmsReviewOpportunity",
    description: "getAlgorithmsReviewOpportunity",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmsReviewOpportunity#run", 'debug');
        connection.response = sampleAlgorithmsReviewOpportunity;
        next(connection, true);
    }
};

sampleReviewOpportunity = {
    "name": "PDS - Import and Persistence Update - Assembly Challenge",
    "Phases": [
        {
            "name": "Submission",
            "start": "10.25.2013 23:02 EDT",
            "end": "10.29.2013 23:02 EDT",
            "duration": "143 hours"
        },
        {
            "name": "Screening",
            "start": "10.29.2013 23:02 EDT",
            "end": "10.30.2013 23:02 EDT",
            "duration": "24 hours"
        }
    ],
    "Positions": [
        {
            "role": "Primary Reviewer",
            "positions": 1,
            "payment": 500
        },
        {
            "role": "Secondary Reviewer",
            "positions": 2,
            "payment": 400
        }
    ],
    "Applications": [
        {
            "handle": "iRabbit",
            "role": "Primary Reviewer",
            "status": "Pending",
            "applicationDate": "10.25.2013 23:02 EDT"
        },
        {
            "handle": "iRabbit",
            "role": "Secondary Reviewer",
            "status": "Pending",
            "applicationDate": "10.25.2013 23:02 EDT"
        }
    ]
};

sampleAlgorithmsReviewOpportunities = {
    "total": 2,
    "pageIndex": 1,
    "pageSize": 10,
    "data": [
        {
            "id": 10059,
            "reviewerPayment": 100,
            "submissionsNumber": 2,
            "opensOn": "10.11.2013 13:00 EDT",
            "reviewStart": "10.14.2013 13:06 EDT",
            "reviewEnd": "10.16.2013 13:06 EDT",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Screening",
            "reviewType": "Challenge Review",
            "contestName": "Algorithms challenge 1"
        },
        {
            "id": 10160,
            "reviewerPayment": 100,
            "submissionsNumber": 0,
            "opensOn": "10.11.2013 13:00 EDT",
            "reviewStart": "10.14.2013 13:06 EDT",
            "reviewEnd": "10.16.2013 13:06 EDT",
            "numberOfReviewPositionsAvailable": 2,
            "type": "Screening",
            "reviewType": "Challenge Review",
            "contestName": "Algorithms challenge 2"
        }]
};

sampleAlgorithmsReviewOpportunity = {
    "contestId": 3005067,
    "contestName": 'Algorithm 1',
    "timeline": [
        {
            "phase": "Submission",
            "start": "11.01.2013",
            "end": "11.05.2013",
            "duration": "95"
        },
        {
            "phase": "Screening",
            "start": "11.05.2013",
            "end": "11.06.2013",
            "duration": "24"
        },
        {
            "phase": "Review",
            "start": "11.06.2013",
            "end": "11.08.2013",
            "duration": "48"
        }
    ],
    "openPositions": [
        {
            "role": "Secondary Reviewer",
            "positions": "2",
            "payment": "$216.22 *"
        }
    ],
    "reviewApplications": [
        {
            "handle": "heffan",
            "role": "Secondary Reviewer",
            "status": "Pending",
            "applicationDate": "11.01.2013 02:31 EDT"
        }
    ]
};
