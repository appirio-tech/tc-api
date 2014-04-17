/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.4
 * @author Sky_, Ghost_141
 * changes in 1.1
 * - Implement the studio review opportunities.
 * changes in 1.2
 * - Implement the general(software & studio) review opportunities.
 * - remove getStudioReviewOpportunities method.
 * changes in 1.3:
 * - Implement the getSoftwareReviewOpportunity api.
 * Changes in 1.4:
 * - Implement the applyDevelopReviewOpportunity API.
 * - add VALID_REVIEW_APPLICATION_ROLE_ID and REVIEW_APPLICATION_STATUS.
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * Sample result from specification for Review Opportunities for algorithms
 */
var sampleAlgorithmsReviewOpportunities;

/**
 * Sample result from specification for Review Opportunity Detail for algorithms
 */
var sampleAlgorithmsReviewOpportunity;

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
 * Valid value for review application role id.
 *
 * @since 1.4
 */
var VALID_REVIEW_APPLICATION_ROLE_ID = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * The review application status object.
 *
 * @since 1.4
 */
var REVIEW_APPLICATION_STATUS = {
    pending: {
        name: 'Pending',
        id: 1
    },
    cancelled: {
        name: 'Cancelled',
        id: 2
    },
    approved: {
        name: 'Approved',
        id: 3
    },
    rejected: {
        name: 'Rejected',
        id: 4
    }
};

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
                helper.checkMaxInt(challengeId, 'challengeId');

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
    MIN_DATE = '1900-01-01';
    MAX_DATE = '2999-01-01';
    now = moment(new Date()).format('YYYY-MM-DD');

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

    if (!_.isUndefined(params.reviewType)) {
        allowedReviewType = isStudio ? STUDIO_REVIEW_TYPE : SOFTWARE_REVIEW_TYPE;
        error = error || helper.checkContains(helper.getLowerCaseList(allowedReviewType), filter.reviewType.toLowerCase(), 'reviewType');
    }

    if (!_.isUndefined(params.reviewPaymentLowerBound)) {
        error = error || helper.checkNumber(Number(params.reviewPaymentLowerBound), 'reviewPaymentLowerBound');
    }

    if (!_.isUndefined(params.reviewPaymentUpperBound)) {
        error = error || helper.checkNumber(Number(params.reviewPaymentUpperBound), 'reviewPaymentUpperBound');
    }

    error = error ||
        helper.checkFilterDate(filter.reviewStartDate, 'reviewStartDate', 'YYYY-MM-DD') ||
        helper.checkFilterDate(filter.reviewEndDate, 'reviewEndDate', 'YYYY-MM-DD') ||
        helper.checkFilterDate(filter.round1ScheduledStartDate, 'round1ScheduledStartDate', 'YYYY-MM-DD') ||
        helper.checkFilterDate(filter.round2ScheduledStartDate, 'round2ScheduledStartDate', 'YYYY-MM-DD');

    if (error) {
        cb(error);
        return;
    }

    // Check the category name last.
    if (!_.isUndefined(params.challengeType)) {
        helper.isChallengeTypeValid(filter.challengeType, connection.dbConnectionMap, challengeType, cb);
    } else {
        cb();
    }
};

/**
 * Get the payment for a review opportunity.
 * @param {Object} reviewOpportunityInfo - the review opportunity information object. It contains the default payment
 * info and review opp info.
 * @param {Array} adjustPayments - the adjust payment information.
 * @returns {Object} a payment information map.
 */
var calculatePayment = function (reviewOpportunityInfo, adjustPayments) {
    // filter out the payment for other review opportunities first
    var adjustPayment = _.filter(adjustPayments, function (item) {
        return item.review_auction_id === reviewOpportunityInfo[0].review_auction_id;
    }), payment = {};

    reviewOpportunityInfo.forEach(function (row) {
        var adjust = _.find(adjustPayment, function (item) { return item.resource_role_id === row.resource_role_id; }),
            defPayment,
            submissionCount = row.submission_count,
            applicationRole = row.review_application_role_id;
        // Fix the submission count. Treat 0 as 1 submission. treat none result as 0 submission.
        if (submissionCount === 0) {
            submissionCount = 1;
        } else if (!submissionCount) {
            submissionCount = 0;
        }
        // initialize the payment if it's undefined.
        if (!payment[applicationRole]) {
            payment[applicationRole] = 0.00;
        }

        // Calculate the default payment.
        defPayment = row.fixed_amount + (row.base_coefficient + row.incremental_coefficient * submissionCount) * row.prize;

        if (adjust) {
            // We have adjust payment for this role.
            if (adjust.fixed_amount) {
                payment[applicationRole] += Number(adjust.fixed_amount);
            }
            if (adjust.multiplier) {
                payment[applicationRole] += Number(defPayment) * Number(adjust.multiplier);
            }
        } else {
            // We don't have adjust payment for this role.
            payment[applicationRole] += Number(defPayment);
        }
    });
    return payment;
};

/**
 * Get the payment values array.
 * @param {Object} reviewOpportunityInfo - the review opportunity information object. It contains the default payment
 * info and review opp info.
 * @param {Array} adjustPayments - the adjust payment information.
 * @param {Boolean} isAsc - the boolean to represent the results sort on asc or not.
 * @returns {Array} the payment values.
 */
var getPaymentValues = function (reviewOpportunityInfo, adjustPayments, isAsc) {
    var payment = calculatePayment(reviewOpportunityInfo, adjustPayments);
    return _.sortBy(payment, function (item) { return (isAsc ?  -item : item); });
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
        pageSize, sortOrder, sortColumn, filter = {}, reviewOpportunities, queryName;

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
                round1ScheduledStartDateFirstDate: filter.round1ScheduledStartDate.firstDate,
                round1ScheduledStartDateSecondDate: filter.round1ScheduledStartDate.secondDate,
                round2ScheduledStartDateFirstDate: filter.round2ScheduledStartDate.firstDate,
                round2ScheduledStartDateSecondDate: filter.round2ScheduledStartDate.secondDate,
                reviewStartDateFirstDate: filter.reviewStartDate.firstDate,
                reviewStartDateSecondDate: filter.reviewStartDate.secondDate,
                reviewEndDateFirstDate: filter.reviewEndDate.firstDate,
                reviewEndDateSecondDate: filter.reviewEndDate.secondDate,
                challenge_id: 0
            };

            queryName = isStudio ? 'search_studio_review_opportunities' : 'search_software_review_opportunities_data';

            async.parallel({
                reviewData: function (cbx) {
                    api.dataAccess.executeQuery(queryName, sqlParams, dbConnectionMap, cbx);
                },
                adjustPayment: function (cbx) {
                    if (isStudio) {
                        cbx();
                        return;
                    }
                    api.dataAccess.executeQuery('search_software_review_opportunities_adjust_payment', sqlParams,
                        dbConnectionMap, cbx);
                }
            }, cb);
        },
        function (results, cb) {
            reviewOpportunities = _.groupBy(results.reviewData, function (item) { return item.challenge_id; });
            var keys = _.keys(reviewOpportunities),
                adjustPayment = results.adjustPayment,
                pageStart = (pageIndex - 1) * pageSize;

            result.data = [];

            if (results.reviewData.length === 0) {
                result.total = 0;
                result.pageIndex = pageIndex;
                result.pageSize = pageIndex === -1 ? 0 : pageSize;
                cb();
                return;
            }

            if (!isStudio) {
                // Handle the software challenge here.
                keys.forEach(function (key) {
                    var rows = reviewOpportunities[key],
                        payment = getPaymentValues(rows, adjustPayment, true);

                    result.data.push({
                        primaryReviewerPayment: payment[0],
                        secondaryReviewerPayment: payment[1] || 0,
                        numberOfSubmissions: rows[0].number_of_submissions,
                        reviewStart: rows[0].review_start,
                        reviewEnd: rows[0].review_end,
                        numberOfReviewPositionsAvailable: rows[0].number_of_review_positions_available,
                        challengeType: rows[0].challenge_type,
                        reviewType: rows[0].review_type.trim(),
                        challengeName: rows[0].challenge_name,
                        challengeId: rows[0].challenge_id,
                        challengeLink: api.config.general.challengeCommunityLink + rows[0].challenge_id,
                        detailLink: api.config.general.reviewAuctionDetailLink + rows[0].review_auction_id
                    });
                });
            } else {
                results.reviewData.forEach(function (row) {
                    var reviewType = row.review_type.trim(),
                        reviewOpp = {
                            challengeName: row.challenge_name,
                            challengeId: row.challenge_id,
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
            // paging the results.
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
 * Get the software review opportunity.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.3
 */
var getSoftwareReviewOpportunity = function (api, connection, next) {
    var helper = api.helper, dbConnectionMap = connection.dbConnectionMap, challengeId, sqlParams, result = {},
        phases, positions, applications, basic, adjustPayment, assignedResource,
        execQuery = function (name) {
            return function (cb) {
                api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cb);
            };
        };

    challengeId = Number(connection.params.challengeId);

    async.waterfall([
        function (cb) {
            var error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxInt(challengeId, 'challengeId') ||
                helper.checkMember(connection, 'You don\'t have the authority to access this. Please login.');

            if (error) {
                cb(error);
                return;
            }

            sqlParams = {
                challenge_id: challengeId,
                challengeId: challengeId,
                user_id: connection.caller.userId
            };

            async.parallel({
                privateCheck: execQuery('check_user_challenge_accessibility'),
                reviewCheck: execQuery('check_challenge_review_opportunity')
            }, cb);
        },
        function (result, cb) {
            if (result.reviewCheck.length === 0) {
                cb(new IllegalArgumentError('The challenge don\'t have review opportunities or is not a valid ' +
                    'software challenge.'));
                return;
            }

            if (result.privateCheck[0].is_private && !result.privateCheck[0].has_access) {
                cb(new ForbiddenError('The user is not allowed to visit this challenge review opportunity detail.'));
                return;
            }

            async.parallel({
                basic: execQuery('get_review_opportunity_detail_basic'),
                phases: execQuery('get_review_opportunity_detail_phases'),
                positions: execQuery('get_review_opportunity_detail_positions'),
                applications: execQuery('get_review_opportunity_detail_applications'),
                resource: execQuery('get_assigned_review_resource_role'),
                adjustPayment: execQuery('search_software_review_opportunities_adjust_payment')
            }, cb);
        },
        function (results, cb) {
            phases = results.phases;
            positions = results.positions;
            applications = results.applications;
            assignedResource = results.resource;
            basic = results.basic[0];
            adjustPayment = results.adjustPayment;

            result.phases = [];
            result.positions = [];
            result.applications = [];

            var numberOfReviewersRequired = basic.reviewers_required,
                payment = calculatePayment(results.basic, adjustPayment);

            phases.forEach(function (row) {
                result.phases.push({
                    type: row.type,
                    status: row.status,
                    scheduledStartTime: row.scheduled_start_time,
                    actualStartTime: row.actual_start_time || null,
                    scheduledEndTime: row.scheduled_end_time,
                    actualEndTime: row.actual_end_time || null
                });
            });

            // Iterative each positions that this challenge have.
            positions.forEach(function (row) {
                var positionOpen,
                    isClosed = false,
                    i,
                    reviewApplicationRole = _.filter(results.basic, function (item) { return item.review_application_role_id === row.review_application_role_id; });

                for (i = 0; i < reviewApplicationRole.length; i += 1) {
                    if (!isClosed && reviewApplicationRole[i].is_unique && assignedResource.indexOf(reviewApplicationRole[i].resource_role_id) >= 0) {
                        isClosed = true;
                    }
                }

                if (isClosed) {
                    // Review application role is closed.
                    return;
                }

                positionOpen = Math.min(numberOfReviewersRequired, row.num_positions);

                if (positionOpen <= 0) {
                    // No open positions for this role.
                    numberOfReviewersRequired -= row.num_positions;
                    return;
                }
                result.positions.push({
                    role: row.role,
                    numPositions: positionOpen,
                    payment: payment[row.review_application_role_id]
                });

                numberOfReviewersRequired -= positionOpen;
            });

            applications.forEach(function (row) {
                result.applications.push({
                    handle: row.handle,
                    role: row.role,
                    reviewerRating: row.reviewer_rating || 'n/a',
                    status: row.status,
                    applicationDate: row.application_date
                });
            });

            _.extend(result, {
                challengeType: basic.challenge_type,
                challengeName: basic.challenge_name,
                challengeId: basic.challenge_id
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
 * Handle the apply develop review opportunities api.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.4
 */
var applyDevelopReviewOpportunity = function (api, connection, next) {
    var helper = api.helper,
        caller = connection.caller,
        resourceRoleNames = [],
        dbConnectionMap = connection.dbConnectionMap,
        challengeId = Number(connection.params.challengeId),
        reviewApplicationRoleId = connection.params.reviewApplicationRoleId,
        reviewAuctionId,
        message,
        reviewAssignmentDate,
        currentUserApplications;

    // The reviewApplicationRoleId is undefined. Initialize it.
    if (_.isUndefined(reviewApplicationRoleId)) {
        reviewApplicationRoleId = [];
    }

    // Only have one review application role id.
    if (!_.isArray(reviewApplicationRoleId)) {
        reviewApplicationRoleId = [reviewApplicationRoleId];
    }
    // Unique the array and transfer the value to number.
    reviewApplicationRoleId = _(reviewApplicationRoleId)
        .chain()
        .uniq()
        .map(function (item) { return Number(item); })
        .value();

    async.waterfall([
        function (cb) {
            var error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                helper.checkMaxInt(challengeId, 'challengeId') ||
                helper.checkMember(connection, 'Anonymous user don\'t have permission to access this api.');

            reviewApplicationRoleId.forEach(function (item) {
                error = error || helper.checkContains(VALID_REVIEW_APPLICATION_ROLE_ID, item, 'reviewApplicationRoleId');
            });

            if (error) {
                cb(error);
                return;
            }
            async.parallel({
                detail: function (cbx) {
                    api.dataAccess.executeQuery('review_opportunity_detail', { challenge_id: challengeId }, dbConnectionMap, cbx);
                },
                applications: function (cbx) {
                    api.dataAccess.executeQuery('get_user_review_applications', { challenge_id: challengeId, user_id: caller.userId }, dbConnectionMap, cbx);
                },
                resourceRoles: function (cbx) {
                    api.dataAccess.executeQuery('get_assigned_review_resource_role', { challenge_id: challengeId }, dbConnectionMap, cbx);
                },
                reviewerCheck: function (cbx) {
                    api.dataAccess.executeQuery('check_reviewer', { challenge_id: challengeId, user_id: caller.userId }, dbConnectionMap, cbx);
                },
                privateCheck: function (cbx) {
                    api.dataAccess.executeQuery('check_user_challenge_accessibility', { challengeId: challengeId, user_id: caller.userId }, dbConnectionMap, cbx);
                }
            }, cb);
        },
        function (res, cb) {
            var details = res.detail,
                reviewerCheck = res.reviewerCheck,
                availableApplicationIds = _.chain(details)
                    .map(function (item) { return item.review_application_role_id; })
                    .uniq()
                    .value(),
                privateCheck = res.privateCheck[0],
                positionsLeft,
                assignedResourceRoles = res.resourceRoles,
                currentUserResourceRole = _.filter(assignedResourceRoles, function (item) { return item.user_id === caller.userId; });

            currentUserApplications = res.applications;

            // The challenge not existed or don't have review opportunity.
            if (details.length === 0) {
                cb(new BadRequestError('The challenge is not existed or don\'t have any review opportunities or review registration is not open.'));
                return;
            }
            // Initialize it after the definition check.
            // The total review positions left for this challenge.
            positionsLeft = details[0].positions_left;
            // The reviewer assignment date.
            reviewAssignmentDate = details[0].assignment_date;
            // The review auction id. This will bed used when insert new review application.
            reviewAuctionId = details[0].review_auction_id;

            // If the request review application role is not belong to this challenge.
            if (_.difference(reviewApplicationRoleId, availableApplicationIds).length > 0) {
                cb(new BadRequestError('You can\'t apply the review application role that do not belong to this challenge.'));
                return;
            }

            // Check if it's a reviewer of this kind of challenge.
            // We only check this when caller is trying to apply review opportunity not cancel them.
            if (reviewApplicationRoleId.length > 0 && reviewerCheck.length === 0) {
                cb(new ForbiddenError('You are not a Review Board member.'));
                return;
            }

            // The caller can't access this private challenge.
            if (privateCheck.is_private && !privateCheck.has_access) {
                cb(new ForbiddenError('The user is not allowed to register this challenge review.'));
                return;
            }

            // We only check this when caller is trying to apply review opportunity not cancel them.
            // Get the review resource role that belong to the caller. If the length > 0 then the user is a reviewer already.
            if (reviewApplicationRoleId.length > 0 && currentUserResourceRole.length > 0) {
                cb(new BadRequestError('You are already assigned as reviewer for the contest.'));
                return;
            }

            // Do not need reviewer anymore.
            if (positionsLeft <= 0) {
                cb(new BadRequestError('There are no open positions for this challenge.'));
                return;
            }

            // iterative the available review application role ids for this challenge.
            // The results of this function will be a array of resource role names(The role that caller applied). So we can check the terms of use later.
            async.eachSeries(availableApplicationIds, function (roleId, cbx) {
                var reviewApplicationRole = _.filter(details, function (item) { return item.review_application_role_id === roleId; }),
                    positionsNeeds = Math.min(positionsLeft, reviewApplicationRole[0].positions),
                    isClosed = false,
                    assignedRoles = _.map(assignedResourceRoles, function (item) { return item.resource_role_id; }),
                    i;

                if (reviewApplicationRoleId.indexOf(roleId) < 0) {
                    // The caller not apply this role.
                    // Update the reviewers count before callback.
                    positionsLeft -= positionsNeeds;
                    cbx();
                    return;
                }

                for (i = 0; i < reviewApplicationRole.length; i += 1) {
                    if (!isClosed && reviewApplicationRole[i].is_unique && assignedRoles.indexOf(reviewApplicationRole[i].resource_role_id) >= 0) {
                        isClosed = true;
                    }
                }

                // The review application role is closed so no need to calculate the positions left(we already did in query).
                if (isClosed) {
                    cb(new BadRequestError('There is no open positions for selected review application role: ' + reviewApplicationRole[0].role_name + '.'));
                    return;
                }

                if (positionsLeft === 0) {
                    cbx(new BadRequestError('There is no open positions for selected review application role: ' + reviewApplicationRole[0].role_name + '.'));
                    return;
                }

                // Has the positions apply the role.
                // Store the resource role for later terms of use check.
                resourceRoleNames = _.union(resourceRoleNames,
                    _.chain(details)
                    .filter(function (item) { return item.review_application_role_id === roleId; })
                    .map(function (item) { return item.resource_role_name; })
                    .value());
                positionsLeft -= positionsNeeds;
                cbx();
            }, function (err) {
                cb(err);
            });
        },
        function (cb) {
            // Check the terms of use for each resource role here.
            async.eachSeries(resourceRoleNames, function (role, cbx) {
                api.challengeHelper.getChallengeTerms(connection, challengeId, role, false, dbConnectionMap, function (err, terms) {
                    if (err) {
                        cbx(err);
                        return;
                    }
                    // If the terms has not been all agreed.
                    // We don't allow people who has agree all terms. So simply return an error.
                    if (helper.allTermsAgreed(terms) !== true) {
                        cb(new ForbiddenError('You should agree with all terms of use.'));
                        return;
                    }
                    cbx();
                });
            }, function (err) {
                cb(err);
            });
        },
        function (cb) {
            // Update or insert the review application.
            var currentPendingAppliedApplication = _.filter(currentUserApplications, function (item) { return item.status === REVIEW_APPLICATION_STATUS.pending.name; }),
            // The current pending applied application role id for the caller.
                currentPendingApplied = _.map(currentPendingAppliedApplication, function (item) { return item.role_id; }),
            // The review application role id to remove.
                roleToRemove = _.difference(currentPendingApplied, reviewApplicationRoleId),
            // The review application role id to add.
                roleToAdd = _.difference(reviewApplicationRoleId, currentPendingApplied);

            async.parallel({
                update: function (cbx) {
                    // Update the role to cancelled status.
                    async.each(roleToRemove, function (roleId, callback) {
                        var reviewApplicationId = _.find(currentPendingAppliedApplication, function (item) { return item.role_id === roleId; }).review_application_id;
                        api.dataAccess.executeQuery('update_review_application',
                            { review_application_id: reviewApplicationId, status: REVIEW_APPLICATION_STATUS.cancelled.id },
                            dbConnectionMap, callback);
                    }, function (err) {
                        cbx(err);
                    });
                },
                add: function (cbx) {
                    // Add the new application.
                    async.each(roleToAdd, function (roleId, callback) {
                        api.idGenerator.getNextIDFromDb('REVIEW_APPLICATION_SEQ', 'tcs_catalog', dbConnectionMap, function (err, id) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            api.dataAccess.executeQuery('insert_review_application',
                                {
                                    review_application_id: id,
                                    review_auction_id: reviewAuctionId,
                                    role_id: roleId,
                                    user_id: caller.userId,
                                    status: REVIEW_APPLICATION_STATUS.pending.id
                                }, dbConnectionMap, callback);
                        });
                    }, function (err) {
                        cbx(err);
                    });
                }
            }, function (err) {
                cb(err);
            });
        },
        function (cb) {
            // Register succeed. Prepare the message.
            if (reviewApplicationRoleId.length === 0) {
                // The user is intend to remove all reigstered review applications.
                message = 'Your review application for this contest has been cancelled.';
            } else if (moment(reviewAssignmentDate).isAfter()) {
                // The assignment date is not arrived yet.
                message = 'You have successfully applied to review this contest. The system will automatically select ' +
                    'reviewers that best match the review positions for this contest on '
                    + helper.formatDate(reviewAssignmentDate, 'MM.DD.YYYY HH:mm z') + '. You will be notified by email ' +
                    'what review role you were assigned to.';
            } else {
                // The assignment date is passed.
                message = 'You have successfully applied to review this contest. The system will automatically decide ' +
                    'whether you match the reviewer requirements for this contest now. You will be notified by email ' +
                    'shortly.';
            }
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = { message: message };
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
exports.getSoftwareReviewOpportunity = {
    name: 'getSoftwareReviewOpportunity',
    description: 'getSoftwareReviewOpportunity',
    inputs: {
        required: ['challengeId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute getSoftwareReviewOpportunity#run', 'debug');
            getSoftwareReviewOpportunity(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Apply Develop Review Opportunity API.
 * @since 1.4
 */
exports.applyDevelopReviewOpportunity = {
    name: 'applyDevelopReviewOpportunity',
    description: 'applyDevelopReviewOpportunity',
    inputs: {
        required: ['challengeId'],
        optional: ['reviewApplicationRoleId']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    cacheEnabled: false,
    version: 'v2',
    transaction: 'write',
    databases: ['tcs_catalog', 'common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute applyDevelopReviewOpportunity#run', 'debug');
            applyDevelopReviewOpportunity(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
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
