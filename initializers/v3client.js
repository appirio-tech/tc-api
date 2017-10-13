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
var atob = require('atob');

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
    if (!_.isUndefined(tokens[connection.authToken]) && !isTokenExpired(tokens[connection.authToken])) {
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


function urlBase64Decode(str) {
    var output = str.replace(/-/g, '+').replace(/_/g, '/');

    switch (output.length % 4) {
        case 0:
            break;

        case 2:
            output += '==';
            break;

        case 3:
            output += '=';
            break;

        default:
            throw 'Illegal base64url string!'
    }
    return decodeURIComponent(escape(atob(output)));//polyfill https://github.com/davidchambers/Base64.js
}

function decodeToken(token) {
    var parts = token.split('.');

    if (parts.length !== 3) {
        throw new Error('The token is invalid')
    }

    var decoded = urlBase64Decode(parts[1]);

    if (!decoded) {
        throw new Error('Cannot decode the token')
    }

    return JSON.parse(decoded)
}

function getTokenExpirationDate(token) {
    var decoded = decodeToken(token);

    if(typeof decoded.exp === 'undefined') {
        return null
    }

    var d = new Date(0);// The 0 here is the key, which sets the date to the epoch
    d.setUTCSeconds(decoded.exp);

    return d
}

function isTokenExpired(token) {
    var d = getTokenExpirationDate(token);

    if (d === null) {
        return false
    }

    // Token expired?
    return !(d.valueOf() > (new Date().valueOf()))
}

/**
 * Get IDs of users in the specified group
 *
 * @param {Object} connection - the connection object provided by ActionHero
 * @param {Number} groupId - the group ID
 * @param {Function<err, members>} callback - the callback. Receives either an error
 *        or the list of group's users an array of numeric IDs
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
 * Get groups that the current user can access.
 *
 * @param {Object} connection - the connection object provided by ActionHero
 * @param {Function<err, groupIds>} callback - the callback. Receives either an error
 *        or the list of group's users an array of numeric IDs
 */
function getMemberGroups(connection, callback) {
    getToken(connection, function (err, token) {
        if (err) {
            callback(err);
            return;
        }

        var userId = (connection.caller.userId || 0);

        // calls
        callService({
            url: v3url + 'groups?membershipType=user&memberId=' + userId,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }, function (err, body) {
            if (err) {
                callback(err);
            } else {
                var groupIds = body.result.content.map(function (item) {
                    return item.id;
                });

                var memberGroups = [];

                groupIds.forEach(function(groupId) {
                    callService({
                        url: v3url + 'groups/' + groupId + '/getParentGroup?oneLevel=false',
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    }, function (err, body) {
                        var idx = groupIds.indexOf(groupId);
                        groupIds.splice(idx, 1);

                        if (err) {
                            callback(err);
                        } else {
                            var groupResponse = body.result.content;
                            while(groupResponse) {
                                memberGroups.push(groupResponse.id);
                                groupResponse = groupResponse.parentGroup;
                            }

                            if (groupIds.length == 0) {
                                callback(null, memberGroups);
                            }

                        }
                    })
                });
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
         * @param {Number} groupId - the group ID
         * @param {Function<err, isIn>} callback - the callback. The second parameter
         *        is boolean which is true if the user has group id in challenge groups.
         */
        isUserInGroup: function (connection, groupId, callback) {
            getMemberGroups(connection, function (err, groupIds) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, groupIds.indexOf("" + groupId) >= 0);
                }
            });
        }
    };
    next();
};
