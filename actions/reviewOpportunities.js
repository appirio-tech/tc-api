/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, Ghost_141
 * changes in 1.1
 * - Implement the studio review opportunities.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Sample result from specification for Review Opportunities
 */
var sampleReviewOpportunities;

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

var STUDIO_ALLOWABLE_SORT_COLUMN = ['challengeName', 'round2ScheduledStartDate', 'round1ScheduledStartDate',
    'type', 'reviewer', 'reviewerPayment'];

/**
 * Format the date value to a specific parttern.
 * @param dateValue {String} the date value.
 */
var formatDate = function (dateValue) {
    if (!dateValue) {
        return '';
    }
    return dateValue;
};

/**
 * This is the function that retrieve studio review opportunities.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getStudioReviewOpportunities = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, pageIndex, pageSize, sortColumn, sortOrder, result = {}, sqlParams = {}, error;
    pageIndex = Number(connection.params.pageIndex || 1);
    pageSize = Number(connection.params.pageSize || 10);
    sortColumn = connection.params.sortColumn || 'round1ScheduledStartDate';
    sortOrder = connection.params.sortOrder || 'ASC';

    async.waterfall([
        function (cb) {
            if (_.isDefined(connection.params.pageIndex)) {
                error = helper.checkDefined(connection.params.pageSize, 'pageSize');
            }
            if (_.isDefined(connection.params.pageSize)) {
                error = helper.checkDefined(connection.params.pageIndex, 'pageIndex');
            }
            if (_.isDefined(connection.params.sortColumn)) {
                error = error || helper.checkDefined(connection.params.sortOrder, 'sortOrder');
            }
            if (_.isDefined(connection.params.sortOrder)) {
                error = error || helper.checkDefined(connection.params.sortColumn, 'sortColumn');
            }

            error = error ||
                helper.checkMaxNumber(pageIndex, MAX_INT, 'pageIndex') ||
                helper.checkMaxNumber(pageSize, MAX_INT, 'pageSize') ||
                helper.checkPageIndex(pageIndex, 'pageIndex') ||
                helper.checkPositiveInteger(pageSize, 'pageSize') ||
                helper.checkContains(helper.getLowerCaseList(STUDIO_ALLOWABLE_SORT_COLUMN), sortColumn.toLowerCase(), 'sortColumn') ||
                helper.checkContains(helper.getLowerCaseList(ALLOWABLE_SORT_ORDER), sortOrder.toLowerCase(), 'sortOrder');

            if (error) {
                cb(error);
                return;
            }

            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }

            sqlParams.sortColumn = helper.getLowerCaseList(STUDIO_ALLOWABLE_SORT_COLUMN).indexOf(sortColumn.toLowerCase()) + 1;
            sqlParams.sortOrder = sortOrder;
            api.dataAccess.executeQuery('get_studio_review_opportunities_count', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new Error('No rows returned from get_studio_review_opportunities_count.'));
                return;
            }
            if (rows[0].count === 0 && rows[1].count === 0) {
                cb(new NotFoundError('No Studio Review Opportunities found.'));
                return;
            }
            var total = rows[0].count + rows[1].count;

            if (pageIndex > total) {
                cb(new NotFoundError('No Studio Review Opportunities found.'));
                return;
            }

            result.total = total;
            result.pageIndex = pageIndex;
            result.pageSize = pageSize;
            api.dataAccess.executeQuery('get_studio_review_opportunities', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('No Studio Review Opportunities found.'));
                return;
            }
            result.data = [];
            // paging the results.
            rows.slice(pageIndex - 1, pageIndex + pageSize - 1).forEach(function (row) {
                var reviewType = row.type.trim(), reviewOpp;
                reviewOpp = {
                    challengeName: row.challenge_name,
                    round1ScheduledStartDate: formatDate(row.round_1_scheduled_start_date),
                    round2ScheduledStartDate: formatDate(row.round_2_scheduled_start_date),
                    reviewerPayment: row.reviewer_payment,
                    reviewer: row.reviewer,
                    type: reviewType
                };
                if (reviewType === 'Spec Review') {
                    delete reviewOpp.round2ScheduledStartDate;
                }
                result.data.push(reviewOpp);
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
 * This method will calculate the duration between two times. It will only return how many hours between the given time.
 * @param startTime {String} the start time
 * @param endTime {String} the end time
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
 * The API for searching review opportunities
 */
exports.searchReviewOpportunities = {
    name: "searchReviewOpportunities",
    description: "searchReviewOpportunities",
    inputs: {
        required: [],
        optional: ["filter", "value", "pageIndex", "pageSize", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute searchReviewOpportunities#run", 'debug');
        connection.response = sampleReviewOpportunities;
        next(connection, true);
    }
};

/**
 * The API for getting review opportunity information
 */
exports.getReviewOpportunity = {
    name: "getReviewOpportunity",
    description: "getReviewOpportunity",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getReviewOpportunity#run", 'debug');
        connection.response = sampleReviewOpportunity;
        next(connection, true);
    }
};

/**
 * The API for getting review opportunities for studio
 */
exports.getStudioReviewOpportunities = {
    name: "getStudioReviewOpportunities",
    description: "getStudioReviewOpportunities",
    inputs: {
        required: [],
        optional: ['pageIndex', 'pageSize', 'sortColumn', 'sortOrder']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run: function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log('Execute getStudioReviewOpportunities#run', 'debug');
            getStudioReviewOpportunities(api, connection, this.dbConnectionMap, next);
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
        if (this.dbConnectionMap) {
            api.log('Execute getStudioReviewOpportunity#run', 'debug');
            getStudioReviewOpportunity(api, connection, this.dbConnectionMap, next);
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

sampleReviewOpportunities = {
    "total": 21,
    "pageIndex": 1,
    "pageSize": 10,
    "data": [
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 1,
            "opensOn": "10.25.2013 21:09 EDT",
            "reviewStart": "10.29.2013 21:13 EDT",
            "reviewEnd": "10.31.2013 21:13 EDT",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Copilot Posting",
            "reviewType": "Contest Review",
            "contestName": "DOE Open-WARP Software Copilot Opportunity"
        },
        {
            "primaryReviewerPayment": 442,
            "secondaryReviewerPayment": 336,
            "submissionsNumber": 3,
            "opensOn": "10.31.2013 22:22 EDT",
            "reviewStart": "11.07.2013 01:52 EST",
            "reviewEnd": "11.09.2013 01:52 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - Topcoder NodeJS Contest Retrieval API"
        },
        {
            "primaryReviewerPayment": 205,
            "secondaryReviewerPayment": 143,
            "submissionsNumber": 1,
            "opensOn": "11.01.2013 23:25 EDT",
            "reviewStart": "11.08.2013 10:30 EST",
            "reviewEnd": "11.10.2013 10:30 EST",
            "numberOfReviewPositionsAvailable": 2,
            "type": "UI Prototype Competition",
            "reviewType": "Contest Review",
            "contestName": "NEW TC-CS Community TopCoder API Hooking Up part 2- Wordpress Plugin Development"
        },
        {
            "primaryReviewerPayment": 430,
            "secondaryReviewerPayment": 330,
            "submissionsNumber": 4,
            "opensOn": "11.02.2013 07:00 EDT",
            "reviewStart": "11.07.2013 18:05 EST",
            "reviewEnd": "11.09.2013 18:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - TopCoder NodeJS Software Tops REST API"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 2,
            "opensOn": "11.03.2013 20:33 EST",
            "reviewStart": "11.05.2013 20:38 EST",
            "reviewEnd": "11.07.2013 20:38 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Hercules Player Personal Content DVR Bug Hunt"
        },
        {
            "primaryReviewerPayment": 490,
            "secondaryReviewerPayment": 360,
            "submissionsNumber": 0,
            "opensOn": "11.03.2013 23:20 EST",
            "reviewStart": "11.10.2013 11:25 EST",
            "reviewEnd": "11.12.2013 11:25 EST",
            "numberOfReviewPositionsAvailable": 2,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Hercules Tech App SAHIC Prototype Conversion Module Assembly"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 3,
            "opensOn": "11.04.2013 03:00 EST",
            "reviewStart": "11.07.2013 03:05 EST",
            "reviewEnd": "11.09.2013 03:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Styx Physical Access Control iPad Application iOS7 Bug Hunt 2"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 3,
            "opensOn": "11.04.2013 03:00 EST",
            "reviewStart": "11.07.2013 03:05 EST",
            "reviewEnd": "11.09.2013 03:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Styx Physical Access Control iPhone Application iOS7 Bug Hunt 2"
        },
        {
            "primaryReviewerPayment": 202,
            "secondaryReviewerPayment": 144,
            "submissionsNumber": 0,
            "opensOn": "11.04.2013 09:15 EST",
            "reviewStart": "11.09.2013 21:20 EST",
            "reviewEnd": "11.11.2013 21:20 EST",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - ActionHero Tasks for Adding LDAP Entry and Sending Verification Emails"
        },
        {
            "primaryReviewerPayment": 298,
            "secondaryReviewerPayment": 216,
            "submissionsNumber": 0,
            "opensOn": "11.04.2013 09:29 EST",
            "reviewStart": "11.09.2013 21:34 EST",
            "reviewEnd": "11.11.2013 21:34 EST",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - TopCoder NodeJS Member Registration REST API"
        }
    ]
};

sampleReviewOpportunity = {
    "name": "PDS - Import and Persistence Update - Assembly Contest",
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
            "reviewType": "Contest Review",
            "contestName": "Algorithms contest 1"
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
            "reviewType": "Contest Review",
            "contestName": "Algorithms contest 2"
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
