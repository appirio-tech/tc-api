/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author panoptimum
 */
/*jslint node: true, nomen: true*/

"use strict";

var async = require('async'),
    _ = require('underscore'),
    IllegalArgumentError = require('../errors/IllegalArgumentError'),
    BadRequestError = require('../errors/BadRequestError'),
    NotFoundError = require('../errors/NotFoundError');

/**
 * Constants
 */
var MINIMUM_PAYMENT_ACCRUAL_AMOUNT = 25,
    ERROR_MESSAGE_ANONYMOUS_ACCESS = "No anonymous access to this API.";

/**
 * Returns a function, that runs a checker (e.g. api.helper.checkMember) and calls
 * a callback function thereafter.
 * @param {Function} checker function to do the checking
 * @returns {Function<cb>} function that runs the checker and calls cb thereafter.
 */
function check(checker) {
    return function (cb) {
        var error = checker();
        cb(error);
    };
}

/**
 * Get payment preference.
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function getPaymentPreference(api, connection, dbConnectionMap, next) {
    var helper = api.helper;
    async.series(
        [
            check(_.partial(helper.checkMember, connection, ERROR_MESSAGE_ANONYMOUS_ACCESS)),
            async.apply(
                api.dataAccess.executeQuery,
                'load_payment_preference',
                {userId: connection.caller.userId},
                dbConnectionMap
            )
        ],
        function (err, results) {
            var result,
                error = err,
                NONE = "None",
                exitLogMessage = "Exit getPaymentPreference with result: ",
                exitOnErrorLogMessage = "Exit getPaymentPreference on error: ",
                dbToResult = {
                    payment_method: "paymentMethod",
                    accrual_amount: "paymentAccrualAmount",
                    paypal_account_email: "paypalAccountEmail"
                };
            if (!error) {
                if (!results[1] || !results[1][0]) {
                    async.series(
                        [
                            async.apply(
                                api.dataAccess.executeQuery,
                                'load_payment_preference_accrual_amount',
                                {userId: connection.caller.userId},
                                dbConnectionMap
                            )
                        ],
                        function (error, results) {
                            result = {
                                paymentMethod: NONE,
                                paymentAccrualAmount: MINIMUM_PAYMENT_ACCRUAL_AMOUNT
                            };
                            if (!error) {
                                if (
                                    results && results[0] && results[0][0] &&
                                        results[0][0].accrual_amount > MINIMUM_PAYMENT_ACCRUAL_AMOUNT
                                ) {
                                    result.paymentAccrualAmount = results[0][0].accrual_amount;
                                }
                                api.log(exitLogMessage + JSON.stringify(result), 'debug');
                                connection.response = result;
                            } else {
                                api.log(exitOnErrorLogMessage + error.message, 'debug');
                                helper.handleError(api, connection, error);
                            }
                            next(connection, true);
                        }
                    );
                } else {
                    result = _.reduce(
                        results[1][0],
                        function (memo, value, field) {
                            memo[dbToResult[field]] = value;
                            return memo;
                        },
                        {}
                    );
                    if (!result.paymentAccrualAmount ||
                            result.paymentAccrualAmount < MINIMUM_PAYMENT_ACCRUAL_AMOUNT) {
                        result.paymentAccrualAmount = MINIMUM_PAYMENT_ACCRUAL_AMOUNT;
                    }
                    if (result.paymentMethod !== "PayPal") {
                        delete result.paypalAccountEmail;
                    }
                    api.log(exitLogMessage + JSON.stringify(result), 'debug');
                    connection.response = result;
                    next(connection, true);
                }
            } else {
                api.log(exitOnErrorLogMessage + error.message, 'debug');
                helper.handleError(api, connection, error);
                next(connection, true);
            }
        }
    );
}

/**
 * The getPaymentPreference API
 */
exports.getPaymentPreference = {
    name: "getPaymentPreference",
    description: "Get payment preference.",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheEnabled : false,
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute getPaymentPreference#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap;
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
            next(connection, true);
        } else {
            getPaymentPreference(api, connection, dbConnectionMap, next);
        }
    }
}; // getPaymentPreference

/**
 * Set payment preference.
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function setPaymentPreference(api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        userId,
        paymentMethod = connection.params.paymentMethod,
        paymentMethodLowerCase,
        paymentAccrualAmount = connection.params.paymentAccrualAmount,
        paypalAccountEmail = connection.params.paypalAccountEmail,
        paymentMethods,
    /**
     * Loads active payment methods from db.
     * @param {Function} cb the callback function.
     */
        loadActivePaymentMethods = function (cb) {
            userId = connection.caller.userId;
            async.series(
                [
                    async.apply(api.dataAccess.executeQuery, 'load_active_payment_methods', {}, dbConnectionMap)
                ],
                function (error, results) {
                    var active;
                    if (!error) {
                        active = results[0];
                        paymentMethods = _.reduce(
                            active,
                            function (memo, method) {
                                memo[method.payment_method_desc.toLowerCase()] = method.payment_method_id;
                                return memo;
                            },
                            {}
                        );
                    }
                    cb(error);
                }
            );
        },
    /**
     * Checks if paymentMethod is active.
     */
        paymentMethodIsActive = function () {
            var error = helper.checkString(paymentMethod, "paymentMethod");
            if (!error) {
                paymentMethodLowerCase = paymentMethod.toLowerCase();
                if (!_.has(paymentMethods, paymentMethodLowerCase)) {
                    error = new IllegalArgumentError("'" + paymentMethod + "' is not an active payment method.");
                }
            }
            return error;
        },
    /**
     * Checks if paypalAccountEmail is valid and belongs to paymentMethod PayPal
     */
        paypalHasEmail = function () {
            var error = null;
            if ("paypal" === paymentMethodLowerCase) {
                if (!paypalAccountEmail) {
                    error = new BadRequestError("Mandatory argument 'paypalAccountEmail' is missing.");
                }
                if (!error) {
                    error = helper.checkEmailAddress(paypalAccountEmail, "paypalAccountEmail");
                }
            }
            return error;
        },
    /**
     * Checks if paymentAccrualAmount is valid and greater than or equal to MINIMUM_PAYMENT_ACCRUAL_AMOUNT
     */
        checkPaymentAccrualAmountExceedsMinimum = function (cb) {
            var error = null;
            if (paymentAccrualAmount) {
                if (_.isString(paymentAccrualAmount)) {
                    paymentAccrualAmount =  parseInt(paymentAccrualAmount, 10);
                }
                error = helper.checkPositiveInteger(paymentAccrualAmount, "paymentAccrualAmount");
                if (!error && paymentAccrualAmount < MINIMUM_PAYMENT_ACCRUAL_AMOUNT) {
                    error = new IllegalArgumentError(
                        "'paymentAccrualAmount' was " + paymentAccrualAmount +
                            ", but must not be lower than " + MINIMUM_PAYMENT_ACCRUAL_AMOUNT + "."
                    );
                }
                cb(error);
            } else {
                async.series(
                    [
                        async.apply(
                            api.dataAccess.executeQuery,
                            'load_payment_preference_accrual_amount',
                            {userId: userId},
                            dbConnectionMap
                        )
                    ],
                    function (error, results) {
                        if (!error) {
                            if (
                                !(results && results[0] && results[0][0] &&
                                    results[0][0].accrual_amount >= MINIMUM_PAYMENT_ACCRUAL_AMOUNT)
                            ) {
                                paymentAccrualAmount = MINIMUM_PAYMENT_ACCRUAL_AMOUNT;
                            }
                        }
                        cb(error);
                    }
                );
            }
        },
        savePaymentPreferences = function (cb) {
            var fieldToDbOperation = {
                paymentAccrualAmount: {
                    update: "update_payment_accrual_amount",
                    insert: "insert_payment_accrual_amount",
                    sqlParams: {
                        userId: userId,
                        value: paymentAccrualAmount
                    }
                },
                paymentMethod: {
                    update: "update_payment_method",
                    insert: "insert_payment_method",
                    sqlParams: {
                        userId: userId,
                        value: paymentMethods[paymentMethodLowerCase]
                    }
                },
                paypalAccountEmail: {
                    update: "update_paypal_account_email",
                    insert: "insert_paypal_account_email",
                    sqlParams: {
                        userId: userId,
                        value: paypalAccountEmail
                    }
                }
            },
                updateDb = {};

            // check for each field if value is to be updated
            _.each(
                {
                    paymentAccrualAmount: paymentAccrualAmount,
                    paymentMethod: paymentMethod,
                    paypalAccountEmail: paypalAccountEmail
                },
                function (value, key) {
                    if (value) {
                        updateDb[key] = async.apply(
                            api.dataAccess.executeQuery,
                            fieldToDbOperation[key].update,
                            fieldToDbOperation[key].sqlParams,
                            dbConnectionMap
                        );
                    }
                }
            );
            async.parallel(updateDb, function (error, results) {
                var insertDb = {};
                if (!error) {
                    // Check for fields that haven't been updated and insert the values
                    _.each(results, function (value, key) {
                        if (value === 0) {
                            insertDb[key] = async.apply(
                                api.dataAccess.executeQuery,
                                fieldToDbOperation[key].insert,
                                fieldToDbOperation[key].sqlParams,
                                dbConnectionMap
                            );
                        }
                    });
                    if (!_.isEqual(insertDb, {})) {
                        async.parallel(insertDb, function (error) {
                            cb(error);
                        });
                    } else {
                        cb();
                    }
                } else {
                    cb(error);
                }
            });
        };

    async.series(
        [
            check(_.partial(helper.checkMember, connection, ERROR_MESSAGE_ANONYMOUS_ACCESS)),
            loadActivePaymentMethods,
            check(paymentMethodIsActive),
            check(paypalHasEmail),
            checkPaymentAccrualAmountExceedsMinimum,
            savePaymentPreferences
        ],
        function (error) {
            var result;
            if (error) {
                api.log("Exit setPaymentPreference on error: " + error.message, 'debug');
                helper.handleError(api, connection, error);
            } else {
                result = {success: true};
                api.log("Exit setPaymentPreference with result:" + JSON.stringify(result), 'debug');
                connection.response = result;
            }
            next(connection, true);
        }
    );
}

/**
 * The setPaymentPreference API
 */
exports.setPaymentPreference = {
    name: "setPaymentPreference",
    description: "Set payment preference.",
    inputs: {
        required: ["paymentMethod"],
        optional: ["paymentAccrualAmount", "paypalAccountEmail"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    cacheEnabled : false,
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute setPaymentPreference#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap;
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
            next(connection, true);
        } else {
            setPaymentPreference(api, connection, dbConnectionMap, next);
        }

    }
}; // setPaymentPreference
