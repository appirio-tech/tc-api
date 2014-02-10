/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Ghost_141
 * Changes in 1.0
 * - add invoice history (challenge costs) api.
 */
'use strict';

require('datejs');
var async = require('async');
var _ = require('underscore');
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
 */
var DATE_FORMAT = 'YYYY-M-D';

/**
 * The date format for output date field.
 */
var OUTPUT_DATE_FORMAT = 'YYYY-MM-DD';

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
                            paymentDate: helper.formatDate(row.payment_date, OUTPUT_DATE_FORMAT),
                            clientName: row.client_name,
                            clientId: row.client_id,
                            billingName: row.billing_name,
                            projectName: row.project_name,
                            challengeName: row.challenge_name,
                            challengeId: row.challenge_id,
                            challengeType: row.challenge_type,
                            challengeStatus: row.challenge_status.trim(),
                            launchDate: helper.formatDate(row.launch_date, OUTPUT_DATE_FORMAT),
                            completionDate: helper.formatDate(row.completion_date, OUTPUT_DATE_FORMAT),
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
exports.action = {
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
