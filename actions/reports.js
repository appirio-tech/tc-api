/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Expected date format
 * Dates like 2014-01-29 and 2014-1-29 are valid
 */
var DATE_FORMAT = "YYYY-M-D";

/**
 * The API for getting client challenge costs
 */
exports.action = {
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

                api.dataAccess.executeQuery("check_client_challenge_costs_exists", sqlParameters, dbConnectionMap, cb);
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
                        "challengeDuration": item.challenge_duration
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