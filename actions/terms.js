/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author hesibo
 */
"use strict";

var _ = require("underscore");
var async = require("async");
var UnauthorizedError = require("../errors/UnauthorizedError");
var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require("../errors/BadRequestError");
var IllegalArgumentError = require("../errors/IllegalArgumentError");
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * This function validate termsOfUseId parameter and set the sql parameter.
 *
 *
 * @param {Object} connection - The connection object for the current request
 * @param {Object} helper - The helper object
 * @param {Object} sqlParams - the parameters for sql query.
 * @param {Function<connection, render>} callback - The callback to be called after this function is done
 */
function validateTermsOfUseId(connection, helper, sqlParams, callback) {
    var termsOfUseId = Number(connection.params.termsOfUseId),
        error = helper.checkPositiveInteger(termsOfUseId, 'termsOfUseId') ||
            helper.checkMaxNumber(termsOfUseId, helper.MAX_INT, 'termsOfUseId');
    if (error) {
        callback(error);
    } else {
        sqlParams.termsOfUseId = termsOfUseId;
        callback();
    }
}

/**
 * Gets the term details given the term id.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getTermsOfUse = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        result = {};

    //Check if the user is logged-in
    if (connection.caller.accessLevel === "anon") {
        helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
        next(connection, true);
        return;
    }

    async.waterfall([
        function (cb) {
            // validate termsOfUseId parameter and set sql parameter
            validateTermsOfUseId(connection, helper, sqlParams, cb);
        },
        function (cb) {
            api.dataAccess.executeQuery("get_terms_of_use", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('No such terms of use exists.'));
                return;
            }

            //We could just have result = rows[0]; but we need to change keys to camel case as per requirements
            var camelCaseMap = {
                'agreeability_type': 'agreeabilityType',
                'terms_of_use_id': 'termsOfUseId'
            };
            _.each(rows[0], function (value, key) {
                key = camelCaseMap[key] || key;
                result[key] = value;
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
 * This function gets the challenge results for both develop (software) and design (studio) contests.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap - The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var agreeTermsOfUse = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, sqlParams = {}, i;

    //Check if the user is logged-in
    if (connection.caller.accessLevel === "anon") {
        helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
        next(connection, true);
        return;
    }

    sqlParams.userId = connection.caller.userId;

    async.series([
        function (callback) {
            // validate termsOfUseId parameter and set sql parameter
            validateTermsOfUseId(connection, helper, sqlParams, callback);
        },
        function (callback) {
            api.dataAccess.executeQuery("get_terms_of_use", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        if (result[0].agreeability_type !== "Electronically-agreeable") {
                            callback(new BadRequestError("The term is not electronically agreeable."));
                        } else {
                            callback();
                        }
                    } else {
                        callback(new NotFoundError("No such terms of use exists."));
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("check_user_terms_of_use_exist", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        callback(new BadRequestError("You have agreed to this terms of use before."));
                    } else {
                        callback();
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("get_dependency_terms_of_use", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    for (i = 0; i < result.length; i = i + 1) {
                        if (_.isUndefined(result[i].user_id)) {
                            callback(new BadRequestError("You can't agree to this terms of use before you have agreed to all the dependencies terms of use."));
                            return;
                        }
                    }
                    callback();
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("check_user_terms_of_use_ban", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        callback(new ForbiddenError("Sorry, you can not agree to this terms of use."));
                    } else {
                        callback();
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("insert_user_terms_of_use", sqlParams, dbConnectionMap, callback);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            api.log("Agree terms of use succeeded.", "debug");
            connection.response = {"success" : true};
        }

        next(connection, true);
    });
};

/**
 * The API for getting terms of use by id
 */
exports.getTermsOfUse = {
    name: "getTermsOfUse",
    description: "getTermsOfUse",
    inputs: {
        required: ["termsOfUseId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTermsOfUse#run", 'debug');
            getTermsOfUse(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for agree terms of use. It is transactional.
 */
exports.agreeTermsOfUse = {
    name: "agreeTermsOfUse",
    description: "agree terms of use",
    inputs: {
        required: ["termsOfUseId"],
        optional: []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : "v2",
    transaction : "write",
    cacheEnabled : false,
    databases : ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute agreeTermsOfUse#run", 'debug');
            agreeTermsOfUse(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};