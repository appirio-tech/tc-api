/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var request = require('request');

var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * The login page.
 */
var LOGIN = "login";

/**
 * The register page.
 */
var REGISTER = "register";

/**
 * Set the name by provider id.
 *
 * @param resp - the json String
 * @param socialAccount - the socialAccount instance
 * @param helper - the helper instance
 * @returns socialAccount - the socialAccount instance
 */
function setName(resp, socialAccount, helper) {
    var providerId = socialAccount.providerId;

    if (providerId === helper.socialProviders.twitter) {
        socialAccount.name = resp.screen_name;
    } else if (providerId === helper.socialProviders.github) {
        socialAccount.name = resp.nickname;
    } else if (providerId === helper.socialProviders.ad) {
        socialAccount.name = resp.nickname;
        socialAccount.enterpriseLogin = true;
    } else {
        socialAccount.name = '';
    }

    return socialAccount;
}

/**
 * Parse the response json String to entity.
 *
 * @param resp - the response json String.
 * @param helper - the helper instance
 * @returns socialAccount - the parsed socialAccount instance.
 */
function parseUserInfo(resp, helper) {
    //set the default value
    var socialAccount = {
        "name": '',
        "email": '',
        "givenName": '',
        "familyName": '',
        "emailVerified": false,
        "providerId": 0,
        "enterpriseLogin": false,
        "socialUserId": '',
        "jsonWebToken": '',
        "accessToken": ''
    };

    if (_.isDefined(resp.identities) && resp.identities.length > 0) {
        socialAccount.socialUserId = resp.identities[0].user_id;
    }

    helper.getProviderId(resp.user_id, function (tmp, providerId) {
        socialAccount.providerId = providerId;
    });
    socialAccount = setName(resp, socialAccount, helper);

    if (_.isDefined(resp.email)) {
        socialAccount.email = resp.email;
    }

    if (_.isDefined(resp.email_verified)) {
        socialAccount.emailVerified = resp.email_verified;
    }

    if (_.isDefined(resp.family_name)) {
        socialAccount.familyName = resp.family_name;
    }

    if (_.isDefined(resp.given_name)) {
        socialAccount.givenName = resp.given_name;
    }

    return socialAccount;
}

/**
 * The method that exposes the auth0 Callback API.
 */
exports.action = {
    name: 'auth0Callback',
    description: 'The Auth0 Callback Method',
    inputs : {
        required : ['code'],
        optional : ['state']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        var helper = api.helper, code = connection.params.code, state = connection.params.state,
            dbConnectionMap = connection.dbConnectionMap, sqlParams = {}, accessToken, idToken, responseResult = {},
            socialAccount, foundUserId = '', nextPage = '';

        api.log("Executing auth0Callback#run", 'debug');
        api.log("code: " + code, 'debug');
        api.log("state: " + state, 'debug');

        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                if (_.isDefined(state)) {
                    var urls = state.split("?"), np, params;
                    if (urls.length > 1) {
                        np = decodeURI(urls[0]);
                        params = urls[1].split("&");
                        if (params.length > 1) {
                            nextPage = np;
                        } else {
                            nextPage = decodeURI(state);
                        }
                    } else {
                        nextPage = decodeURI(state);
                    }
                    responseResult.state = state;
                }
                responseResult.code = code;

                cb();
            }, function (cb) {
                //get access token from auth0
                request.post("https://" + api.config.general.oauthDomain + ".auth0.com/oauth/token", function (err, res, body) {
                    api.log("response body: " + body, 'debug');
                    api.log("err: " + err, 'debug');
                    if (err || (res.statusCode !== 200 && res.statusCode !== 201)) {
                        cb(new IllegalArgumentError("Fails to get access token from auth0."));
                        return;
                    }
                    var resp = JSON.parse(body);
                    accessToken = resp.access_token;
                    idToken = resp.id_token;
                    cb();
                }).form({
                    "client_id" : api.config.general.oauthClientId,
                    "client_secret" : api.config.auth0.clientSecret,
                    "redirect_uri": api.config.auth0.serverName + api.config.auth0.redirectUrl,
                    "grant_type": "authorization_code",
                    "code" : code,
                    "scope" : "openid"
                });
            }, function (cb) {
                //get user info from auth0
                request("https://" + api.config.general.oauthDomain + ".auth0.com/userinfo?access_token=" + accessToken,
                    function (err, res, body) {
                        api.log("response body: " + body, 'debug');
                        if (err || (res.statusCode !== 200 && res.statusCode !== 201)) {
                            cb(new IllegalArgumentError("Fails to get user info from auth0."));
                            return;
                        }

                        var resp = JSON.parse(body);
                        socialAccount = parseUserInfo(resp, helper);
                        socialAccount.accessToken = accessToken;
                        socialAccount.jsonWebToken = idToken;

                        cb();
                    });
            }, function (cb) {
                if (socialAccount.enterpriseLogin === true) {
                    api.log("ldap login - get user", "debug");
                    sqlParams.handle = socialAccount.name;
                    api.dataAccess.executeQuery('get_user_by_handle', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (data, cb) {
                if (socialAccount.enterpriseLogin === true) {
                    api.log("ldap login - get password", "debug");
                    if (data.length !== 0) {
                        responseResult.handle = data[0].handle;
                        responseResult.userId = data[0].id;
                        sqlParams.userId = data[0].id;
                    } else {
                        responseResult.handle = '';
                        responseResult.userId = 0;
                        sqlParams.userId = 0;
                    }

                    api.dataAccess.executeQuery('get_password_by_user_id', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (data, cb) {
                if (socialAccount.enterpriseLogin === true) {
                    api.log("ldap login - forward", "debug");
                    if (data.length !== 0) {
                        responseResult.password = data[0].password;
                    } else {
                        responseResult.password = '';
                    }

                    responseResult.result = LOGIN;
                    responseResult.nextPage = nextPage;
                    responseResult.socialAccount = socialAccount;
                    connection.response = responseResult;
                    next(connection, true);
                    return;
                }

                if (socialAccount.socialUserId !== '') {
                    api.log("social login", "debug");
                    sqlParams.socialUserId = socialAccount.socialUserId;
                    sqlParams.providerId = socialAccount.providerId;
                    api.dataAccess.executeQuery('get_user_id_by_social_user_id_and_provider_id', sqlParams,
                        dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            },
            function (data, cb) {
                if (data !== null && data.length > 0) {
                    foundUserId = data[0].user_id;
                }
                api.log("foundUserId:" + foundUserId, "debug");

                if (foundUserId === null || foundUserId === '') {
                    if (socialAccount.email === '' && socialAccount.name === '') {
                        cb(new NotFoundError("The social account should have at least one valid email or one valid username."));
                        return;
                    }

                    async.parallel({
                        getUserIdByEmail: function (cbx) {
                            if (socialAccount.email !== '') {
                                sqlParams.email = socialAccount.email;
                                if (socialAccount.emailVerified === true) {
                                    sqlParams.emailVerified = 't';
                                } else {
                                    sqlParams.emailVerified = 'f';
                                }
                                sqlParams.providerId = socialAccount.providerId;
                                api.dataAccess.executeQuery('get_user_id_by_social_account_email', sqlParams,
                                    dbConnectionMap, cbx);
                            } else {
                                cbx();
                            }
                        },
                        getUserIdByName: function (cbx) {
                            if (socialAccount.name !== '') {
                                sqlParams.userName = socialAccount.name;
                                sqlParams.providerId = socialAccount.providerId;
                                api.dataAccess.executeQuery('get_user_id_by_social_account_name', sqlParams,
                                    dbConnectionMap, cbx);
                            } else {
                                cbx();
                            }
                        }
                    }, cb);
                } else {
                    cb(null, null);
                }
            }, function (data, cb) {
                api.log("foundUserId:" + foundUserId, "debug");
                if (foundUserId === null || foundUserId === '') {
                    if (data !== null && data.getUserIdByEmail !== null && data.getUserIdByEmail !== undefined
                            && data.getUserIdByEmail.length > 0) {
                        foundUserId = data.getUserIdByEmail[0].user_id;
                    } else if (data !== null && data.getUserIdByName !== null && data.getUserIdByName !== undefined
                            && data.getUserIdByName.length > 0) {
                        foundUserId = data.getUserIdByName[0].user_id;
                    }

                    if (foundUserId !== null && foundUserId !== '') {
                        sqlParams.socialUserId = socialAccount.socialUserId;
                        sqlParams.userId = foundUserId;
                        api.dataAccess.executeQuery('update_social_user_id', sqlParams, dbConnectionMap, cb);
                    } else {
                        cb(null);
                    }
                } else {
                    cb(null);
                }
            }, function (cb) {
                if (foundUserId !== null && foundUserId !== '') {
                    sqlParams.userId = foundUserId;
                    api.dataAccess.executeQuery('get_user_by_user_id', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (data, cb) {
                if (foundUserId !== null && foundUserId !== '') {
                    if (data.length !== 0) {
                        responseResult.handle = data[0].handle;
                        responseResult.userId = data[0].id;
                        sqlParams.userId = data[0].id;
                    } else {
                        responseResult.handle = '';
                        responseResult.userId = 0;
                        sqlParams.userId = 0;
                    }

                    api.dataAccess.executeQuery('get_password_by_user_id', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (data, cb) {
                //found user, redirect to next page
                if (foundUserId !== null && foundUserId !== '') {
                    if (data.length !== 0) {
                        responseResult.password = data[0].password;
                    } else {
                        responseResult.password = '';
                    }

                    responseResult.result = LOGIN;
                    responseResult.nextPage = nextPage;
                    responseResult.socialAccount = socialAccount;

                    connection.response = responseResult;
                    next(connection, true);
                    return;
                }

                //did not find the user, redirect to register page
                responseResult.regUrl = "http://www.topcoder.com/?action=callback#access_token="
                    + socialAccount.accessToken + "&id_token="
                    + socialAccount.jsonWebToken
                    + "&token_type=bearer&state=http%3A%2F%2Fwww.topcoder.com";

                responseResult.nextPage = nextPage;
                responseResult.result = REGISTER;
                responseResult.socialAccount = socialAccount;
                connection.response = responseResult;
                cb();
            }

        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            }

            next(connection, true);
        });
    }
};