/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author LazyChild, isv, Ghost_141
 * 
 * changes in 1.1
 * - implemented generateResetToken function
 * Changes in 1.2:
 * - Implement the Reset Password API
 * Changes in 1.3:
 * - Update reset password api to use resetMemberPasswordLDAPEntry in ldapHelper.js
 * - Update generate token to allow social login user update their password.
 */
"use strict";

var async = require('async');
var stringUtils = require("../common/stringUtils.js");
var moment = require('moment-timezone');
var _ = require('underscore');

var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require('../errors/BadRequestError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
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
 * Reset Password.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
function resetPassword(api, connection, next) {
    var result, helper = api.helper, sqlParams, userId, ldapEntryParams,
        dbConnectionMap = connection.dbConnectionMap,
        token = connection.params.token,
        handle = decodeURI(connection.params.handle),
        newPassword = connection.params.password,
        tokenKey = api.config.tcConfig.resetTokenPrefix + handle.toLowerCase() + api.config.tcConfig.resetTokenSuffix;

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
                cb(new NotFoundError('This handle does not exist.'));
                return;
            }
            userId = result[0].user_id;
            sqlParams.handle = result[0].handle;
            helper.getCachedValue(tokenKey, cb);
        },
        function (cache, cb) {
            if (!_.isDefined(cache)) {
                // The token is either not assigned or is expired.
                cb(new BadRequestError('This token is incorrect or expired. Please enter a new one.'));
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
                cb(new Error('Password update unsuccessful.'));
                return;
            }
            ldapEntryParams = {
                userId: userId,
                handle: sqlParams.handle,
                newPassword: newPassword
            };
            api.ldapHelper.resetMemberPasswordLDAPEntry(ldapEntryParams, cb);
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
    var tokenCacheKey = api.config.tcConfig.resetTokenPrefix + userHandle.toLowerCase() + api.config.tcConfig.resetTokenSuffix,
        current,
        expireDate,
        expireDateString,
        emailParams;

    api.helper.getCachedValue(tokenCacheKey, function (err, token) {
        if (err) {
            callback(err);
        } else if (token) {
            // Non-expired token already exists for this user - raise an error
            callback(new BadRequestError("You have already requested the reset token. Please find it in your email inbox."
                + " If it's not there, please contact support@topcoder.com."));
        } else {
            // There is no token - generate new one
            var newToken = stringUtils.generateRandomString(TOKEN_ALPHABET, 6),
                lifetime = api.config.tcConfig.defaultResetPasswordTokenCacheLifetime;
            api.cache.save(tokenCacheKey, newToken, lifetime);

            // Send email with token to user
            current = new Date();
            expireDate = current.setSeconds(current.getSeconds() + lifetime / 1000);
            expireDateString = moment(expireDate).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss z');
            var tcSiteAddress = process.env.TOPCODER_SITE;
            emailParams = {
                handle: userHandle,
                token: newToken,
                expiry: expireDateString,
                tcSiteAddress:tcSiteAddress,
                template: 'reset_token_email',
                subject: api.config.tcConfig.resetPasswordTokenEmailSubject,
                toAddress: userEmailAddress
            };
            api.tasks.enqueue("sendEmail", emailParams, 'default');

            callback(null, newToken);
        }
    });
};


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
                handle: caller.handle,
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
        var socialLoginProviderName;
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
                        socialLoginProviderName = result.social_login_provider_name;
                    }
                    // Generate reset password token for user
                    generateResetToken(result.handle, result.email_address, api, cb);

                }
            ], function (err, newToken) {
                if (err) {
                    api.helper.handleError(api, connection, err);
                } else if (socialLoginProviderName) {
                    connection.response = {socialProvider: socialLoginProviderName};
                } else if (newToken) {
                    connection.response = {successful: true};
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
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
