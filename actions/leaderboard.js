/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author panoptimum
 */

/*jslint node:true, nomen: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var util = require('util');

/**
 * Handle the leaderboard api.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 */
function getLeaderboard(api, connection, next) {
    var helper = api.helper,
        params = connection.params,
    /**
     * The leaderboard types to be processable by this API.
     */
        types = ['referral'],
    /**
     * Map that contains the declarations to process a request for a specific type of leaderboard.
     */
        processor = {
            /**
             * Functionality to process referral leaderboard
             *
             * An object for async.auto to be called upon.
             * Contains the functionality to process the leaderboard
             * specific parameters and creates the leaderboard to be returned
             * to the client. The entry that creates
             * the leaderboard should be named "leaderboard".
             */
            referral: {
                utmMedium: function (cb) {
                    var utmMedium = params.utmMedium,
                        error = _.isUndefined(utmMedium) ? null
                              : helper.checkString(utmMedium, "utmMedium")
                                || helper.checkContains(
                                    ["\"\"", "__all__", "appirio"],
                                    utmMedium.toLowerCase(),
                                    "utmMedium"
                                );
                    if (error) {
                        cb(error);
                    } else {
                        utmMedium = _.isUndefined(utmMedium) || '""' === utmMedium ? "nonappirio" : utmMedium;
                        cb(null, utmMedium.toLowerCase());
                    }
                },
                sqlParams: [
                    'utmMedium',
                    function (cb, results) {
                        switch (results.utmMedium) {
                        case "__all__":
                            cb(
                                null,
                                {
                                    utmMedium: "__ALL__",
                                    comparator: "<>"
                                }
                            );
                            break;
                        case "appirio":
                            cb(
                                null,
                                {
                                    utmMedium: "Appirio",
                                    comparator: "="
                                }
                            );
                            break;
                        case "nonappirio":
                            cb(
                                null,
                                {
                                    utmMedium: "NonAppirio",
                                    comparator: "<>"
                                }
                            );
                            break;
                        }
                    }
                ],
                query: [
                    'sqlParams',
                    function (cb, results) {
                        api.dataAccess.executeQuery(
                            "get_referral_leaderboard",
                            results.sqlParams,
                            connection.dbConnectionMap,
                            cb
                        );
                    }
                ],
                leaderboard: [
                    'query',
                    function (cb, results) {
                        var members = {
                            "__all__": "",
                            "appirio": " appirio",
                            "nonappirio": " non-appirio"
                        },
                            description = util.format(
                                util.format(
                                    "The leaderbaord returns all%s members that have referred at" +
                                        " least one new member in the last 6 months.",
                                    members[results.utmMedium]
                                )
                            ),
                            scoreType = "points",
                            scoreLabel = "referrals",
                            entries = results.query.length,
                            list = _.map(
                                results.query,
                                function (entry) {
                                    var handle = entry.handle,
                                        memberSince = entry.member_since,
                                        photo = _.isUndefined(entry.photo) ? null : entry.photo,
                                        country = entry.country,
                                        ratingType = _.isUndefined(entry.rating) ? helper.getCoderColor(0)
                                                   : helper.getCoderColor(entry.rating),
                                        score = entry.score;
                                    return _.reduce(
                                        {
                                            handle: handle,
                                            score: score,
                                            photo: photo,
                                            memberSince: memberSince,
                                            country: country,
                                            ratingType: ratingType
                                        },
                                        function (memo, value, key) {
                                            if (!_.isNull(value)) {memo[key] = value; }
                                            return memo;
                                        },
                                        {}
                                    );
                                }
                            );
                        cb(
                            null,
                            {
                                entries: entries,
                                description: description,
                                scoreType: scoreType,
                                scoreLabel: scoreLabel,
                                result: list
                            }
                        );
                    }
                ]

            }
        };

    // Execute the functionality
    async.auto(
        {
            type: function (cb) {
                var type = params.type,
                    error = helper.checkStringPopulated(type, "type")
                         || helper.checkContains(types, type.toLowerCase(), "type");
                if (error) {
                    cb(error);
                } else {
                    cb(null, type.toLowerCase());
                }
            },
            leaderboard: [
                'type',
                function (cb, results) {
                    async.auto(
                        processor[results.type],
                        function (error, results) {
                            if (error) {
                                cb(error);
                            } else {
                                cb(null, results.leaderboard);
                            }
                        }
                    );
                }
            ]
        },
        function (error, results) {
            if (error) {
                helper.handleError(api, connection, error);
            } else {
                connection.response = results.leaderboard;
            }
            next(connection, true);
        }
    );
}

/**
 * The leaderboard api.
 */
exports.getLeaderboard = {
    name: 'getLeaderboard',
    description: 'This is an end point for generic leaderboard api.',
    inputs: {
        required: ['type'],
        optional: ['utmMedium']
    },
    cacheEnabled : false,
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // read-only access
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getLeaderboard#run", 'debug');
            getLeaderboard(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
