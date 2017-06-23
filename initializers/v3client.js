/*
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 *
 * V3 API client
 *
 * @version 1.0
 * @author GFalcon
 */
"use strict";
/*jslint nomen: true*/

var request = require('request');
var _ = require('underscore');
var async = require('async');

/**
 * The URL of the V3 API
 */
var v3url = process.env.TC_API_V3_URL || 'http://localhost:8084/v3/';

/**
 * Cached V3 API tokens.
 * 
 * This object stores V2 tokens as keys and V3 tokens as values
 */
var tokens = {};

/**
 * Call the service. It handles both errors and bad response status codes.
 *
 * @param {Object} params - parameters for a request
 * @param {Function<err, body>} callback - the callback function. 
 *      It will get either an Error object or a response body.
 */
function callService(params, callback) {
    params.json = true;
    request(params, function (err, response, body) {
        if (err) {
            callback(err);
            return;
        }
        /*jslint eqeq: true*/
        if (response.statusCode != 200) {
            /*jslint eqeq: false*/
            callback(new Error('API ' + params.url + ' returned ' + response.statusCode + ' ' + (response.statusMessage || '')));
            return;
        }
        callback(null, body);
    });
}

/**
 * Get the V3 API authorization token to use in subsequent calls
 *
 * @param {Object} connection - the connection object provided by ActionHero
 * @param {Function<err, token>} callback - this function receives either an error,
 *        a V3 token or nothing at all (if the current connection's user is anonymous)
 */
function getToken(connection, callback) {
    // Anonymous
    if (_.isUndefined(connection.authToken)) {
        callback();
        return;
    }
    // Cached token
    if (!_.isUndefined(tokens[connection.authToken])) {
        callback(null, tokens[connection.authToken]);
        return;
    }
    // Get the token by calling the API
    callService({
        url: v3url + 'authorizations',
        method: 'POST',
        body: {
            param: {
                externalToken: connection.authToken
            }
        }
    }, function (err, body) {
        if (err) {
            callback(err);
        } else {
            tokens[connection.authToken] = body.result.content.token;
            callback(null, body.result.content.token);
        }
    });
}

/**
 * Get IDs of users in the specified group
 *
 * @param {Object} connection - the connection object provided by ActionHero
 * @param {Number} groupId - the group ID
 * @param {Function<err, members>} callback - the callback. Receives either an error
 *        or the list of group's users as an array of numeric IDs
 */
function getGroupMembers(connection, groupId, callback) {
    getToken(connection, function (err, token) {
        if (err) {
            callback(err);
            return;
        }
        callService({
            url: v3url + 'groups/' + groupId + '/members',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }, function (err, body) {
            if (err) {
                callback(err);
            } else {
                callback(null, body.result.content.map(function (item) {
                    return item.memberId;
                }));
            }
        });
    });
}

/**
 * Get IDs of groups the specified user belongs to
 *
 * @param {Object} connection - the connection object provided by ActionHero
 * @param {Number} userId - the user ID
 * @param {Function<err, groups>} callback - the callback. Receives either an error
 *        or the list of user's groups as an array of numeric IDs
 */
function getUserGroups(connection, userId, callback) {
    getToken(connection, function (err, token) {
        if (err) {
            callback(err);
            return;
        }
        callService({
            url: v3url + 'groups?memberId=' + userId + '&membershipType=user',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }, function (err, body) {
            if (err) {
                callback(err);
            } else {
                callback(null, body.result.content.map(function (item) {
                    return item.id;
                }));
            }
        });
    });
}

exports.v3client = function (api, next) {
    api.v3client = {
        /**
         * Check if the user belongs to the group
         *
         * @param {Object} connection - the connection object provided by ActionHero
         * @param {Number} userId - the user ID
         * @param {Number} groupId - the group ID
         * @param {Function<err, isIn>} callback - the callback. The second parameter
         *        is boolean vwhich is true if the user is found in the group.
         */
        isUserInGroup: function (connection, userId, groupId, callback) {
            getGroupMembers(connection, groupId, function (err, members) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, members.indexOf(userId) >= 0);
                }
            });
        },
        
        getMyGroups: function (connection, callback) {
            getUserGroups(connection, (connection.caller.userId || 0), callback);
        }
    };
    next();
};
