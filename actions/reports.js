/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
'use strict';

var async = require('async');
var _ = require('underscore');
var UnAuthorizedError = require('../errors/UnAuthorizedError');
var NotFoundError = require('../errors/NotFoundError');

var DEFAULT_CLIENT_ID = 0;
var DEFAULT_BILLING_ID = 0;
var DEFAULT_PROJECT_ID = 0;
var DEFAULT_CHALLENGE_ID = 0;
var MIN_DATE = '1900-1-1';
var MAX_DATE = '9999-1-1';

var getChallengeCosts = function (api, connection, next) {
    var helper = api.helper, caller = connection.caller, error, challengeId, projectId, billingId, clientId, startDate,
        endDate, sqlParams, challengeCosts;
    if (connection.params.challengeId && Number(connection.params.challengeId) !== 0) {
        // Have challengeId and challengeId is not 0.
        clientId = DEFAULT_BILLING_ID;
        billingId = DEFAULT_BILLING_ID;
        projectId = DEFAULT_BILLING_ID;
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
                cb(new UnAuthorizedError('The caller is not admin of TopCoder community'));
            }
            error = helper.checkNonNegativeNumber(challengeId, 'challengeId') ||
                helper.checkMaxNumber(challengeId, helper.MAX_INT, 'challengeId') ||
                helper.checkNonNegativeNumber(clientId, 'clientId') ||
                helper.checkMaxNumber(clientId, helper.MAX_INT, 'clientId') ||
                helper.checkNonNegativeNumber(projectId, 'projectId') ||
                helper.checkMaxNumber(projectId, helper.MAX_INT, 'projectId') ||
                helper.checkNonNegativeNumber(billingId, 'billingId') ||
                helper.checkMaxNumber(billingId, helper.MAX_INT, 'billingId');
            // TODO: Validate the date.

            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                startDate: startDate,
                endDate: endDate,
                clientId: clientId,
                projectId: projectId,
                billingId: billingId,
                challengeId: challengeId,
                userId: caller.userId
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
            challengeCosts = [];
            _.each(results, function (res) {
                if (res.length !== 0) {
                    notEmpty = true;
                } else {
                    res.forEach(function (row) {
                        challengeCosts.push({
                            paymentDate: row.payment_date,
                            clientName: row.client_name,
                            clientId: row.client_id,
                            billingName: row.billing_name,
                            projectName: row.project_name,
                            challengeName: row.challenge_name,
                            challengeId: row.challenge_id,
                            challengeType: row.challenge_type,
                            challengeStatus: row.challenge_status,
                            launchDate: row.launch_date,
                            completionDate: row.completion_date,
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
    description : 'softwareTypes',
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
