/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var crypto = require('crypto');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');
var UnauthorizedError = require('../errors/UnauthorizedError');

/**
 * The sso hash secret
 */
var SSO_HASH_SECRET = 'GKDKJF80dbdc541fe829898aa01d9e30118bab5d6b9fe94fd052a40069385f5628';

/**
 * The API for TC SSO Cookie Validation
 */
exports.ssoValidation = {
    name: 'ssoValidation',
    description: 'ssoValidation',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['informixoltp'],
    run: function (api, connection, next) {
        api.log('Execute ssoValidation#run', 'debug');
        var helper = api.helper,
            dbConnectionMap = connection.dbConnectionMap,
            result,
            userId,
            error,
            receivedHashedValue;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                var tcsso = api.utils.parseCookies(connection.rawConnection.req).tcsso,
                    parts;
                if (!tcsso) {
                    cb(new BadRequestError('No sso cookie has been received.'));
                    return;
                }
                parts = tcsso.split('|');
                if (parts.length !== 2) {
                    cb(new BadRequestError('Invaid sso cookie format.'));
                    return;
                }
                userId = Number(parts[0]);
                error = helper.checkMaxInt(userId, 'userId');
                if (error) {
                    cb(error);
                    return;
                }
                receivedHashedValue = parts[1];
                api.dataAccess.executeQuery('userid_to_password', { uid: userId }, dbConnectionMap, cb);
            }, function (results, cb) {
                if (results.length === 0) {
                    cb(new BadRequestError('Invalid sso cookie - user id doesn\'t exist.'));
                    return;
                }
                var password = results[0].password,
                    status = results[0].status,
                    plainString = SSO_HASH_SECRET + userId + password + status,
                    realHashedValue = crypto.createHash('sha256').update(plainString).digest('hex');

                if (realHashedValue !== receivedHashedValue) {
                    cb(new BadRequestError('Invalid sso cookie (hash not matched).'));
                    return;
                }
                result = { userId : userId };
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
};
