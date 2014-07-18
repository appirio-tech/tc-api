/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
/*jslint unparam: true */
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var NotFoundError = require('../errors/NotFoundError');
var request = require('request');


/**
 * The API for generating jwt token
 */
exports.action = {
    name: "generateJwt",
    description: "generateJwt",
    inputs: {
        required: ["username", "password"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        if (!_.isDefined(connection.dbConnectionMap)) {
            api.helper.handleNoConnection(api, connection, next);
            return;
        }
        api.log("Execute generateJwt#run", 'debug');
        var form = {
            grant_type: "password",
            username: connection.params.username,
            password: connection.params.password,
            client_id: api.config.tcConfig.oauthClientId,
            connection: api.config.tcConfig.oauthConnection,
            scope: "openid"
        },
            url = "https://" + api.config.tcConfig.oauthDomain + ".auth0.com/oauth/ro";
        async.waterfall([
            function (cb) {
                // Check user activated or not.
                api.helper.checkUserActivated(connection.params.username, api, connection.dbConnectionMap, function (err, userUnactivatedError) {
                    if (err) {
                        // The server internal error. It should be connection error at most of time.
                        cb(err);
                    } else {
                        if (_.isDefined(userUnactivatedError)) {
                            // The user is not activated.
                            cb(new NotFoundError("The user is not activated."));
                        } else {
                            // The user is activated.
                            cb();
                        }
                    }
                });
            },
            function (cb) {
                request.post({url: url, form: form}, cb);
            }, function (notUsed, body, cb) {
                var json;
                try {
                    json = JSON.parse(body);
                } catch (e) {
                    cb(new Error('Invalid response form oauth0'));
                    return;
                }
                if (json.error) {
                    if (json.error === "invalid_user_password") {
                        cb(new BadRequestError("Invalid username or password"));
                    } else {
                        cb(new Error(json.error_description));
                    }
                } else {
                    cb(null, json.id_token);
                }
            }
        ], function (err, token) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {token : token};
            }
            next(connection, true);
        });
    }
};

/**
 * The API for refreshing jwt token
 */
exports.refreshJwt = {
    name: "refreshJwt",
    description: "refreshJwt",
    inputs: {
        required: ["token"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log("Execute refreshJwt#run", 'debug');
        var form = {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            id_token: connection.params.token,
            client_id: api.config.tcConfig.oauthClientId,
            target: api.config.tcConfig.oauthClientId,
            scope: "openid"
        },
            url = "https://" + api.config.tcConfig.oauthDomain + ".auth0.com/delegation";
        async.waterfall([
            function (cb) {
                request.post({url: url, form: form}, cb);
            }, function (notUsed, body, cb) {
                var json;
                try {
                    json = JSON.parse(body);
                } catch (e) {
                    cb(new Error('Invalid response form oauth0'));
                    return;
                }
                if (json.error) {
                    if (json.error === "invalid_user_password") {
                        cb(new BadRequestError("Invalid username or password"));
                    } else {
                        cb(new Error(json.error_description));
                    }
                } else {
                    cb(null, json.id_token);
                }
            }
        ], function (err, token) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {token : token};
            }
            next(connection, true);
        });
    }
};
