/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author LazyChild
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
        function(cb) {
            if (connection.params.handle == "nonValid") {
                cb(new BadRequestError("The handle you entered is not valid"));
                return;
            } else if (connection.params.handle == "badLuck") {
                cb(new Error("Unknown server error. Please contact support."));
                return;
            } else if (connection.params.token == "unauthorized_token") {
                cb(new UnauthorizedError("Authentication credentials were missing or incorrect."));
                return;
            } else if (connection.params.token == "forbidden_token") {
                cb(new ForbiddenError("The request is understood, but it has been refused or access is not allowed."));
                return;
            }
            result = {
                "description": "Your password has been reset!"
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
        function(cb) {
            if (connection.params.handle == "nonValid" || connection.params.email == "nonValid@test.com") {
                cb(new BadRequestError("The handle you entered is not valid"));
                return;
            } else if (connection.params.handle == "badLuck" || connection.params.email == "badLuck@test.com") {
                cb(new Error("Unknown server error. Please contact support."));
                return;
            }

            if (connection.params.handle == "googleSocial" || connection.params.email == "googleSocial@test.com") {
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
