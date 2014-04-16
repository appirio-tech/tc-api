/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
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
    run: function (api, connection, next) {
        api.log("Execute generateJwt#run", 'debug');
        var form = {
            grant_type: "password",
            username: connection.params.username,
            password: connection.params.password,
            client_id: api.config.general.oauthClientId,
            connection: api.config.general.oauthConnection,
            scope: "openid"
        },
            url = "https://" + api.config.general.oauthDomain + ".auth0.com/oauth/ro";
        async.waterfall([
            function (cb) {
                request.post({url: url, form: form}, cb);
            }, function (response, body, cb) {
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
            client_id: api.config.general.oauthClientId,
            target: api.config.general.oauthClientId,
            scope: "openid"
        },
            url = "https://" + api.config.general.oauthDomain + ".auth0.com/delegation";
        async.waterfall([
            function (cb) {
                request.post({url: url, form: form}, cb);
            }, function (response, body, cb) {
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
