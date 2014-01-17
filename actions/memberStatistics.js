/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.6
 * @author Sky_, TCSASSEMBLER, Ghost_141
 * changes in 1.1:
 * - implement marathon statistics
 * changes in 1.2:
 * - implement studio and software statistics
 * changes in 1.3:
 * - implement srm (Algorithm) statistics
 * changes in 1.4:
 * - Update the checkUserExists function since the query has been standardized.
 * changes in 1.5:
 * - implement get user basic profile.
 * changes in 1.6:
 * Update srm (Algorithm) statistics and marathon statistics api to add 'history' and 'distribution' field.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Check whether given user is registered.
 * If user not exist then NotFoundError is returned to callback.
 * @param {String} handle - the handle to check
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err>} callback - the callback function
 */
function checkUserExists(handle, api, dbConnectionMap, callback) {
    api.dataAccess.executeQuery("check_coder_exist", { handle: handle }, dbConnectionMap, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (result && result[0] && result[0].handle_exist !== 0) {
            callback();
        } else {
            callback(new NotFoundError("User does not exist."));
        }
    });
}

/**
 * check whether given user is activated.
 * @param {String} handle - the handle to check.
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err>} callback - the callback function
 */
function checkUserActivated(handle, api, dbConnectionMap, callback) {
    api.dataAccess.executeQuery('check_coder_activated', { handle: handle }, dbConnectionMap, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (result && result[0] && result[0].status === 'A') {
            callback();
        } else {
            callback(new BadRequestError('User is not activated.'));
        }
    });
}

/**
 * Get the user basic profile information.
 * @param {Object} api - the api object.
 * @param {Object} dbConnectionMap - the database connection map.
 * @param {Object} connection - the connection.
 * @param {Function} next - the callback function.
 */
function getBasicUserProfile(api, dbConnectionMap, connection, next) {
    var handle = connection.params.handle,
        helper = api.helper,
        sqlParams = {
            handle: handle
        },
        result,
        badgeProperties = api.configData.badge.properties,
        badgeLink = api.configData.badge.link;

    async.waterfall([
        function (cb) {
            checkUserExists(handle, api, dbConnectionMap, cb);
        }, function (cb) {
            checkUserActivated(handle, api, dbConnectionMap, cb);
        }, function (cb) {
            var execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery('get_user_basic_profile_' + name, sqlParams, dbConnectionMap, cbx);
                };
            };

            async.parallel({
                basic: execQuery('basic'),
                earning: execQuery('overall_earning'),
                ratingSummary: execQuery('rating_summary'),
                achievements: execQuery('achievements')
            }, cb);
        }, function (results, cb) {
            var basic = results.basic[0], earning = results.earning[0], ratingSummary = results.ratingSummary,
                achievements = results.achievements,
                mapRatingSummary = function (ratings) {
                    var ret = [];
                    ratings.forEach(function (item) {
                        ret.push({
                            name: helper.getPhaseName(item.phase_id),
                            rating: item.rating,
                            colorStyle: helper.getColorStyle(item.rating)
                        });
                    });
                    return ret;
                },
                mapAchievements = function (achievements) {
                    var ret = [], achieveItem;
                    achievements.forEach(function (item) {
                        achieveItem = {
                            date: item.achievement_date,
                            description: item.description
                        };
                        if (item.id > 0) {
                            _.extend(achieveItem, {
                                badgeLink: {
                                    url: badgeLink,
                                    leftOffset: badgeProperties[item.id].left,
                                    topOffset: badgeProperties[item.id].top
                                }
                            });
                        }
                        ret.push(achieveItem);
                    });
                    return ret;
                };
            result = {
                handle: basic.handle,
                country: basic.country,
                memberSince: basic.member_since,
                overallEarning: earning.overall_earning,
                quote: basic.quote,
                photoLink: basic.photo_link || '',
                isCopilot: {
                    value: basic.is_copilot,
                    software: basic.is_software_copilot,
                    studio: basic.is_studio_copilot
                },
                isPM: basic.is_pm,

                ratingSummary: mapRatingSummary(ratingSummary),
                Achievements: mapAchievements(achievements)
            };

            if (!_.isDefined(basic.show_earnings) || basic.show_earnings === 'hide') {
                delete result.overallEarning;
            }

            if (result.isPM) {
                delete result.ratingSummary;
            }

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

/**
 * map the history info from database to json object.
 * @param {Object} rows the database results.
 * @returns {Array} the array that contains the history info.
 */
function mapHistory(rows) {
    var ret = [];
    rows.forEach(function (item) {
        ret.push({
            challengeId: item.challenge_id,
            challengeName: item.challenge_name,
            date: item.date,
            rating: item.rating,
            placement: item.placement,
            percentile: item.percentile === 'N/A' ? 'N/A' : Number(item.percentile).toFixed(2) + '%'
        });
    });
    return ret;
}

/**
 * map the distribution info from database to json object.
 * @param {Object} rows the database results.
 */
function mapDistribution(rows) {
    var ret = [], maxRating, step, i, start, num, pairs;
    maxRating = _.max(rows, function (item) {
        return item.rating;
    }).rating;
    pairs = _.object(_.map(rows, function (item) {
        return item.rating;
    }), _.map(rows, function (item) {
        return item.number;
    }));

    step = parseInt(maxRating / 100, 10) + 1;
    for (i = 0; i < step; i = i + 1) {
        start = i * 100;
        num = pairs[start];
        ret.push({
            range: start + '-' + (start + 99),
            number: _.isDefined(num) ? num : 0
        });
    }
    return ret;
}

/**
* The API for getting marathon statistics
*/
exports.getMarathonStatistics = {
    name: "getMarathonStatistics",
    description: "getMarathonStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle,
                algoRatingType: 3
            },
            result;
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExists(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                checkUserActivated(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var executeQuery = function (sqlName, cbx) {
                    api.dataAccess.executeQuery(sqlName, sqlParams, dbConnectionMap, cbx);
                };

                async.parallel({
                    details: function (cbx) {
                        executeQuery('get_member_marathon_statistics', cbx);
                    },
                    history: function (cbx) {
                        executeQuery('get_member_marathon_statistics_history', cbx);
                    },
                    distribution: function (cbx) {
                        executeQuery('get_algorithm_statistics_distribution', cbx);
                    }
                }, cb);
            }, function (results, cb) {
                var details = results.details[0], history = results.history, distribution = results.distribution;
                if (results.details.length === 0) {
                    cb(new NotFoundError('statistics not found'));
                    return;
                }
                result = {
                    "handle": details.handle,
                    "rating": details.rating,
                    "percentile": details.percentile === 'N/A' ? 'N/A' : Number(details.percentile).toFixed(2) + '%',
                    "rank": details.rank || 'not ranked',
                    "countryRank": details.country_rank || 'not ranked',
                    "schoolRank": details.school_rank || 'not ranked',
                    "volatility": details.vol,
                    "maximumRating": details.maximum_rating,
                    "minimumRating": details.minimum_rating,
                    "defaultLanguage": details.default_language,
                    "competitions": details.competitions,
                    "mostRecentEventName": details.most_recent_event_name,
                    "mostRecentEventDate": _.isDefined(details.most_recent_event_date) ? details.most_recent_event_date.toString('MM.dd.yy') : '',
                    "bestRank": details.best_rank,
                    "wins": details.wins,
                    "topFiveFinishes": details.top_five_finishes,
                    "topTenFinishes": details.top_ten_finishes,
                    "avgRank": details.avg_rank,
                    "avgNumSubmissions": details.avg_num_submissions,

                    "History": mapHistory(history),
                    "Distribution": mapDistribution(distribution)
                };
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


/**
* The API for getting software statistics
*/
exports.getSoftwareStatistics = {
    name: "getSoftwareStatistics",
    description: "getSoftwareStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw", "tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getSoftwareStatistics#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle
            },
            result = {
                handle: handle,
                Tracks: {}
            };
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExists(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                checkUserActivated(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name, cbx) {
                    api.dataAccess.executeQuery(name,
                        sqlParams,
                        dbConnectionMap,
                        cbx);
                };
                async.parallel({
                    tracks: function (cbx) {
                        execQuery("get_software_member_statistics_track", cbx);
                    },
                    copilotStats: function (cbx) {
                        execQuery("get_software_member_statistics_copilot", cbx);
                    }
                }, cb);
            }, function (results, cb) {
                var round2 = function (n) {
                    return Math.round(n * 100) / 100;
                };
                results.tracks.forEach(function (track) {
                    result.Tracks[track.category_name] = {
                        rating: track.rating,
                        activePercentile: track.active_percentile.toFixed(2) + "%",
                        activeRank: track.active_rank,
                        activeCountryRank: track.active_country_rank,
                        activeSchoolRank: track.active_school_rank,
                        overallPercentile: track.overall_percentile.toFixed(2) + "%",
                        overallRank: track.overall_rank,
                        overallCountryRank: track.overall_country_rank,
                        overallSchoolRank: track.overall_school_rank,
                        volatility: track.vol,
                        competitions: track.num_ratings,
                        maximumRating: track.max_rating,
                        minimumRating: track.min_rating,
                        inquiries: track.num_ratings,
                        submissions: track.submissions,
                        submissionRate: _.getPercent(track.submission_rate, 2),
                        passedScreening: track.passed_screening,
                        screeningSuccessRate: _.getPercent(track.screening_success_rate, 2),
                        passedReview: track.passed_review,
                        reviewSuccessRate: _.getPercent(track.review_success_rate, 2),
                        appeals: track.appeals,
                        appealSuccessRate: _.getPercent(track.appeal_success_rate, 2),
                        maximumScore: round2(track.max_score),
                        minimumScore: round2(track.min_score),
                        averageScore: round2(track.avg_score),
                        averagePlacement: round2(track.avg_placement),
                        wins: track.wins,
                        winPercentage: _.getPercent(track.win_percent, 2)
                    };
                });
                results.copilotStats.forEach(function (track) {
                    if (helper.checkNumber(track.reviewer_rating) && track.completed_contests === 0) {
                        return;
                    }
                    if (!result.Tracks[track.category_name]) {
                        result.Tracks[track.category_name] = {};
                    }
                    var data = result.Tracks[track.category_name], copilotFulfillment;
                    if (!helper.checkNumber(track.reviewer_rating)) {
                        data.reviewerRating = track.reviewer_rating;
                    }
                    if (track.completed_contests !== 0) {
                        data.copilotCompletedContests = track.completed_contests;
                        data.copilotRepostedContests = track.reposted_contests;
                        data.copilotFailedContests = track.failed_contests;
                        copilotFulfillment = 1 - data.copilotFailedContests / data.copilotCompletedContests;
                        data.copilotFulfillment = _.getPercent(copilotFulfillment, 0);
                    }
                });
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


/**
* The API for getting studio statistics
*/
exports.getStudioStatistics = {
    name: "getStudioStatistics",
    description: "getStudioStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw", "tcs_catalog", "tcs_dw"],
    run: function (api, connection, next) {
        api.log("Execute getStudioStatistics#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle
            },
            result = {
                handle: handle,
                Tracks: {}
            };
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                checkUserExists(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                checkUserActivated(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name, cbx) {
                    api.dataAccess.executeQuery(name,
                        sqlParams,
                        dbConnectionMap,
                        cbx);
                };
                async.parallel({
                    tracks: function (cbx) {
                        execQuery("get_studio_member_statistics_track", cbx);
                    },
                    copilotStats: function (cbx) {
                        execQuery("get_studio_member_statistics_copilot", cbx);
                    }
                }, cb);
            }, function (results, cb) {
                results.tracks.forEach(function (track) {
                    result.Tracks[track.category_name] = {
                        numberOfSubmissions: track.submissions,
                        numberOfPassedScreeningSubmissions: track.passed_screening,
                        numberOfWinningSubmissions: track.wins
                    };
                });
                results.copilotStats.forEach(function (track) {
                    if (track.completed_contests === 0) {
                        return;
                    }
                    if (!result.Tracks[track.name]) {
                        result.Tracks[track.name] = {};
                    }
                    var data = result.Tracks[track.name];
                    data.copilotCompletedContests = track.completed_contests;
                    data.copilotFailedContests = track.failed_contests;
                });
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


/**
* The API for getting algorithm statistics
*/
exports.getAlgorithmStatistics = {
    name: "getAlgorithmStatistics",
    description: "getAlgorithmStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle,
                algoRatingType: 1
            },
            result;
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExists(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                checkUserActivated(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name) {
                    return function (cbx) {
                        api.dataAccess.executeQuery('get_srm_statistics_' + name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    };
                };
                async.parallel({
                    basic: execQuery("basic"),
                    challenges: execQuery("challenges"),
                    div1: execQuery("division_1"),
                    div2: execQuery("division_2"),
                    history: execQuery('history'),
                    distribution: function (cbx) { api.dataAccess.executeQuery('get_srm_or_marathon_statistics_distribution', sqlParams, dbConnectionMap, cbx); }
                }, cb);
            }, function (results, cb) {
                if (results.basic.length === 0) {
                    cb(new NotFoundError('statistics not found'));
                    return;
                }
                var details = results.basic[0],
                    getSuccess = function (failed, total) {
                        if (total === 0) {
                            return "0.00%";
                        }
                        return (100 - failed / total * 100).toFixed(2) + "%";
                    },
                    mapLevel = function (ele) {
                        return {
                            "submitted": ele.submitted,
                            "failedChallenge": ele.failed_challenge,
                            "failedSys.Test": ele.failed_sys_test,
                            "success%": getSuccess(ele.failed_challenge + ele.failed_sys_test, ele.submitted)
                        };
                    },
                    mapChallenge = function (ele) {
                        return {
                            "failedChallenge": ele.failed_challenge,
                            "challenges": ele.challenges,
                            "success%": getSuccess(ele.failed_challenge, ele.challenges)
                        };
                    },
                    createTotal = function (total, level) {
                        total.submitted = total.submitted + level.submitted;
                        total.failedChallenge = total.failedChallenge + level.failed_challenge;
                        total["failedSys.Test"] = total["failedSys.Test"] + level.failed_sys_test;
                        total["success%"] = getSuccess(total.failedChallenge +
                            total["failedSys.Test"], total.submitted);
                        return total;
                    },
                    createTotalChallenge = function (total, level) {
                        total.failedChallenge = total.failedChallenge + level.failed_challenge;
                        total.challenges = total.challenges + level.challenges;
                        total["success%"] = getSuccess(total.failedChallenge, total.challenges);
                        return total;
                    };
                result = {
                    handle: details.handle,
                    rating: details.rating,
                    percentile: details.percentile + (details.percentile === "N/A" ? "" : "%"),
                    rank: details.rank || "not ranked",
                    countryRank: details.country_rank || "not ranked",
                    schoolRank: details.school_rank || "not ranked",
                    volatility: details.volatility,
                    maximumRating: details.maximum_rating,
                    minimumRating: details.minimum_rating,
                    defaultLanguage: details.default_language,
                    competitions: details.competitions,
                    mostRecentEventName: details.most_recent_event_name,
                    mostRecentEventDate: details.most_recent_event_date ? details.most_recent_event_date.toString("MM.dd.yy") : '',
                    Divisions: {
                        "Division I": {},
                        "Division II": {}
                    },
                    Challenges: {
                        Levels: {}
                    },
                    History: mapHistory(results.history),
                    Distribution: mapDistribution(results.distribution)
                };
                results.div1.forEach(function (ele) {
                    result.Divisions["Division I"][ele.level_name] = mapLevel(ele);
                });
                results.div2.forEach(function (ele) {
                    result.Divisions["Division II"][ele.level_name] = mapLevel(ele);
                });
                result.Divisions["Division I"]["Level Total"] = _.reduce(results.div1, createTotal, {
                    "submitted": 0,
                    "failedChallenge": 0,
                    "failedSys.Test": 0,
                    "success%": "0.00%"
                });
                result.Divisions["Division II"]["Level Total"] = _.reduce(results.div2, createTotal, {
                    "submitted": 0,
                    "failedChallenge": 0,
                    "failedSys.Test": 0,
                    "success%": "0.00%"
                });
                results.challenges.forEach(function (ele) {
                    result.Challenges.Levels[ele.level_name] = mapChallenge(ele);
                });
                result.Challenges.Levels.Total = _.reduce(results.challenges, createTotalChallenge, {
                    "failedChallenge": 0,
                    "challenges": 0,
                    "success%": "0.00%"
                });
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

exports.getBasicUserProfile = {
    name: 'getBasicUserProfile',
    description: 'getBasicUserProfile',
    inputs: {
        required: ['handle'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ['informixoltp', 'topcoder_dw'],
    run: function (api, connection, next) {
        if (!this.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
        } else {
            api.log('Execute getBasicUserProfile#run', 'debug');
            getBasicUserProfile(api, this.dbConnectionMap, connection, next);
        }
    }
};
