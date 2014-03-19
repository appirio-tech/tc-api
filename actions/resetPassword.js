/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author LazyChild, Ghost_141
 *
 * Changes in 1.1:
 * - Implement the Reset Password API instead of mock it.
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');
var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * Reset Password.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function resetPassword(api, connection, next) {
    var result, helper = api.helper, sqlParams, userId, ldapEntryParams, oldPassword,
        dbConnectionMap = connection.dbConnectionMap,
        token = connection.params.token,
        handle = decodeURI(connection.params.handle).toLowerCase(),
        newPassword = connection.params.password,
        tokenKey = handle + '-' + api.config.general.resetTokenSuffix;

    async.waterfall([
        function (cb) {
            var error = helper.checkStringPopulated(token, 'token') ||
                helper.checkStringPopulated(handle, 'handle') ||
                helper.validatePassword(newPassword);
            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                handle: handle
            };
            api.dataAccess.executeQuery('get_user_information', sqlParams, dbConnectionMap, cb);
        },
        function (result, cb) {
            if (result.length === 0) {
                cb(new NotFoundError('The user is not exist.'));
                return;
            }
            userId = result[0].user_id;
            oldPassword = helper.decodePassword(result[0].old_password, helper.PASSWORD_HASH_KEY);
            sqlParams.handle = result[0].handle;
            helper.getCachedValue(tokenKey, cb);
        },
        function (cache, cb) {
            if (!_.isDefined(cache)) {
                // The token is either not assigned or is expired.
                cb(new BadRequestError('The token is expired, not existed or incorrect. Please apply a new one.'));
                return;
            }
            if (cache !== token) {
                // The token don't match
                cb(new IllegalArgumentError('The token is incorrect.'));
                return;
            }
            sqlParams.password = helper.encodePassword(newPassword, helper.PASSWORD_HASH_KEY);
            api.dataAccess.executeQuery('update_password', sqlParams, dbConnectionMap, cb);
        },
        function (count, cb) {
            if (count !== 1) {
                cb(new Error('password is not updated successfully'));
                return;
            }
            ldapEntryParams = {
                userId: userId,
                handle: sqlParams.handle,
                oldPassword: oldPassword,
                newPassword: newPassword
            };
            api.ldapHelper.updateMemberPasswordLDAPEntry(ldapEntryParams, cb);
        },
        function (cb) {
            // Delete the token from cache system.
            api.cache.destroy(tokenKey, function (err) {
                cb(err);
            });
        },
        function (cb) {
            result = {
                description: 'Your password has been reset!'
            };
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

/**
 * This is the function that stub reset token
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function generateResetToken(api, connection, next) {
    var result, helper = api.helper;
    async.waterfall([
        function (cb) {
            if (connection.params.handle === "nonValid" || connection.params.email === "nonValid@test.com") {
                cb(new BadRequestError("The handle you entered is not valid"));
                return;
            }
            if (connection.params.handle === "badLuck" || connection.params.email === "badLuck@test.com") {
                cb(new Error("Unknown server error. Please contact support."));
                return;
            }

            if (connection.params.handle === "googleSocial" || connection.params.email === "googleSocial@test.com") {
                result = {
                    "socialLogin": "Google"
                };
            } else {
                result = {
                    "token": "a3cbG"
                };
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
}

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
    transaction: 'write',
    cacheEnabled: false,
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute resetPassword#run", 'debug');
            resetPassword(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Generate reset token API.
 */
exports.generateResetToken = {
    "name": "generateResetToken",
    "description": "generateResetToken",
    inputs: {
        required: [],
        optional: ["handle", "email"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute generateResetToken#run", 'debug');
        generateResetToken(api, connection, next);
    }
};
