/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author vangavroche, TCSASSEMBLER
 * changes in 1.1:
 * - add cache support (add preCacheProcessor and postCacheProcessor)
 * changes in 1.2:
 * - new oauth authentication middleware
 * - remove authorize, oauthProcessor, getHeader
 * - add oauthPreProcessor
 */
"use strict";

/**
 * Module dependencies.
 */
var http = require('http');
var async = require('async');
var _ = require('underscore');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * Expose the middleware function to add the pre-processor for authentication via Oauth.
 *
 * @param {Object} api The api object used to access the infrastructure.
 * @param {Function<err>} next The callback function
 */
exports.middleware = function (api, next) {

    /**
     * The pre-processor that check the JWT token and handle authorization process.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Function<connection, toRender>} next The callback function
     * @since 1.2
     */
    /*jslint unparam: true */
    function oauthPreProcessor(connection, actionTemplate, next) {
        var authHeader = connection.rawConnection.req.headers.authorization,
            connectionMap = { "common_oltp": api.dataAccess.createConnection("common_oltp") },
            isTopcoderAD,
            cachePrefix = "oauthPreProcessor::",
            decoded,
            isCachedReturned,
            cacheKey,
            socialUserId,
            socialProvider;
        if (!_.isDefined(authHeader)) {
            connection.caller = {accessLevel: "anon"};
            next(connection, true);
            return;
        }
        async.waterfall([
            function (cb) {
                var reg = /^bearer ([\s\S]+)$/i;
                if (!reg.test(authHeader)) {
                    cb(new IllegalArgumentError("Malformed Auth header"));
                    return;
                }
                cb(null, reg.exec(authHeader)[1]);
            }, function (token, cb) {
                jwt.verify(token,
                    api.configData.general.oauthClientSecret,
                    { audience: api.configData.general.oauthClientId },
                    cb);
            }, function (result, cb) {
                decoded = result;
                if (!_.isDefined(decoded.sub)) {
                    cb(new IllegalArgumentError('Malformed Auth header. No sub in token!'));
                    return;
                }
                var split = decoded.sub.split("|");
                socialUserId = (split.pop() || "").trim();
                socialProvider = (split.pop() || "").trim();
                if (!_.isDefined(socialUserId) || socialUserId.length === 0) {
                    cb(new IllegalArgumentError('Malformed Auth header. No userId in token.sub!'));
                    return;
                }
                if (!_.isDefined(socialProvider) || socialProvider.length === 0) {
                    cb(new IllegalArgumentError('Malformed Auth header. No provider in token.sub!'));
                    return;
                }
                api.helper.getProviderId(socialProvider, cb);
            }, function (providerId, cb) {
                isTopcoderAD = providerId === api.helper.socialProviders.ad;
                cacheKey = cachePrefix + decoded.sub;
                api.cache.load(cacheKey, function (err, value) {
                    var userId;
                    if (!err) { //err occurs only when key was not found
                        isCachedReturned = true;
                        cb(null, value);
                        return;
                    }
                    async.waterfall([
                        function (cbx) {
                            //initialize connection only if cache is empty
                            connectionMap.common_oltp.initialize().connect(cbx);
                        }, function (cbx) {
                            if (isTopcoderAD) {
                                userId = Number(socialUserId);
                                cbx(api.helper.checkPositiveInteger(userId, "userId"));
                                return;
                            }
                            api.dataAccess.executeQuery("get_user_by_social_login",
                                {
                                    social_user_id: socialUserId,
                                    provider_id: providerId
                                },
                                connectionMap,
                                cbx);
                        }, function (result, cbx) {
                            if (isTopcoderAD) {
                                cbx = result;
                            } else {
                                if (!result.length) {
                                    cb(new Error('social login not found'));
                                    return;
                                }
                                userId = result[0].user_id;
                            }
                            cbx();
                        }, function (cbx) {
                            async.parallel({
                                handle: function (cbk) {
                                    api.dataAccess.executeQuery("get_user_handle", {user_id: userId}, connectionMap, cbk);
                                },
                                isAdmin: function (cbk) {
                                    api.dataAccess.executeQuery("check_is_admin", {user_id: userId}, connectionMap, cbk);
                                }
                            }, cbx);
                        }, function (results, cbx) {
                            connectionMap.common_oltp.disconnect();
                            var userInfo = {
                                userId: userId
                            },
                                adminResult = results.isAdmin,
                                handleResult = results.handle;
                            if (!handleResult.length) {
                                cbx(new Error('user not found with id=' + userId));
                                return;
                            }
                            userInfo.handle = handleResult[0].handle;
                            if (adminResult.length && adminResult[0].count !== 0) {
                                userInfo.accessLevel = "admin";
                            } else {
                                userInfo.accessLevel = "member";
                            }
                            cbx(null, userInfo);
                        }
                    ], cb);
                });
            }, function (userInfo, cb) {
                connection.caller = userInfo;
                var lifetime = api.configData.general.defaultCacheLifetime;

                //don't re-set cache
                if (isCachedReturned) {
                    cb();
                } else {
                    api.cache.save(cacheKey, userInfo, lifetime, cb);
                }
            }
        ], function (err) {
            if (!err) {
                next(connection, true);
                return;
            }
            api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
            var errorMessage, baseError, errdetail;
            //error messages returned by jwt.verify(...) method
            if (err.message === "Cannot read property 'alg' of undefined" ||
                    String(err.message).startsWith("jwt audience invalid.") ||
                    err.message === "invalid signature") {
                errorMessage = "Malformed Auth header";
                baseError = api.helper.apiCodes.badRequest;
            } else if (err.message === "jwt expired") {
                errorMessage = "JWT is expired";
                baseError = api.helper.apiCodes.badRequest;
            } else if (err instanceof IllegalArgumentError) {
                errorMessage = err.message;
                baseError = api.helper.apiCodes.badRequest;
            } else {
                errorMessage = err.message;
                baseError = api.helper.apiCodes.serverError;
            }
            errdetail = _.clone(baseError);
            errdetail.details = errorMessage;
            connection.rawConnection.responseHttpCode = baseError.value;
            connection.response = { error: errdetail };
            next(connection, false);
        });
    }
    /*jslint */

    /**
     * Create unique cache key for given connection.
     * Key depends on action name and query parameters (connection.params).
     *
     * @param {Object} connection The connection object for the current request
     * @return {String} the key
     */
    function createCacheKey(connection) {
        var sorted = [], prop, val, json;
        for (prop in connection.params) {
            if (connection.params.hasOwnProperty(prop)) {
                val = connection.params[prop];
                if (_.isString(val)) {
                    val = val.toLowerCase();
                }
                sorted.push([prop, val]);
            }
        }
        sorted.sort(function (a, b) {
            return a[1] - b[1];
        });
        json = JSON.stringify(sorted);
        return crypto.createHash('md5').update(json).digest('hex');
    }

    /**
     * Get cached value for given connection. If object doesn't exist or is expired then null is returned.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Function<err, value>} callback The callback function
     * @since 1.1
     */
    /*jslint unparam: true */
    function getCachedValue(connection, callback) {
        var key = createCacheKey(connection);
        api.cache.load(key, function (err, value) {
            //ignore err
            //err can be only "Object not found" or "Object expired"
            callback(null, value);
        });
    }
    /*jslint */

    /**
     * The pre-processor that check the cache.
     * If cache exists then cached response is returned.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Function<connection, toRender>} next The callback function
     * @since 1.1
     */
    function preCacheProcessor(connection, actionTemplate, next) {
        //by default enabled
        if (actionTemplate.cacheEnabled === false) {
            next(connection, true);
            return;
        }

        getCachedValue(connection, function (err, value) {
            if (value) {
                api.log('Returning cached response', 'debug');
                connection.response = value;
                next(connection, false);
            } else {
                next(connection, true);
            }
        });
    }

    /**
     * The post-processor that save response to cache.
     * Cache is not saved if error occurred.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Boolean} toRender The flag whether response should be rendered
     * @param {Function<connection, toRender>} next The callback function
     * @since 1.1
     */
    function postCacheProcessor(connection, actionTemplate, toRender, next) {
        //by default enabled
        if (actionTemplate.cacheEnabled === false) {
            next(connection, toRender);
            return;
        }

        async.waterfall([
            function (cb) {
                getCachedValue(connection, cb);
            }, function (value, cb) {
                if (value || connection.response.error) {
                    cb();
                    return;
                }
                var response = _.clone(connection.response),
                    lifetime = actionTemplate.cacheLifetime || api.configData.general.defaultCacheLifetime,
                    key = createCacheKey(connection);
                delete response.serverInformation;
                delete response.requestorInformation;
                api.cache.save(key, response, lifetime, cb);
            }
        ], function (err) {
            if (err) {
                api.helper.handleError(api, connection, err);
            }
            next(connection, toRender);
        });
    }

    api.actions.preProcessors.push(oauthPreProcessor);
    api.actions.preProcessors.push(preCacheProcessor);
    api.actions.postProcessors.push(postCacheProcessor);
    next();
};
