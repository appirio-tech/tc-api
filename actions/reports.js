/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.4
 * @author Ghost_141, Sky_, muzehyun, isv
 * Changes in 1.1
 * - add invoice history (challenge costs) api.
 * Changes in 1.2
 * - add active billing account api.
 * Changes in 1.3
 * - added getClientActiveChallengeCosts function
 * Changes in 1.4:
 * - Implement the track statistics API.
 */
'use strict';

require('datejs');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var UnauthorizedError = require('../errors/UnauthorizedError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Default value for input parameter for challenge costs action.
 */
var DEFAULT_CLIENT_ID = 0;
var DEFAULT_BILLING_ID = 0;
var DEFAULT_PROJECT_ID = 0;
var DEFAULT_CHALLENGE_ID = 0;

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
 * The date format for output date field.
 */
var OUTPUT_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Valid track value.
 * @since 1.3
 */
var VALID_TRACK = ['develop', 'design', 'data'];

/**
 * Get Track Statistics API.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.3
 */
var getTrackStatistics = function (api, connection, next) {
    var helper = api.helper,
        sqlParams,
        result,
        queryName,
        track = connection.params.track.toLowerCase(),
        startDate = MIN_DATE,
        endDate = MAX_DATE;
    async.waterfall([
        function (cb) {
            var error = helper.checkContains(VALID_TRACK, track, 'track');

            if (!_.isUndefined(connection.params.startDate)) {
                startDate = connection.params.startDate;
                error = error || helper.validateDate(startDate, 'startDate', DATE_FORMAT);
            }
            if (!_.isUndefined(connection.params.endDate)) {
                endDate = connection.params.endDate;
                error = error || helper.validateDate(endDate, 'endDate', DATE_FORMAT);
            }
            if (!_.isUndefined(connection.params.startDate) && !_.isUndefined(connection.params.endDate)) {
                error = error || helper.checkDates(startDate, endDate);
            }

            cb(error);
        },
        function (cb) {
            sqlParams = {
                start_date: startDate,
                end_date: endDate
            };
            if (track === helper.software.community) {
                sqlParams.challenge_type = helper.software.category;
                queryName = 'get_develop_design_track_statistics';
            } else if (track === helper.studio.community) {
                sqlParams.challenge_type = helper.studio.category;
                queryName = 'get_develop_design_track_statistics';
            } else {
                queryName = 'get_data_track_statistics';
            }

            if (track === 'data') {
                async.parallel({
                    data: function (cbx) {
                        api.dataAccess.executeQuery(queryName, sqlParams, connection.dbConnectionMap, cbx);
                    },
                    pastData: function (cbx) {
                        api.dataAccess.executeQuery('get_past_data_track_statistics', sqlParams, connection.dbConnectionMap, cbx);
                    }
                }, cb);
            } else {
                api.dataAccess.executeQuery(queryName, sqlParams, connection.dbConnectionMap, cb);
            }
        },
        function (results, cb) {
            var count = 0;
            if (track === 'data') {
                result = helper.transferDBResults2Response(results.data)[0];
                _.each(results.pastData, function (row) { count += Number(row.total_count); });
                result.numberOfChallengesInGivenTime += count;
            } else {
                result = helper.transferDBResults2Response(results)[0];
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

var getChallengeCosts = function (api, connection, next) {
    var helper = api.helper, caller = connection.caller, error, challengeId, projectId, billingId, clientId, startDate,
        endDate, sqlParams, challengeCosts;
    if (connection.params.challengeId && Number(connection.params.challengeId) !== 0) {
        // Have challengeId and challengeId is not 0.
        clientId = DEFAULT_CLIENT_ID;
        billingId = DEFAULT_BILLING_ID;
        projectId = DEFAULT_PROJECT_ID;
        challengeId = connection.params.challengeId;
        startDate = MIN_DATE;
        endDate = MAX_DATE;
    } else if (!connection.params.challengeId || Number(connection.params.challengeId) === 0) {
        // There is no challengeId or the challenge id is 0
        challengeId = DEFAULT_CHALLENGE_ID;
        clientId = connection.params.clientId || DEFAULT_CLIENT_ID;
        projectId = connection.params.projectId || DEFAULT_PROJECT_ID;
        billingId = connection.params.billingId || DEFAULT_BILLING_ID;
        startDate = connection.params.startDate;
        endDate = connection.params.endDate;
    }
    async.waterfall([
        function (cb) {
            if (!helper.isAdmin(caller)) {
                cb(new UnauthorizedError('Not enough access level.'));
                return;
            }
            error = helper.checkNonNegativeNumber(Number(challengeId), 'challengeId') ||
                helper.checkMaxNumber(Number(challengeId), helper.MAX_INT, 'challengeId') ||
                helper.checkNonNegativeNumber(Number(clientId), 'clientId') ||
                helper.checkMaxNumber(Number(clientId), helper.MAX_INT, 'clientId') ||
                helper.checkNonNegativeNumber(Number(projectId), 'projectId') ||
                helper.checkMaxNumber(Number(projectId), helper.MAX_INT, 'projectId') ||
                helper.checkNonNegativeNumber(Number(billingId), 'billingId') ||
                helper.checkMaxNumber(Number(billingId), helper.MAX_INT, 'billingId') ||
                helper.validateDate(startDate, 'startDate', DATE_FORMAT) ||
                helper.validateDate(endDate, 'endDate', DATE_FORMAT) ||
                helper.checkDates(startDate, endDate);

            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                start_date: startDate,
                end_date: endDate,
                client_id: clientId,
                project_id: projectId,
                billing_id: billingId,
                challenge_id: challengeId,
                user_id: caller.userId
            };
            var exeQuery = function (suffix) {
                return function (cbx) {
                    api.dataAccess.executeQuery('dashboard_billing_cost_invoice_report_' + suffix, sqlParams, connection.dbConnectionMap, cbx);
                };
            };
            async.parallel({
                dr: exeQuery('DR'),
                memberPayments: exeQuery('member_payments'),
                percentageFeePayment: exeQuery('percentage_fee_payment'),
                percentageFeePayment2: exeQuery('percentage_fee_payment2'),
                projectLevelPayments: exeQuery('project_level_payments'),
                reliability: exeQuery('reliability'),
                fixedFee: exeQuery('fixed_fee'),
                percentageFeeDR: exeQuery('percentage_fee_DR'),
                credit: exeQuery('credit'),
                fixedBugFee: exeQuery('fixed_bug_fee'),
                fixedProjectLevelBugFee: exeQuery('fixed_project_level_bug_fee'),
                percentageFeeProjectLevelPayment: exeQuery('percentage_fee_project_level_payment')
            }, cb);
        },
        function (results, cb) {
            var notEmpty = false;
            challengeCosts = {};
            challengeCosts.history = [];
            _.each(results, function (res) {
                if (res.length !== 0) {
                    notEmpty = true;
                    res.forEach(function (row) {
                        challengeCosts.history.push({
                            paymentDate: helper.formatInformixDate(row.payment_date, OUTPUT_DATE_FORMAT),
                            clientName: row.client_name,
                            clientId: row.client_id,
                            billingName: row.billing_name,
                            projectName: row.project_name,
                            challengeName: row.challenge_name,
                            challengeId: row.challenge_id,
                            challengeType: row.challenge_type,
                            challengeStatus: (row.challenge_status || '').trim(),
                            launchDate: helper.formatInformixDate(row.launch_date, OUTPUT_DATE_FORMAT),
                            completionDate: helper.formatInformixDate(row.completion_date, OUTPUT_DATE_FORMAT),
                            paymentType: row.payment_type,
                            amount: row.amount
                        });
                    });
                }
            });
            if (!notEmpty) {
                cb(new NotFoundError('Challenge costs not found.'));
                return;
            }
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = challengeCosts;
        }
        next(connection, true);
    });
};

/**
 * The API for getting challenge costs
 */
exports.getChallengeCosts = {
    name : 'getChallengeCosts',
    description : 'getChallengeCosts',
    inputs : {
        required : ['startDate', 'endDate'],
        optional : ['clientId', 'billingId', 'projectId', 'challengeId']
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    cacheEnabled: false,
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute getChallengeCosts#run', 'debug');
            getChallengeCosts(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};


/**
 * The API for getting client challenge costs
 */
exports.getClientChallengeCosts = {
    name: "getClientChallengeCosts",
    description: "getClientChallengeCosts",
    inputs: {
        required: ["startDate", "endDate"],
        optional: ["clientId", "sfdcAccountId", 'customerNumber']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheEnabled: false,
    databases: ["tcs_dw"],
    run: function (api, connection, next) {
        api.log("Execute getClientChallengeCosts#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            helper = api.helper,
            clientId = 0,
            startDate = connection.params.startDate,
            endDate = connection.params.endDate,
            cmc = connection.params.sfdcAccountId || "",
            customerNumber = connection.params.customerNumber || "",
            sqlParameters,
            costs;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                //Admin only
                cb(helper.checkAdmin(connection));
            },
            function (cb) {
                var error = helper.checkDateFormat(startDate, DATE_FORMAT, "startDate") ||
                    helper.checkDateFormat(endDate, DATE_FORMAT, "endDate") ||
                    _.checkArgument(moment(startDate, DATE_FORMAT) <= moment(endDate, DATE_FORMAT),
                        "startDate can't be greater than endDate");

                if (_.isDefined(connection.params.clientId)) {
                    clientId = Number(connection.params.clientId);
                    error = error || helper.checkPositiveInteger(clientId, "clientId");
                    //don't check maxInt, because clientId is DECIMAL in database, not integer
                }
                cb(error);
            }, function (cb) {
                sqlParameters = {
                    clientid: clientId,
                    sdt: startDate,
                    edt: endDate,
                    cmc_account_id: cmc,
                    customer_number: customerNumber
                };
                if (_.isDefined(connection.params.clientId) || _.isDefined(connection.params.sfdcAccountId)) {
                    api.dataAccess.executeQuery("check_client_challenge_costs_exists", sqlParameters, dbConnectionMap, cb);
                } else {
                    cb(null, ["dummy"]);
                }
            }, function (results, cb) {
                if (!results.length) {
                    cb(new NotFoundError('Client not found'));
                    return;
                }
                api.dataAccess.executeQuery("get_client_challenge_costs", sqlParameters, dbConnectionMap, cb);
            }, function (results, cb) {
                costs = _.map(results, function (item) {
                    return {
                        "customerName": item.customer_name,
                        "customerNumber": item.customer_number,
                        "customerId": item.customer_id,
                        "billingAccountId": item.billing_account_id,
                        "billingAccountName": item.billing_account_name,
                        "projectName": item.project_name,
                        "challengeName": item.challenge_name,
                        "challengeId": item.challenge_id,
                        "challengeType": item.challenge_type,
                        "challengeStatus": item.challenge_status,
                        "postingDate": moment(item.posting_date).format("YYYY-MM-DD"),
                        "completionDate": moment(item.completion_date).format("YYYY-MM-DD"),
                        "challengeMemberCost": item.challenge_member_cost,
                        "challengeFee": item.challenge_fee,
                        "challengeTotalCost": item.challenge_total_cost,
                        "challengeDuration": item.challenge_duration,
                        "lastModificationDate": item.last_modification_date
                    };
                });
                cb();
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = {"history": costs};
            }
            next(connection, true);
        });
    }
};

/**
 * The API for getting active billing accounts
 */
exports.getActiveBillingAccounts = {
    name: "getActiveBillingAccounts",
    description: "getActiveBillingAccounts",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["time_oltp"],
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log("Execute getActiveBillingAccounts#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            helper = api.helper,
            result = {};
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                cb(helper.checkAdmin(connection));
            }, function (cb) {
                api.dataAccess.executeQuery("get_active_billing_accounts", {}, dbConnectionMap, cb);
            }, function (results, cb) {
                result.activeBillingAccounts = _.map(results, function (item) {
                    return {
                        "clientName": item.client_name,
                        "clientCustomerNumber": item.client_customer_number,
                        "clientId": item.client_id,
                        "billingAccountId": item.billing_account_id,
                        "billingAccountName": item.billing_account_name,
                        "subscriptionNumber": item.subscription_number,
                        "projectStartDate": item.project_start_date,
                        "projectEndDate": item.project_end_date,
                        "poNumber": item.po_number
                    };
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
    }
}; // getActiveBillingAccounts


/**
 * The API for getting active client challenge costs
 */
exports.getClientActiveChallengeCosts = {
    name: "getClientActiveChallengeCosts",
    description: "getClientActiveChallengeCosts",
    inputs: {
        required: [],
        optional: ["clientId", "sfdcAccountId", 'customerNumber']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheEnabled: false,
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getClientActiveChallengeCosts#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            helper = api.helper,
            clientId = 0,
            cmc = connection.params.sfdcAccountId || "",
            customerNumber = connection.params.customerNumber || "",
            sqlParameters,
            costs;

        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                //Admin only
                cb(helper.checkAdmin(connection));
            },
            function (cb) {
                var error;
                if (_.isDefined(connection.params.clientId)) {
                    clientId = Number(connection.params.clientId);
                    error = error || helper.checkPositiveInteger(clientId, "clientId");
                    //don't check maxInt, because clientId is DECIMAL in database, not integer
                }
                cb(error);
            }, function (cb) {
                sqlParameters = {
                    clientid: clientId,
                    cmc_account_id: cmc,
                    customer_number: customerNumber
                };
                if (_.isDefined(connection.params.clientId) || _.isDefined(connection.params.sfdcAccountId)) {
                    api.dataAccess.executeQuery("check_client_active_challenge_costs_exists", sqlParameters,
                        dbConnectionMap, cb);
                } else {
                    cb(null, ["dummy"]);
                }
            }, function (results, cb) {
                if (!results.length) {
                    cb(new NotFoundError('Client not found'));
                    return;
                }
                api.dataAccess.executeQuery("get_client_active_challenge_costs", sqlParameters, dbConnectionMap, cb);
            }, function (results, cb) {
                costs = _.map(results, function (item) {
                    var duration = parseFloat(item.challenge_duration.toFixed(1)),
                        currentPhaseText = item.current_phase;
                   /*     currentPhaseArray = [];

                    if (currentPhaseText) {
                        currentPhaseArray = currentPhaseText.split(',');
                    }*/

                    return {
                        "customerName": item.customer_name,
                        "customerNumber": item.customer_number,
                        "customerId": item.customer_id,
                        "billingAccountId": item.billing_account_id,
                        "billingAccountName": item.billing_account_name,
                        "projectName": item.project_name,
                        "challengeName": item.challenge_name,
                        "challengeId": item.challenge_id,
                        "challengeType": item.challenge_type,
                        "challengeStatus": item.challenge_status,
                        "postingDate": moment(item.posting_date).format("YYYY-MM-DD"),
                        "completionDate": moment(item.completion_date).format("YYYY-MM-DD"),
                        "challengeMemberCost": item.challenge_member_cost,
                        "challengeFee": item.challenge_fee,
                        "challengeTotalCost": item.challenge_member_cost + item.challenge_fee,
                        "challengeDuration": duration,
                        "lastModificationDate": moment(item.last_modification_date).format("YYYY-MM-DD"),
                        "registrationEndDate": moment(item.registration_end_date).format("YYYY-MM-DD"),
                        "submissionEndDate": moment(item.submission_end_date).format("YYYY-MM-DD"),
                        "checkpointEndDate": moment(item.checkpoint_end_date).format("YYYY-MM-DD"),
                        "currentPhase": currentPhaseText,
                        "firstPrize": item.first_prize,
                        "totalPrize": item.total_prize,
                        "checkpointPrize": item.checkpoint_prize,
                        "registrantsCount": item.registrants_count,
                        "submissionsCount": item.submissions_count,
                        "checkpointSubmissionsCount": item.checkpoint_submissions_count,
                        "challengeScheduledEndDate": moment(item.challenge_scheduled_end_date).format("YYYY-MM-DD"),
                        "reliability": item.reliability,
                        "challengeCreator": item.challenge_creator,
                        "challengeInitiator": item.challenge_initiator,
                        "challengeManager": item.challenge_manager
                    };
                });

                cb();
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = {"active": costs};
            }
            next(connection, true);
        });
    }
};


/**
 * Track statistics API.
 *
 * @since 1.3
 */
exports.getTrackStatistics = {
    name: 'getTrackStatistics',
    description: 'getTrackStatistics',
    inputs: {
        required: ['track'],
        optional: ['startDate', 'endDate']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['tcs_catalog', 'informixoltp', 'topcoder_dw'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTrackStatistics#run", 'debug');
            getTrackStatistics(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
