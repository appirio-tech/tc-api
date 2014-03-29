/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author LazyChild, Ghost_141
 *
 * Changes in 1.1:
 * - Implement the update password API.
 */
"use strict";

var async = require('async');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');

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
            } else if (connection.params.handle === "badLuck" || connection.params.email === "badLuck@test.com") {
                cb(new Error("Unknown server error. Please contact support."));
            } else {
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
 * Update the password
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.1
 */
var updatePassword = function (api, connection, next) {
    var helper = api.helper, newPasswordEnc, oldPasswordEnc,
        oldPassword = connection.params.oldPassword,
        newPassword = connection.params.newPassword,
        caller = connection.caller,
        result;
    async.waterfall([
        function (cb) {
            var error = helper.checkMember(connection, 'Authorization information needed.') ||
                helper.validatePassword(newPassword);
            if (error) {
                cb(error);
                return;
            }

            newPasswordEnc = helper.encodePassword(newPassword, helper.PASSWORD_HASH_KEY);
            oldPasswordEnc = helper.encodePassword(oldPassword, helper.PASSWORD_HASH_KEY);
            api.dataAccess.executeQuery('update_password_by_old_password',
                { new_password: newPasswordEnc, handle: caller.handle, old_password: oldPasswordEnc },
                connection.dbConnectionMap, cb);
        },
        function (count, cb) {
            if (count === 0) {
                cb(new ForbiddenError('The oldPassword is not correct.'));
                return;
            }

            if (count !== 1) {
                cb(new Error('password is not updated successfully'));
                return;
            }
            var ldapEntryParams = {
                userId: caller.userId,
                oldPassword: oldPassword,
                newPassword: newPassword
            };
            api.ldapHelper.updateMemberPasswordLDAPEntry(ldapEntryParams, cb);
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
    run: function (api, connection, next) {
        api.log("Execute resetPassword#run", 'debug');
        resetPassword(api, connection, next);
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

/**
 * Update password API
 * @since 1.1
 */
exports.updatePassword = {
    name: 'updatePassword',
    description: 'update user password to new password',
    inputs: {
        required: ['oldPassword', 'newPassword'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version : 'v2',
    cacheEnabled : false,
    transaction : 'write',
    databases : ['common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute updatePassword#run', 'debug');
            updatePassword(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
