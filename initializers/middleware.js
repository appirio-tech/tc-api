/*jslint nomen: true */
/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author vangavroche, TCSASSEMBLER
 * changes in 1.1:
 * - add cache support (add preCacheProcessor and postCacheProcessor)
 * changes in 1.2:
 * - new oauth authentication middleware
 * - remove authorize, oauthProcessor, getHeader
 * - add authorizationPreProcessor
 * changes in 1.3:
 * - add force refresh check for preCacheProcessor
 */
"use strict";

/**
 * Module dependencies.
 */
var http = require('http');
var async = require('async');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * The list of private action name.
 * TODO: This is just a temporary implement.
 */
var PRIVATE_ACTIONS = ['getActiveBillingAccounts', 'getClientChallengeCosts', 'getChallengeCosts',
        'getChallengeTerms', 'getBasicUserProfile', 'getMyProfile', 'getClientActiveChallengeCosts', 'getSoftwareChallenge', 'getStudioChallenge', 'getChallenge'];

/**
 * calculate the key for cache.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @returns {String} the key value.
 */
var calculateCacheKey = function (api, connection) {
    var key = '', userId = connection.caller.userId || 0;
    if (PRIVATE_ACTIONS.indexOf(connection.action) >= 0) {
        key = "actions-" + connection.action + '-' + userId + '-' + api.helper.createCacheKey(connection, true);
    } else {
        key = "actions-" + connection.action + '-' + api.helper.createCacheKey(connection, false);
    }
    return key;
};

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
    function authorizationPreProcessor(connection, actionTemplate, next) {
        var authHeader = connection.rawConnection.req.headers.authorization,
            connectionMap = { "common_oltp": api.dataAccess.createConnection("common_oltp") },
            isTopcoderAD,
            cachePrefix = "authorizationPreProcessor::",
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
                    api.config.general.oauthClientSecret,
                    { audience: api.config.general.oauthClientId },
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
                var lifetime = api.config.general.defaultAuthMiddlewareCacheLifetime;

                //don't re-set cache
                if (isCachedReturned) {
                    cb();
                } else {
                    api.cache.save(cacheKey, userInfo, lifetime, cb);
                }
            }
        ], function (err) {
            connectionMap.common_oltp.disconnect();
            if (!err) {
                next(connection, true);
                return;
            }
            api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
            var errorMessage, baseError, errdetail;
            //error messages returned by jwt.verify(...) method
            if (err.message.indexOf('Invalid token') !== -1 ||
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
     * The pre-processor that checks if user is slamming.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Function<connection, toRender>} next The callback function
     * @since 1.1
     */
    function preThrottleProcessor(connection, actionTemplate, next) {
        var key = api.helper.createCacheKey(connection, true);
        api.log('Throttle check. Action: "' + actionTemplate.name + '" connection.id: "' + connection.id + '" key: "' + key + '"', 'debug');
        api.helper.getCachedValue(key, function (err, value) {
            if (value) {
                api.log('Ignoring duplicate request from same user!', 'notice');
                connection.response.error = api.helper.apiCodes.badRequest;
                connection.response.error.details = 'This request was ignored because you have an identical request still processing.';
                connection.rawConnection.responseHttpCode = api.helper.apiCodes.badRequest.value;
                next(connection, false);
            } else {
                api.cache.save(key, key, 30000, function (err) {
                    if (err) {
                        api.helper.handleError(api, connection, err);
                    }
                    next(connection, true);
                });
            }
        });
    }

    /**
     * The post-processor to clear user for further requests.
     *
     * @param {Object} connection The connection object for the current request
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Boolean} toRender The flag whether response should be rendered
     * @param {Function<connection, toRender>} next The callback function
     * @since 1.1
     */
    function postThrottleProcessor(connection, actionTemplate, toRender, next) {

        var key = api.helper.createCacheKey(connection, true);
        //api.log('connection.id: ' + connection.id, 'debug');
        //api.log('key: ' + key, 'debug');
        api.cache.destroy(key, function (err) {
            if (err) {
                api.log('Throttle cache object was not found. This is unexpected. ' + err, 'warn');
            }
            next(connection, toRender);
        });
    }


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
        //by default enabled, but turn it off if the global cache timeout is set to less to zero and local action doesn't have a timeout set (this logic is mostly for test purposes)
        if (actionTemplate.cacheEnabled === false || (api.config.general.defaultCacheLifetime < 0 && !actionTemplate.cacheLifetime)) {
            next(connection, true);
            return;
        }

        var key, forceRefresh;
        forceRefresh = api.helper.checkRefresh(connection);
        key = calculateCacheKey(api, connection);
        if (forceRefresh) {
            api.log('Force refresh without cache', 'debug');
            postThrottleProcessor(connection, actionTemplate, true, next);
            return;
        }

        api.helper.getCachedValue(key, function (err, value) {
            if (value) {
                api.log('Returning cached response', 'debug');
                connection.response = value;
                //manually call the postThrottleProcessor here since we're returning the cache value and halting further processing
                postThrottleProcessor(connection, actionTemplate, false, next);
                //next(connection, false);
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

        var key = calculateCacheKey(api, connection);

        async.waterfall([
            function (cb) {
                api.helper.getCachedValue(key, cb);
            }, function (value, cb) {
                if (value || connection.response.error) {
                    cb();
                    return;
                }
                var response = _.clone(connection.response),
                    lifetime = actionTemplate.cacheLifetime || api.config.general.defaultCacheLifetime;
                delete response.serverInformation;
                delete response.requesterInformation;
                api.cache.save(key, response, lifetime, cb);
            }
        ], function (err) {
            if (err) {
                api.helper.handleError(api, connection, err);
            }
            next(connection, toRender);
        });
    }

    api.actions.preProcessors.push(authorizationPreProcessor);
    //api.actions.preProcessors.push(preThrottleProcessor);
    api.actions.preProcessors.push(preCacheProcessor);
    api.actions.postProcessors.push(postCacheProcessor);
    //api.actions.postProcessors.push(postThrottleProcessor);
    next();
};
