/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var validator = require('validator');

/**
 * The API for create customer
 */
exports.emailValidation = {
    name: 'emailValidation',
    description: 'emailValidation',
    inputs: {
        required: ['email'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['common_oltp'],
    run: function (api, connection, next) {
        api.log('Execute createCustomer#run', 'debug');
        var helper = api.helper,
            email = connection.params.email,
            dbConnectionMap = connection.dbConnectionMap,
            isValid = true,
            params;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                if (!validator.isEmail(email)) {
                    isValid = false;
                    cb();
                    return;
                }
                params = { email: email };
                api.dataAccess.executeQuery('check_email_exist', params, dbConnectionMap, function (err, results) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (results.length !== 0) {
                        isValid = false;
                        cb();
                        return;
                    }
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = { available: isValid };
            }
            next(connection, true);
        });
    }
};
