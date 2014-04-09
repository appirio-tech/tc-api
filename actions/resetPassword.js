/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author LazyChild, isv
 * 
 * changes in 1.1
 * - implemented generateResetToken function
 */
"use strict";

var async = require('async');
var stringUtils = require("../common/stringUtils.js");
var moment = require('moment-timezone');

var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');
var TOKEN_ALPHABET = stringUtils.ALPHABET_ALPHA_EN + stringUtils.ALPHABET_DIGITS_EN;

/**
 * Looks up for the user account matching specified handle (either TopCoder handle or social login username) or email.
 * If user account is not found then NotFoundError is returned to callback; otherwise ID for found user account is
 * passed to callback.
 *
 * @param {String} handle - the handle to check.
 * @param {String} email - the email to check.
 * @param {Object} api - the action hero api object.
 * @param {Object} dbConnectionMap - the database connection map.
 * @param {Function<err, row>} callback - the callback function.
 */
var resolveUserByHandleOrEmail = function (handle, email, api, dbConnectionMap, callback) {
    api.dataAccess.executeQuery("find_user_by_handle_or_email", { handle: handle, email: email }, dbConnectionMap,
        function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            if (result && result[0]) {
                callback(null, result[0]);
            } else {
                callback(new NotFoundError("User does not exist"));
            }
        });
};

/**
 * This is the function that stub reset password
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function resetPassword(api, connection, next) {
    var result, helper = api.helper;
    async.waterfall([
        function (cb) {
            if (connection.params.handle === "nonValid") {
                cb(new BadRequestError("The handle you entered is not valid"));
            } else if (connection.params.handle === "badLuck") {
                cb(new Error("Unknown server error. Please contact support."));
            } else if (connection.params.token === "unauthorized_token") {
                cb(new UnauthorizedError("Authentication credentials were missing or incorrect."));
            } else if (connection.params.token === "forbidden_token") {
                cb(new ForbiddenError("The request is understood, but it has been refused or access is not allowed."));
            } else {
                result = {
                    "description": "Your password has been reset!"
                };
                cb();
            }
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


/**
 * Generates the token for resetting the password for specified user account. First checks if non-expired token already
 * exists for the user. If so then BadRequestError is passed to callback. Otherwise a new token is generated and saved
 * to cache and returned to callback.
 *
 * @param {Number} userHandle - handle of user to generate token for.
 * @param {String} userEmailAddress - email address of user to email generated token to.
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Function<err>} callback - the callback function.
 */
var generateResetToken = function (userHandle, userEmailAddress, api, callback) {
    var tokenCacheKey = 'tokens-' + userHandle + '-reset-token',
        current,
        expireDate,
        expireDateString,
        emailParams;

    api.helper.getCachedValue(tokenCacheKey, function (err, token) {
        if (err) {
            callback(err);
        } else if (token) {
            // Non-expired token already exists for this user - raise an error
            callback(new BadRequestError("You have already requested the reset token, please find it in your email inbox."
                + " If it's not there. Please contact support@topcoder.com."));
        } else {
            // There is no token - generate new one
            var newToken = stringUtils.generateRandomString(TOKEN_ALPHABET, 6),
                lifetime = api.config.general.defaultResetPasswordTokenCacheLifetime;
            api.cache.save(tokenCacheKey, newToken, lifetime);

            // Send email with token to user
            current = new Date();
            expireDate = current.setSeconds(current.getSeconds() + lifetime / 1000);
            expireDateString = moment(expireDate).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z');
            emailParams = {
                handle: userHandle,
                token: newToken,
                expiry: expireDateString,
                template: 'reset_token_email',
                subject: api.config.general.resetPasswordTokenEmailSubject,
                toAddress: userEmailAddress
            };
            api.tasks.enqueue("sendEmail", emailParams, 'default');

            callback(null, newToken);
        }
    });
};

/**
 * Reset password API.
 */
exports.resetPassword = {
    "name": "resetPassword",
    "description": "resetPassword",
    inputs: {
        required: ["handle", "token", "password"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
	cacheEnabled: false,
    run: function (api, connection, next) {
        api.log("Execute resetPassword#run", 'debug');
        resetPassword(api, connection, next);
    }
};

/**
 * Generate reset token API.
 */
exports.generateResetToken = {
    name: "generateResetToken",
    description: "generateResetToken",
    inputs: {
        required: [],
        optional: ["handle", "email"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        api.log("Execute generateResetToken#run", 'debug');
        if (connection.dbConnectionMap) {
            async.waterfall([
                function (cb) { // Find the user either by handle or by email
                    // Get handle, email from request parameters
                    var handle = (connection.params.handle || '').trim(),
                        email = (connection.params.email || '').trim(),
                        byHandle = (handle !== ''),
                        byEmail = (email !== '');

                    // Validate the input parameters, either handle or email but not both must be provided
                    if (byHandle && byEmail) {
                        cb(new BadRequestError("Both handle and email are specified"));
                    } else if (!byHandle && !byEmail) {
                        cb(new BadRequestError("Either handle or email must be specified"));
                    } else {
                        resolveUserByHandleOrEmail(handle, email, api, connection.dbConnectionMap, cb);
                    }
                }, function (result, cb) {
                    if (result.social_login_provider_name !== '') {
                        // For social login accounts return the provider name
                        cb(null, null, result.social_login_provider_name);
                    } else {
                        // Generate reset password token for user
                        generateResetToken(result.handle, result.email_address, api, cb);
                    }
                }
            ], function (err, newToken, socialProviderName) {
                if (err) {
                    api.helper.handleError(api, connection, err);
                } else if (newToken) {
                    connection.response = {successful: true};
                } else if (socialProviderName) {
                    connection.response = {socialProvider: socialProviderName};
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
