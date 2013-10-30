/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: vangavroche
 */
"use strict";

/**
 * Module dependencies.
 */
var http = require('http');
var xml2js = require('xml2js');

/**
 * Define the config to get the API Host from the environment variables.
 */
var config = {
    apiHost : process.env.TC_API_HOST || 'api.topcoder.com',
};

/**
 * Helper function to get the header value from the request object
 * @param {Object} req The request from where the header is obtained
 * @param {String} name The name of the header.
 */
var getHeader = function (req, name) {
    name = name.toLowerCase();
    switch (name) {
    case 'referer':
    case 'referrer':
        return req.headers.referrer || this.headers.referer;
    default:
        return req.headers[name];
    }
};

/**
 * Expose the middleware function to add the pre-processor for authentication via Oauth.
 *
 * @param {Object} api The api object used to access the infrastructure.
 * @param {Function} next The callback function
 */
exports.middleware = function (api, next) {
    var oauthProcessor, authorize;

    /**
     * Helper function to authorize request, given the header and the action scope.
     *
     * @param {String} authHeader The authorization header value
     * @param {String} actionScope The permission scope of the given action
     * @param {Function} done The callback function
     */
    authorize = function (authHeader, actionScope, done) {

        api.log("Authorize " + authHeader + " for " + actionScope);

        if (!authHeader || authHeader.trim().length === 0) {
            done("Authentication Header is missing", 403);
        } else {

            /**
             * Prepare the request options to sent the Authorization header for validation.
             */
            var requestOptions = {
                host : config.apiHost,
                path : '/oauth/oauth/validate',
                headers : {
                    Authorization : authHeader
                }
            };

            /**
             * Send validation request to the API endpoint that serves the OAuth token validation.
             */
            http.request(requestOptions, function (httpResponse) {
                httpResponse.setEncoding('utf8');
                var responseXML = '';
                httpResponse.on("data", function (chunk) {
                    responseXML += chunk;
                });

                httpResponse.on("end", function () {
                    var parseString = xml2js.parseString, tokenScopes;

                    parseString(responseXML, function (err, result) {
                        if (err) {
                            done("OAuth server returned invalid xml: " + responseXML, 500);
                        } else if (!result) {
                            done("OAuth server returned null. Check if your access token is correct and valid.", 500);
                        } else {
                            if (result.accessTokenValidation && result.accessTokenValidation.tokenScopes) {
                                var i;
                                if (result.accessTokenValidation.tokenScopes.length) {
                                    tokenScopes = result.accessTokenValidation.tokenScopes;
                                    for (i = 0; i < tokenScopes.length; i += 1) {
                                        if (tokenScopes[i].permission.indexOf(actionScope) !== -1) {
                                            done(null);
                                            return;
                                        }
                                    }
                                }
                            }
                            done("Not authorized", 403);
                        }
                    });
                });
            }).on("error", function () {
                api.log('Error sending request to the OAuth server', 'error');
                done("Error occurs during OAuth authorization", 500);
            }).end();
        }
    };

    /**
     * The pre-processor that check the action via OAuth.
     * Only the actions that have configured "permissionScope:<permission-scope>" are checked here
     *
     * @param {Object} connection The connection object for the current request 
     * @param {Object} actionTemplate The metadata of the current action object
     * @param {Function} next The callback function
     */
    oauthProcessor = function (connection, actionTemplate, next) {
        if (actionTemplate.permissionScope) {
            authorize(getHeader(connection.rawConnection.req, 'Authorization'), actionTemplate.permissionScope, function (error, statusCode) {
                if (error) {
                    connection.error = error;
                    connection.responseHttpCode = statusCode;
                    next(connection, false);
                } else {
                    next(connection, true);
                }
            });

        } else {
            next(connection, true);
        }
    };

    api.actions.preProcessors.push(oauthProcessor);
    next();
};
