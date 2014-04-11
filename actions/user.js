/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * It validates activation code and retrieves user id from activation code
 * @param {String} activationCode - activation code string
 * @param {Object} helper - helper object
 * @return {String} returns coder id 
 */
function getCoderId(activationCode, helper) {
    var coderId = helper.getCoderIdFromActivationCode(activationCode),
        generatedActivationCode = helper.generateActivationCode(coderId);
    if (activationCode === generatedActivationCode) {
        return coderId;
    }
    return 0;
}

/**
 * The API for activate user
 */
exports.activateUser = {
    name: 'activateUser',
    description: 'activateUser',
    inputs: {
        required: ['code'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ['common_oltp'],
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log('Execute activateUser#run', 'debug');
        var helper = api.helper,
            code = connection.params.code,
            dbConnectionMap = connection.dbConnectionMap,
            welcomeEmail = api.config.welcomeEmail,
            result,
            params = {},
            handle,
            email,
            userId;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                try {
                    userId = getCoderId(code, helper);
                } catch (err) {
                    cb(err);
                }
                // check code has valid hash
                if (userId === 0) {
                    cb(new IllegalArgumentError('Invalid activation code'));
                    return;
                }
                params.code = code;
                params.user_id = userId;
                // get activation code, user status and email status
                api.dataAccess.executeQuery('get_user_status', params, dbConnectionMap, cb);
            }, function (results, cb) {
                // no result
                if (results.length === 0) {
                    cb(new BadRequestError('Invalid activation code'));
                    return;
                }
                var activationCodeInDB = results[0].activation_code,
                    userStatus = results[0].user_status,
                    emailStatusId = results[0].email_status_id;
                handle = results[0].handle;
                email = results[0].email;
                if (code !== activationCodeInDB) {
                    cb(new BadRequestError('Invalid activation code'));
                    return;
                }
                if ('U' !== userStatus) {
                    cb(new BadRequestError('User has been activated'));
                    return;
                }
                if (1 === emailStatusId) {
                    cb(new BadRequestError('Email has been activated'));
                    return;
                }
                // udpate user and email
                async.parallel([
                    function (cbx) {
                        api.dataAccess.executeQuery("activate_user", params, dbConnectionMap, cbx);
                    }, function (cbx) {
                        api.dataAccess.executeQuery("activate_email", params, dbConnectionMap, cbx);
                    }
                ], cb);
            }, function (results, cb) {
                api.log('activate query result: ' + results, 'debug');
                // update LDAP
                api.ldapHelper.activateMemberProfileLDAPEntry({ userId : userId }, cb);
            }, function (results, cb) {
                api.log('ldap result: ' + results, 'debug');
                var emailParams = {
                    handle: handle,
                    toAddress: email,
                    template: welcomeEmail.template,
                    subject: welcomeEmail.subject,
                    fromAddress : welcomeEmail.fromAddress,
                    senderName : welcomeEmail.senderName
                };
                // send email
                api.tasks.enqueue("sendEmail", emailParams, 'default');
                result = { success: true };
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
